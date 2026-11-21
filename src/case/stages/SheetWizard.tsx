import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { CaseDetail } from '../../api/cases'
import { FormProgress, InfoList, InfoRow, InlineAlert } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetPartI } from './SheetPartI'
import { SheetPartII } from './SheetPartII'
import { SheetPartIII } from './SheetPartIII'
import { StageLayout } from './StageLayout'

/** The three parts of the periodic assessment sheet (A, B, C), as in "Podgląd arkusza". */
const SHEET_PARTS = [
  { name: 'Kryteria oceny i termin' },
  { name: 'Ocena okresowa' },
  { name: 'Wniosek o kolejny stopień służbowy' },
] as const

const TOTAL = SHEET_PARTS.length

/** Shown in part I when "Dalej" in part III cannot go on to step 4 yet. */
const CONFIRM_PART_I_FIRST = 'Zatwierdź część I: zaznacz potwierdzenia i przejdź dalej'

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
  const act = useCaseAction(detail.id, { follow: false })
  const [partINotice, setPartINotice] = useState(false)

  useEffect(() => {
    if (readPart(params.get('czesc')) === null) {
      setParams((p) => { p.set('czesc', '1'); return p }, { replace: true })
    }
  }, [params, setParams])

  const goTo = (n: number) => {
    setParams((p) => { p.set('czesc', String(n)); return p })
    document.querySelector('.case-work')?.scrollTo({ top: 0 })
  }

  // "Dalej" after part III goes straight to step 4, "Formularz oceny kompetencji". The assessment period has no
  // screen of its own, so the case is moved on here: the assessed person's acknowledgement of part I (when only
  // that is missing) and the opening of the form. Part I not confirmed yet → back to part I with the reason.
  // A failed action keeps the user in part III, with the message under the form.
  const finish = async () => {
    if (act.isPending) return
    if (!detail.partI.confirmedByEvaluatorOn) {
      setPartINotice(true)
      goTo(1)
      return
    }
    const target = caseUrl(detail.id, 'ASSESSMENT')
    try {
      let current = detail
      if (current.currentStage === 'OPENING_TALK') current = await act.mutateAsync('EMPLOYEE_ACK_PART_I')
      if (current.currentStage === 'OBSERVATION') await act.mutateAsync('START_ASSESSMENT')
      navigate(target)
    } catch {
      // shown by StageError in part III
    }
  }

  const title = `Ocena okresowa pracownika – ${detail.sheetId ? `Arkusz ${detail.sheetId}` : 'arkusz nieustalony'}`

  return (
    <StageLayout info={info} title={title} status={partStatus(detail, part)}>
      <FormProgress
        unit="Część"
        label="Części arkusza"
        steps={SHEET_PARTS.map((p, i) => {
          const n = i + 1
          return { key: String(n), label: p.name, state: n < part ? 'done' : n === part ? 'current' : 'todo' }
        })}
      />

      {part === 1 && (
        <SheetPartI
          {...props}
          notice={partINotice && !detail.partI.confirmedByEvaluatorOn ? CONFIRM_PART_I_FIRST : undefined}
          onNext={() => {
            setPartINotice(false)
            goTo(2)
          }}
        />
      )}
      {part === 2 && <SheetPartII {...props} onBack={() => goTo(1)} onNext={() => goTo(3)} />}
      {part === 3 && (
        <SheetPartIII
          {...props}
          onBack={() => goTo(2)}
          onNext={() => void finish()}
          nextPending={act.isPending}
          nextError={act.error}
        />
      )}
    </StageLayout>
  )
}
