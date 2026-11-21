import { Check } from 'lucide-react'
import { useState } from 'react'
import type { PartI } from '../../api/cases'
import type { CompetencyModel } from '../../api/kompas'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { addDaysIso, DEMO_TODAY, fmtDate } from '../../lib/format'
import { competencyName, findCompetency } from '../../lib/model'
import type { StageProps } from '../CasePage'
import { BlockedReason, MutationError, StageHeader } from './common'
import { useDraft } from './useDraft'
import { allows } from '../../lib/stages'

type TopicKey = keyof PartI['topics']

const TOPICS: { key: TopicKey; title: string; hint: string; optional?: boolean }[] = [
  { key: 'duties', title: 'Główne obowiązki wynikające z opisu stanowiska pracy', hint: 'Które zadania z OSP są kluczowe w tym okresie?' },
  { key: 'criteria', title: 'Kryteria obowiązkowe i dodatkowe', hint: 'Omów, co każde kryterium oznacza na tym stanowisku.' },
  { key: 'expectations', title: 'Oczekiwania oceniającego co do spełniania kryteriów', hint: 'Szczegóły per kryterium uzupełnisz w tabeli poniżej.' },
  { key: 'goals', title: 'Cele na okres oceny i sposób ich realizacji', hint: 'Tylko jeśli uzasadnia to charakter obowiązków.', optional: true },
]

function defaultExpectation(model: CompetencyModel, id: string) {
  const c = findCompetency(model, id)
  return c ? c.indicators.map((i) => i.levels['5']).join(' ') : ''
}

function addMonthsIso(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

export function OpeningTalkStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const patch = usePatchCase(detail.id)
  const act = useCaseAction(detail.id)
  const confirmed = !!detail.partI.confirmedByEvaluatorOn
  const acked = !!detail.partI.acknowledgedByEmployeeOn
  const afterNegative = detail.cycleLabel.toLowerCase().includes('negatyw')
  const [due, setDue] = useState(detail.partI.assessmentDue ?? addDaysIso(addMonthsIso(DEMO_TODAY, afterNegative ? 6 : 24), 0))
  const [expect, setExpect] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.all.map((c) => [c, detail.partI.expectations[c] ?? defaultExpectation(model, c)])),
  )

  const missing = TOPICS.filter((t) => !t.optional && !detail.partI.topics[t.key]?.trim())

  const confirm = async () => {
    await patch.mutateAsync({ partI: { expectations: expect, assessmentDue: due } })
    act.mutate('CONFIRM_PART_I')
  }

  return (
    <div className="stage">
      <StageHeader title={info.name} />
      <div className="stage-pad stage-pad--narrow">
        {afterNegative && (
          <p className="notice notice--warn" style={{ marginBottom: 16 }}>
            Ponowna ocena po ocenie negatywnej: rozmowę rozpoczynającą przeprowadza się w ciągu 7 dni od sporządzenia oceny (§7 pkt 2 rozp. 2016), a ocenę — po 6 miesiącach od zapoznania (art. 81 ust. 9 ustawy).
          </p>
        )}

        <h3 className="h-section block-h">Zagadnienia rozmowy <span className="legal">§5 ust. 1 rozp. PRM z 4.04.2016</span></h3>
        <ol className="topics">
          {TOPICS.map((t, i) => (
            <Topic key={t.key} index={i + 1} t={t} value={detail.partI.topics[t.key] ?? ''} readOnly={confirmed} criteriaNames={t.key === 'criteria' ? criteria.all.map((c) => competencyName(model, c)) : undefined}
              onSave={(v) => patch.mutate({ partI: { topics: { ...detail.partI.topics, [t.key]: v } } })} />
          ))}
        </ol>

        <h3 className="h-section block-h">Oczekiwania wobec kryteriów</h3>
        <p className="faint small" style={{ marginBottom: 10 }}>
          Domyślnie opis poziomu „na poziomie oczekiwań” z modelu kompetencji. Dostosuj do stanowiska — to stanie się punktem odniesienia przy ocenie.
        </p>
        <table className="table expect-table panel">
          <tbody>
            {criteria.all.map((c) => (
              <tr key={c}>
                <th scope="row">
                  {competencyName(model, c)}
                  {criteria.additional.includes(c) && <span className="tag" style={{ marginLeft: 6 }}>dodatkowe</span>}
                </th>
                <td>
                  <textarea className="textarea" rows={2} readOnly={confirmed} value={expect[c] ?? ''} aria-label={`Oczekiwania: ${competencyName(model, c)}`} onChange={(e) => setExpect((s) => ({ ...s, [c]: e.target.value }))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="h-section block-h">Termin sporządzenia oceny</h3>
        <div className="due-row">
          <input type="date" className="input" style={{ width: 180 }} value={due} readOnly={confirmed} onChange={(e) => setDue(e.target.value)} aria-label="Termin sporządzenia oceny" />
          <span className="faint small">
            Domyślnie {afterNegative ? '6 miesięcy (art. 81 ust. 9 ustawy)' : '24 miesiące (art. 81 ust. 1 ustawy)'}. Po zatwierdzeniu zmiana tylko w trybie zmiany terminu.
          </span>
        </div>

        <div className="confirm-box">
          <ol className="steps">
            <li className={`steps__item ${confirmed ? 'is-done' : ''}`}>
              <span className="steps__num num">{confirmed ? <Check size={12} strokeWidth={3} /> : 1}</span>
              <span className="steps__label" title="Oceniający potwierdza rozmowę i ustalenia (podpis w cz. I)">Oceniający potwierdza rozmowę i ustalenia (podpis w cz. I)</span>
              <span className="steps__date num">{fmtDate(detail.partI.confirmedByEvaluatorOn)}</span>
            </li>
            <li className={`steps__item ${acked ? 'is-done' : ''}`}>
              <span className="steps__num num">{acked ? <Check size={12} strokeWidth={3} /> : 2}</span>
              <span className="steps__label" title="Oceniany potwierdza zapoznanie z kryteriami i terminem — od tej daty biegnie okres oceny">Oceniany potwierdza zapoznanie z kryteriami i terminem — od tej daty biegnie okres oceny</span>
              <span className="steps__date num">{fmtDate(detail.partI.acknowledgedByEmployeeOn)}</span>
            </li>
          </ol>
          <div className="btn-row" style={{ marginTop: 12 }}>
            {!confirmed && (
              <button type="button" className="btn btn--primary" disabled={missing.length > 0 || patch.isPending || act.isPending || !allows(detail, 'CONFIRM_PART_I')} onClick={confirm}>
                Zatwierdź część I
              </button>
            )}
            {confirmed && !acked && (
              <button type="button" className="btn btn--primary" disabled={act.isPending || !allows(detail, 'EMPLOYEE_ACK_PART_I')} onClick={() => act.mutate('EMPLOYEE_ACK_PART_I')}>
                Oceniany potwierdził zapoznanie
              </button>
            )}
          </div>
          {!confirmed && missing.length > 0 && (
            <BlockedReason>Uzupełnij notatki do zagadnień: {missing.map((m) => m.title.toLowerCase()).join('; ')}. Rozporządzenie wymaga omówienia każdego z nich.</BlockedReason>
          )}
          {confirmed && !acked && <BlockedReason>W wersji demonstracyjnej podpis ocenianego symulujemy przyciskiem (data = dziś).</BlockedReason>}
          <MutationError error={patch.error ?? act.error} />
        </div>
      </div>
    </div>
  )
}

function Topic({ index, t, value, readOnly, onSave, criteriaNames }: {
  index: number
  t: (typeof TOPICS)[number]
  value: string
  readOnly: boolean
  onSave: (v: string) => void
  criteriaNames?: string[]
}) {
  const d = useDraft(value, onSave)
  const filled = d.value.trim().length > 0
  return (
    <li className={`topic ${filled ? 'is-done' : ''}`}>
      <span className="topic__mark" aria-hidden="true">{filled ? <Check size={12} strokeWidth={3} /> : index}</span>
      <div className="topic__body">
        <label className="topic__title" htmlFor={`topic-${t.key}`}>
          {t.title} {t.optional && <span className="faint">(opcjonalnie)</span>}
        </label>
        <p className="field__hint">{t.hint}</p>
        {criteriaNames && <p className="topic__crit">{criteriaNames.join(' · ')}</p>}
        <textarea id={`topic-${t.key}`} className="textarea" rows={2} readOnly={readOnly} value={d.value} onChange={(e) => d.change(e.target.value)} onBlur={d.flush} placeholder="Notatka z rozmowy" />
      </div>
    </li>
  )
}
