import { DeadlineText } from '../../components/Deadline'
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

  return (
    <div className="stage">
      <StageHeader
        title={info.name}
        legal={info.legalBasis}
        lead={
          isFirst
            ? 'Arkusz wypełnił się z decyzji podjętych w teczce. Oryginał wraz ze sprawozdaniem trafia do akt osobowych, kopia do ocenianego.'
            : 'Arkusz wypełnił się z decyzji podjętych w teczce. Od dnia zapoznania oceniany ma 7 dni na sprzeciw do dyrektora generalnego urzędu; nowy cykl oceny rusza niezależnie od sprzeciwu.'
        }
      />
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
            {acked && detail.objectionDeadline && (
              <div className="notice notice--info">
                <div>
                  <p>
                    <strong>Termin na sprzeciw:</strong> <DeadlineText deadline={detail.objectionDeadline} />
                  </p>
                  <p className="legal legal--wrap">{detail.objectionDeadline.legalBasis}</p>
                  {nextCycle && <p style={{ marginTop: 6 }}>{nextCycle.text}</p>}
                </div>
              </div>
            )}
            {acked && isFirst && <p className="notice notice--ok">Pierwsza ocena zakończona. Przełożony kieruje wniosek do dyrektora generalnego (art. 38 ust. 3 ustawy).</p>}
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
