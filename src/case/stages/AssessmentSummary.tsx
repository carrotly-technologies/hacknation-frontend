import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { CaseDetail } from '../../api/cases'
import type { CompetencyModel } from '../../api/kompas'
import { Button } from '../../components/ui'
import { fmtDate } from '../../lib/format'
import { competencyName, type CaseCriteria } from '../../lib/model'
import { liveResult } from '../../lib/result'
import s from './AssessmentSummary.module.css'
import talk from './AssessmentTalkStage.module.css'
import { CompetencyScoresTable, ResultSummary } from './CompetencyScores'

const ATTACHED_LABEL = { YES: 'TAK', NO: 'NIE', NOT_APPLICABLE: 'NIE DOTYCZY' } as const

/** Links next to the parts of the summary ("Zobacz", "Popraw" in "Weryfikacja formularza"). */
export interface SummaryActions {
  partI?: ReactNode
  partII?: ReactNode
  partIII?: ReactNode
  /** A cell per criterion of the scores table (e.g. "Popraw"); its header is read by screen readers only. */
  criterion?: { header: string; cell: (criterionId: string) => ReactNode }
}

/**
 * Read-only summary of the assessment, shared by "Weryfikacja formularza" (with "Popraw" links) and "Ocena końcowa":
 * the sheet, the partial assessments with points and level, the average, band and result, the assessment talk date
 * and the promotion request. `withWriting` adds the justification and the IPRZ conclusions (clamped to 3 lines).
 * The first assessment has no part III; its average shows only once the backend has computed the evaluation.
 */
export function AssessmentSummary({
  detail,
  model,
  criteria,
  actions = {},
  partINote,
  withWriting,
}: {
  detail: CaseDetail
  model: CompetencyModel
  criteria: CaseCriteria
  actions?: SummaryActions
  /** Shown under part I, e.g. that it can no longer be changed. */
  partINote?: ReactNode
  withWriting?: boolean
}) {
  const isFirst = detail.path === 'FIRST'
  const r = liveResult(detail, criteria.all, model)
  const attached = detail.promotionRequest.attached
  const prev = detail.previousAssessment
  const extra = actions.criterion ? [{ header: actions.criterion.header, hiddenHeader: true, cell: actions.criterion.cell }] : []

  return (
    <>
      <h4 className={talk.subheading}>{isFirst ? 'Arkusz pierwszej oceny' : 'Część I · Kryteria oceny i termin'}</h4>
      <div className={talk.summaryRow}>
        <div>
          {isFirst ? (
            <>
              Kryteria: <span className={talk.summaryValue}>{criteria.all.length}</span>
            </>
          ) : (
            <>
              Arkusz {detail.sheetId ?? 'nieustalony'}; kryteria dodatkowe:{' '}
              <span className={talk.summaryValue}>{criteria.additional.map((c) => competencyName(model, c)).join(', ') || 'brak'}</span>; termin
              oceny: <span className={talk.summaryValue}>{fmtDate(detail.partI.assessmentDue)}</span>
            </>
          )}
        </div>
        {actions.partI}
      </div>
      {partINote}

      <h4 className={talk.subheading}>{isFirst ? 'Oceny cząstkowe' : 'Część II · Ocena okresowa'}</h4>
      <CompetencyScoresTable detail={detail} model={model} criteria={criteria.all} caption={isFirst ? 'Oceny cząstkowe' : 'Oceny cząstkowe w części II arkusza'} extra={extra} />
      <ResultSummary result={r} showAverage={!isFirst || !!detail.evaluation} />
      {(!isFirst || detail.assessmentTalkOn || actions.partII) && (
        <div className={talk.summaryRow}>
          <div>
            Data przeprowadzenia rozmowy oceniającej: <span className={talk.summaryValue}>{fmtDate(detail.assessmentTalkOn) || '—'}</span>
            {detail.person.employment === 'URZEDNIK' && !isFirst && (
              <>
                ; poprzednia ocena:{' '}
                <span className={talk.summaryValue}>
                  {prev?.result
                    ? `${prev.result === 'POSITIVE' ? 'pozytywna' : 'negatywna'}${prev.level ? `, ${prev.level}` : ''}${prev.date ? `, ${fmtDate(prev.date)}` : ''}`
                    : 'nie wpisano'}
                </span>
              </>
            )}
          </div>
          {actions.partII}
        </div>
      )}

      {!isFirst && (
        <>
          <h4 className={talk.subheading}>Część III · Wniosek o kolejny stopień służbowy</h4>
          <div className={talk.summaryRow}>
            <div>
              Dołączono wniosek: <span className={talk.summaryValue}>{attached ? ATTACHED_LABEL[attached] : 'nie zaznaczono'}</span>
            </div>
            {actions.partIII}
          </div>
        </>
      )}

      {withWriting && (
        <>
          <h4 className={talk.subheading}>Uzasadnienie przyznanej oceny</h4>
          <ClampedText text={detail.justification} />
          <h4 className={talk.subheading}>{isFirst ? 'Wnioski dotyczące rozwoju zawodowego' : 'Wnioski dotyczące indywidualnego programu rozwoju zawodowego'}</h4>
          <ClampedText text={detail.iprz} />
        </>
      )}
    </>
  )
}

/** Long text shown in 3 lines with "Pokaż całość" / "Zwiń"; the button appears only when the text is longer. */
function ClampedText({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)
  const id = useId()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      // Measured while clamped; once open, the button stays so the text can be collapsed again.
      if (!el.classList.contains(s.clamped)) return
      setOverflows(el.scrollHeight > el.clientHeight + 1)
    }
    measure()
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [text])

  if (!text.trim()) return <p className={talk.summaryValue}>nie wpisano</p>
  return (
    <div className={s.clampBox}>
      <p id={id} ref={ref} className={open ? s.text : `${s.text} ${s.clamped}`}>
        {text}
      </p>
      {(overflows || open) && (
        <div>
          <Button variant="text" size="small" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
            {open ? 'Zwiń' : 'Pokaż całość'}
          </Button>
        </div>
      )}
    </div>
  )
}
