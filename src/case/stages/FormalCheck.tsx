import { Check, X } from 'lucide-react'
import type { CaseAction, CaseDetail, FormalCheckItem } from '../../api/cases'
import { InlineAlert } from '../../components/ui'
import { SCALE_LABELS } from '../../lib/scale'
import { useCaseAction } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { BlockedReason, MutationError } from './common'
import { allows } from '../../lib/stages'

/** Stage status once the evaluator has signed; the stage passes it to `StageHeader status` (shown under the title). */
export function SignedStatus({ detail }: { detail: CaseDetail }) {
  return (
    <InlineAlert tone="success" title="Ocena podpisana">
      Ocena podpisana przez oceniającego {fmtDate(detail.signedByEvaluatorOn)}. Pola są tylko do odczytu.
    </InlineAlert>
  )
}

/**
 * ✓/✗ list from the backend + the signing action, blocked while any item fails. The signed status is not shown here.
 * Without `label` it is only a checklist (`title`), e.g. "Do sprawdzenia przed podpisem": signing happens elsewhere.
 */
export function FormalCheck({
  detail,
  action = 'SIGN_ASSESSMENT',
  label,
  title = 'Kontrola formalna',
}: {
  detail: CaseDetail
  action?: CaseAction
  label?: string
  title?: string
}) {
  const act = useCaseAction(detail.id)
  const items = [...detail.formalCheck, ...localChecks(detail)]
  const errors = items.filter((i) => !i.ok)
  const signed = !!detail.signedByEvaluatorOn
  return (
    <section className="formal" aria-labelledby="formal-h">
      <div className="formal__head">
        <h3 id="formal-h" className="h-section">{title}</h3>
        <span className={`tag ${errors.length ? 'tag--danger' : 'tag--ok'}`}>
          {errors.length ? `${errors.length} do poprawy` : 'bez uwag'}
        </span>
      </div>
      <ul className="formal__list">
        {items.map((i) => (
          <li key={i.id} className={`formal__item ${i.ok ? 'is-ok' : 'is-err'}`}>
            <span className="formal__icon" aria-label={i.ok ? 'spełnione' : 'niespełnione'}>
              {i.ok ? <Check size={13} strokeWidth={2.5} /> : <X size={13} strokeWidth={2.5} />}
            </span>
            <span className="formal__msg">{i.message}</span>
            {i.legalBasis && <span className="legal">{i.legalBasis}</span>}
          </li>
        ))}
      </ul>
      {label && (!signed || !!act.error) && (
        <div className="formal__foot">
          {!signed && (
            <>
              <button type="button" className="btn btn--primary" disabled={errors.length > 0 || act.isPending || !allows(detail, action)} onClick={() => act.mutate(action)}>
                {label}
              </button>
              {errors.length > 0 && (
                <BlockedReason>
                  Zatwierdzenie jest zablokowane, dopóki lista zawiera błędy. Popraw: {errors.map((e) => e.message.replace(/\.$/, '')).join('; ')}.
                </BlockedReason>
              )}
            </>
          )}
          <MutationError error={act.error} />
        </div>
      )}
    </section>
  )
}

/**
 * Checks the backend does not (yet) perform: the level named in the justification text must match the
 * computed level (examples E5, E7 in the official samples get this wrong).
 */
function localChecks(detail: CaseDetail): FormalCheckItem[] {
  if (detail.path !== 'PERIODIC' || detail.formalCheck.some((i) => /LEVEL_TEXT|level_text/.test(i.id))) return []
  const computed = detail.evaluation?.level?.label.toLowerCase()
  const text = detail.justification.toLowerCase()
  if (!computed || !text.trim()) return []
  const mentioned = Object.values(SCALE_LABELS)
    .map((l) => l.toLowerCase())
    .filter((l) => text.includes(l))
    .sort((a, b) => b.length - a.length)[0]
  const ok = !mentioned || mentioned === computed
  return [
    {
      id: 'LEVEL_TEXT_CLIENT',
      ok,
      message: ok
        ? 'Poziom opisany w uzasadnieniu jest zgodny z wyliczonym.'
        : `W uzasadnieniu wpisano poziom „${mentioned}”, a wyliczony ze średniej to „${computed}”.`,
      legalBasis: '§11 ust. 1 pkt 2 rozp. PRM z 4.04.2016',
    },
  ]
}
