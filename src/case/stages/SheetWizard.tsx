import { Check } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { CaseDetail, StageId } from '../../api/cases'
import { InfoList, InfoRow, InlineAlert, Stepper } from '../../components/ui'
import { fmtDate } from '../../lib/format'
import { caseUrl, viewStage } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetPartI } from './SheetPartI'
import { SheetPartII } from './SheetPartII'
import { SheetPartIII } from './SheetPartIII'
import { StageLayout } from './StageLayout'
import s from './SheetWizard.module.css'

/** The three parts of the periodic assessment sheet (A, B, C), as in "Podgląd arkusza". */
const SHEET_PARTS = [
  { name: 'Kryteria oceny i termin' },
  { name: 'Ocena okresowa' },
  { name: 'Wniosek o kolejny stopień służbowy' },
] as const

const TOTAL = SHEET_PARTS.length

function readPart(raw: string | null): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= TOTAL ? n : null
}

/** The status of the part on screen, shown under the stage title; null while the part is still being filled in. */
function partStatus(detail: CaseDetail, part: number): ReactNode {
  const signed = detail.signedByEvaluatorOn
  if (part === 1) {
    const { confirmedByEvaluatorOn: confirmed, acknowledgedByEmployeeOn: acked } = detail.partI
    if (!confirmed) return null
    return (
      <InlineAlert tone="success" title="Część I jest zatwierdzona">
        <InfoList>
          <InfoRow label="Oceniający potwierdza przeprowadzenie rozmowy i ustalenia" value={fmtDate(confirmed)} />
          <InfoRow
            label="Oceniany potwierdza zapoznanie z kryteriami i terminem (od tej daty biegnie okres oceny)"
            value={acked ? fmtDate(acked) : 'Nie potwierdzono'}
          />
        </InfoList>
        <p>Pola są tylko do odczytu. Zmiana jest możliwa tylko w trybie korekty błędów przez administratora.</p>
      </InlineAlert>
    )
  }
  // Part III is a form only when the request is attached; otherwise its own note explains why it is empty.
  if (!signed || (part === 3 && detail.promotionRequest.attached !== 'YES')) return null
  return (
    <InlineAlert tone="info" title="Ocena jest zatwierdzona">
      Oceniający zatwierdził ocenę {fmtDate(signed)}, więc pola są tylko do odczytu.
    </InlineAlert>
  )
}

/**
 * "Formularz oceny": the supervisor fills in the assessment sheet part by part (I → II → III). The current
 * part lives in the URL (`?czesc=1|2|3`), so a refresh keeps the user where they were. Each part saves itself
 * on "Dalej"; what the backend does not allow to edit yet is shown read only with a note on when it opens.
 */
export function SheetWizard(props: StageProps) {
  const { detail, stage } = props
  const info = detail.stages.find((x) => x.id === stage)!
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const part = readPart(params.get('czesc')) ?? 1

  useEffect(() => {
    if (readPart(params.get('czesc')) === null) {
      setParams((p) => { p.set('czesc', '1'); return p }, { replace: true })
    }
  }, [params, setParams])

  const goTo = (n: number) => {
    setParams((p) => { p.set('czesc', String(n)); return p })
    document.querySelector('.case-work')?.scrollTo({ top: 0 })
  }

  // After part III: the stage the case is at now when it is further on, otherwise the next stage of the file.
  // Stages shown in this same view (the assessment period) are skipped, so "Dalej" never reopens part I.
  const finish = () => {
    const ids = detail.stages.map((x) => x.id)
    const elsewhere = (id: StageId) => viewStage(detail.stages, id) !== stage
    const here = ids.indexOf(stage)
    const current = ids.indexOf(detail.currentStage)
    const target = current > here && elsewhere(detail.currentStage) ? detail.currentStage : ids.slice(here + 1).find(elsewhere)
    if (target) navigate(caseUrl(detail.id, target))
  }

  const title = `Ocena okresowa pracownika – ${detail.sheetId ? `Arkusz ${detail.sheetId}` : 'arkusz nieustalony'}`

  return (
    <StageLayout info={info} title={title} status={partStatus(detail, part)}>
      <div className={s.progress}>
        <Stepper unit="Część" current={part} total={TOTAL} name={SHEET_PARTS[part - 1].name} hideText />
        <ol className={s.parts} aria-label="Części arkusza">
          {SHEET_PARTS.map((p, i) => {
            const n = i + 1
            const state = n < part ? 'done' : n === part ? 'current' : 'todo'
            return (
              <li key={n} className={`${s.part} ${s[state]}`} aria-current={n === part ? 'step' : undefined}>
                <span className={s.partMark} aria-hidden="true">
                  {state === 'done' ? <Check size={14} strokeWidth={3} /> : n}
                </span>
                <span className={s.partName}>
                  <span className="visually-hidden">Część {n}: </span>
                  {p.name}
                  {state === 'done' && <span className="visually-hidden"> (za Tobą)</span>}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {part === 1 && <SheetPartI {...props} onNext={() => goTo(2)} />}
      {part === 2 && <SheetPartII {...props} onBack={() => goTo(1)} onNext={() => goTo(3)} />}
      {part === 3 && <SheetPartIII {...props} onBack={() => goTo(2)} onNext={finish} />}
    </StageLayout>
  )
}
