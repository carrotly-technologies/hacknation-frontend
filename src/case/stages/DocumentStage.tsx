import { DeadlineText } from '../../components/Deadline'
import { InlineAlert } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { SheetDocument } from '../../sheet/SheetDocument'
import type { StageProps } from '../CasePage'
import { BlockedReason, MutationError, StageHeader } from './common'
import { allows } from '../../lib/stages'

export function DocumentStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const act = useCaseAction(detail.id)
  const isFirst = detail.path === 'FIRST'
  const sent = detail.availableActions
    ? !detail.availableActions.includes('SEND_FOR_ACK') && !!detail.signedByEvaluatorOn
    : detail.status !== 'W_TOKU' || !!detail.acknowledgedOn
  const acked = !!detail.acknowledgedOn
  const steps = [
    { label: 'Ocena podpisana przez oceniającego', date: detail.signedByEvaluatorOn, done: !!detail.signedByEvaluatorOn },
    { label: 'Przekazana ocenianemu do zapoznania', date: null, done: sent },
    { label: isFirst ? 'Oceniany zapoznał się z pierwszą oceną' : 'Oceniany zapoznał się z oceną', date: detail.acknowledgedOn, done: acked },
  ]
  const nextCycle = detail.history.filter((h) => h.text.startsWith('Nowy cykl')).at(-1)
  // One status once the assessed person has acknowledged the assessment: the end of the first assessment
  // and/or the objection deadline that starts on that day.
  const status = acked && (isFirst || detail.objectionDeadline) && (
    <InlineAlert
      tone={isFirst ? 'success' : 'info'}
      title={isFirst ? 'Pierwsza ocena zakończona' : `Oceniany zapoznał się z oceną ${fmtDate(detail.acknowledgedOn)}`}
    >
      {isFirst && <p>Przełożony kieruje wniosek do dyrektora generalnego (art. 38 ust. 3 ustawy).</p>}
      {detail.objectionDeadline && (
        <>
          <p>
            <strong>Termin na sprzeciw:</strong> <DeadlineText deadline={detail.objectionDeadline} />
          </p>
          <p className="legal legal--wrap">{detail.objectionDeadline.legalBasis}</p>
        </>
      )}
      {nextCycle && <p>{nextCycle.text}</p>}
    </InlineAlert>
  )

  return (
    <div className="stage">
      <StageHeader title={info.name} status={status} />
      <div className="stage-pad">
        <div className="doc-flow">
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.label} className={`steps__item ${s.done ? 'is-done' : ''}`}>
                <span className="steps__num num">{i + 1}</span>
                <span className="steps__label" title={s.label}>{s.label}</span>
                <span className="steps__date num">{s.done ? (s.date ? fmtDate(s.date) : 'tak') : '—'}</span>
              </li>
            ))}
          </ol>
          <div className="doc-flow__actions">
            {!sent && (
              <button type="button" className="btn btn--primary" disabled={act.isPending || !detail.signedByEvaluatorOn || !allows(detail, 'SEND_FOR_ACK')} onClick={() => act.mutate('SEND_FOR_ACK')}>
                Przekaż do zapoznania
              </button>
            )}
            {sent && !acked && (
              <>
                <button type="button" className="btn btn--primary" disabled={act.isPending || !allows(detail, 'EMPLOYEE_ACK_ASSESSMENT')} onClick={() => act.mutate('EMPLOYEE_ACK_ASSESSMENT')}>
                  Oceniany zapoznał się z oceną
                </button>
                <BlockedReason>W wersji demonstracyjnej potwierdzenie ocenianego symulujemy przyciskiem. Datą zapoznania będzie dzisiejsza data.</BlockedReason>
              </>
            )}
            <MutationError error={act.error} />
          </div>
        </div>

        <div className="paper-preview" aria-label="Podgląd arkusza">
          <SheetDocument detail={detail} model={model} criteria={criteria} />
        </div>
      </div>
    </div>
  )
}
