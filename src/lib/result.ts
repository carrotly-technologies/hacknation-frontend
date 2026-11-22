import type { CaseDetail } from '../api/cases'
import type { CompetencyModel } from '../api/kompas'
import { fmtAvg } from './format'
import { competencyName } from './model'
import { bandFor } from './scale'

export interface LiveResult {
  decided: number
  total: number
  complete: boolean
  average: number | null
  band: { label: string; range: string } | null
  result: 'POSITIVE' | 'NEGATIVE' | null
  /** true when the result can still change (not every criterion decided, or FIRST conditions missing) */
  provisional: boolean
  reason: string
  legal: string
  /** What is still missing for a final result (partial assessments, the FIRST exam answer); null when nothing is. */
  missing: string | null
}

const R16 = 'rozp. PRM z 4.04.2016'
const R15 = 'rozp. PRM z 23.07.2015'

/**
 * Live result for the sticky bar. Mirrors §11 rozp. 2016 / §10 rozp. 2015; thresholds compared on the
 * exact average. When the backend has computed `evaluation` (all decisions present) it takes precedence.
 */
export function liveResult(detail: CaseDetail, criteria: string[], model: CompetencyModel | undefined): LiveResult {
  return { ...compute(detail, criteria, model), missing: missingFor(detail, criteria) }
}

function missingFor(detail: CaseDetail, criteria: string[]): string | null {
  const left = criteria.filter((c) => detail.decisions[c] === undefined || detail.decisions[c] === null).length
  const parts: string[] = []
  if (left) parts.push(`ocen cząstkowych ${left} z ${criteria.length} kryteriów`)
  if (detail.path === 'FIRST' && !detail.firstConditions?.examPassed) parts.push('odpowiedzi, czy oceniany zaliczył egzamin ze służby przygotowawczej')
  return parts.length ? `Brakuje ${parts.join(' i ')}.` : null
}

function compute(detail: CaseDetail, criteria: string[], model: CompetencyModel | undefined): Omit<LiveResult, 'missing'> {
  const pts = criteria.map((c) => detail.decisions[c]).filter((p): p is number => p !== undefined && p !== null)
  const decided = pts.length
  const total = criteria.length
  const complete = decided === total && total > 0
  const average = decided ? pts.reduce((a, b) => a + b, 0) / decided : null
  const ev = complete ? detail.evaluation : null

  if (detail.path === 'PERIODIC') {
    const band = ev?.level ?? (average !== null ? bandFor(average) : null)
    const ones = criteria.filter((c) => detail.decisions[c] === 1)
    if (ones.length) {
      return {
        decided, total, complete, average, band, result: 'NEGATIVE', provisional: false,
        reason: `${ones.map((c) => `„${competencyName(model, c)}”`).join(', ')}: 1 pkt — ocena negatywna niezależnie od średniej.`,
        legal: `§11 ust. 1 pkt 4 ${R16}`,
      }
    }
    if (average === null) {
      return { decided, total, complete, average, band: null, result: null, provisional: true, reason: 'Wynik pojawi się po pierwszej decyzji.', legal: `§11 ust. 1 ${R16}` }
    }
    const avg = ev?.average ?? average
    const positive = ev ? ev.result === 'POSITIVE' : avg > 4
    let reason: string
    if (avg === 4) reason = 'Średnia wynosi dokładnie 4,00. Ocena pozytywna wymaga średniej wyższej niż 4 pkt.'
    else if (positive) reason = 'Średnia powyżej 4 pkt i żadna ocena cząstkowa nie wynosi 1 pkt.'
    else reason = `Średnia ${fmtAvg(avg)} nie przekracza 4 pkt.`
    if (!complete) reason = `Wstępnie, po ${decided} z ${total} kryteriów. ${reason}`
    return { decided, total, complete, average: avg, band, result: positive ? 'POSITIVE' : 'NEGATIVE', provisional: !complete, reason, legal: `§11 ust. 1 pkt 2–4 ${R16}` }
  }

  // FIRST
  const threes = criteria.filter((c) => detail.decisions[c] === 3).length
  if (threes > 1) {
    return { decided, total, complete, average, band: null, result: 'NEGATIVE', provisional: false, reason: `${threes} oceny po 3 pkt — dopuszczalna jest najwyżej jedna.`, legal: `§10 ust. 1 pkt 3 ${R15}` }
  }
  if (average === null) {
    return { decided, total, complete, average, band: null, result: null, provisional: true, reason: 'Wynik pojawi się po pierwszej decyzji.', legal: `§10 ${R15}` }
  }
  const fc = detail.firstConditions
  const avgOk = average >= 5
  if (!avgOk) {
    return { decided, total, complete, average, band: null, result: 'NEGATIVE', provisional: !complete, reason: `${complete ? '' : 'Wstępnie. '}Ocena łączna ${fmtAvg(average)} jest niższa niż 5 pkt.`, legal: `§10 ust. 1 pkt 4 ${R15}` }
  }
  if (fc?.examPassed === 'NO') {
    return { decided, total, complete, average, band: null, result: 'NEGATIVE', provisional: false, reason: 'Egzamin ze służby przygotowawczej nie został zaliczony.', legal: `§10 ust. 1 pkt 1 ${R15}` }
  }
  const reportLate = fc?.reportDue && (!fc.reportSubmittedOn || fc.reportSubmittedOn > fc.reportDue)
  if (fc?.reportSubmittedOn && reportLate) {
    return { decided, total, complete, average, band: null, result: 'NEGATIVE', provisional: false, reason: 'Sprawozdanie złożono po wyznaczonym terminie.', legal: `§10 ust. 1 pkt 2 ${R15}` }
  }
  if (!fc?.examPassed) {
    return { decided, total, complete, average, band: null, result: 'POSITIVE', provisional: true, reason: 'Punkty spełniają warunki. Wynik zależy jeszcze od egzaminu (etap „Warunki i wynik”).', legal: `§10 ust. 1 ${R15}` }
  }
  const positive = detail.evaluation && complete ? detail.evaluation.result === 'POSITIVE' : true
  return {
    decided, total, complete, average, band: null, result: positive ? 'POSITIVE' : 'NEGATIVE', provisional: !complete,
    reason: `${complete ? '' : 'Wstępnie. '}Ocena łączna co najmniej 5 pkt, najwyżej jedna ocena 3 pkt, warunki egzaminu i sprawozdania spełnione.`,
    legal: `§10 ust. 1 ${R15}`,
  }
}
