import { Check, X } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'react-router'
import type { CaseAction, CaseDetail, FormalCheckItem, StageId } from '../../api/cases'
import { Accordion, Button, InlineAlert } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import type { CaseCriteria } from '../../lib/model'
import { SCALE_LABELS } from '../../lib/scale'
import { allows, caseUrl } from '../../lib/stages'
import { MutationError } from './common'
import s from './FormalCheck.module.css'

/** Stage status once the evaluator has signed; the stage passes it to `StageHeader status` (shown under the title). */
export function SignedStatus({ detail }: { detail: CaseDetail }) {
  return (
    <InlineAlert tone="success" title="Ocena podpisana">
      Ocena podpisana przez oceniającego {fmtDate(detail.signedByEvaluatorOn)}. Pola są tylko do odczytu.
    </InlineAlert>
  )
}

/** DOM ids of the fields on the same screen; "Popraw" moves focus to them instead of opening another step. */
export interface FormalCheckFields {
  justification?: string
  iprz?: string
  /** First-assessment conditions (the first exam radio). */
  conditions?: string
}

type Props = {
  detail: CaseDetail
  /** Criteria of the case: "Popraw" at a partial score opens step 4 on the competency to fix (`?k=`). */
  criteria?: Pick<CaseCriteria, 'all' | 'scale'>
  fields?: FormalCheckFields
  action?: CaseAction
  /** The signing button; without it only the list ("Weryfikacja formularza" signs with `SignAssessment`). */
  label?: string
}

/**
 * Formal check before signing: one summary alert, the items to fix (always open, each with its legal basis and a
 * "Popraw" link where the item belongs to a field or step) and the met ones collapsed. The items and the rules
 * come from the backend; signing stays blocked while any item fails. The signed status is not shown here.
 */
export function FormalCheck({ detail, criteria, fields = {}, action = 'SIGN_ASSESSMENT', label }: Props) {
  const act = useCaseAction(detail.id)
  const uid = useId()
  const items = [...detail.formalCheck, ...localChecks(detail)]
  const errors = items.filter((i) => !i.ok)
  const passed = items.filter((i) => i.ok)
  const signed = !!detail.signedByEvaluatorOn
  const headingId = `${uid}-h`
  const summaryId = `${uid}-summary`
  return (
    <section className={s.root} aria-labelledby={headingId}>
      <h3 id={headingId} className={s.title}>
        Kontrola formalna
      </h3>
      <div id={summaryId}>
        {errors.length > 0 ? (
          <InlineAlert tone="error" title={`Do poprawy przed podpisem: ${errors.length}`} />
        ) : (
          <InlineAlert tone="success" title="Kontrola formalna bez uwag" />
        )}
      </div>

      {errors.length > 0 && (
        <div className={s.group}>
          <h4 className={s.groupTitle}>Do poprawy ({errors.length})</h4>
          <ul className={s.list}>
            {errors.map((i) => (
              <CheckRow key={i.id} item={i} uid={uid} fix={fixFor(i, detail, criteria, fields)} />
            ))}
          </ul>
        </div>
      )}

      {passed.length > 0 && (
        <div className={s.passed}>
          <Accordion
            items={[
              {
                title: `Spełnione (${passed.length})`,
                content: (
                  <ul className={s.list}>
                    {passed.map((i) => (
                      <CheckRow key={i.id} item={i} uid={uid} />
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        </div>
      )}

      {label && (!signed || !!act.error) && (
        <div className={s.actions}>
          {!signed && (
            <Button
              disabled={errors.length > 0 || !allows(detail, action)}
              loading={act.isPending}
              aria-describedby={errors.length > 0 ? summaryId : undefined}
              onClick={() => act.mutate(action)}
            >
              {label}
            </Button>
          )}
          <MutationError error={act.error} />
        </div>
      )}
    </section>
  )
}

type Fix = { field: string } | { to: string }

function CheckRow({ item, uid, fix }: { item: FormalCheckItem; uid: string; fix?: Fix | null }) {
  const Icon = item.ok ? Check : X
  const msgId = `${uid}-${item.id}`
  return (
    <li className={s.item}>
      <Icon className={item.ok ? s.iconOk : s.iconErr} size={20} strokeWidth={2.5} aria-hidden="true" />
      <div className={s.body}>
        <p id={msgId} className={s.message}>
          <span className="visually-hidden">{item.ok ? 'Spełnione: ' : 'Niespełnione: '}</span>
          {item.message}
        </p>
        {item.legalBasis && <p className={s.legal}>{item.legalBasis}</p>}
      </div>
      {fix && 'to' in fix && (
        <Link className={s.fix} to={fix.to} aria-describedby={msgId}>
          Popraw
        </Link>
      )}
      {fix && 'field' in fix && (
        <a
          className={s.fix}
          href={`#${fix.field}`}
          aria-describedby={msgId}
          onClick={(ev) => {
            const el = document.getElementById(fix.field)
            if (!el) return
            ev.preventDefault()
            el.focus()
            el.scrollIntoView({ block: 'center' })
          }}
        >
          Popraw
        </a>
      )}
    </li>
  )
}

/**
 * Where "Popraw" leads for a check item, by the item `id` from the backend (formal-check.rules.ts): a field on the
 * same screen when the stage passes its id, else the step (and part or competency) where it is filled in.
 * Unknown ids and items nobody can fix in the app (the first-assessment window) get no link.
 */
function fixFor(item: FormalCheckItem, detail: CaseDetail, criteria: Props['criteria'], fields: FormalCheckFields): Fix | null {
  const first = detail.path === 'FIRST'
  const has = (stage: StageId) => detail.stages.some((x) => x.id === stage)
  const step = (stage: StageId, query?: Record<string, string>): Fix | null =>
    has(stage) ? { to: `${caseUrl(detail.id, stage)}${query ? `?${new URLSearchParams(query)}` : ''}` } : null
  const field = (id: string | undefined, fallback: Fix | null): Fix | null => (id ? { field: id } : fallback)
  const sheetPart = (n: number) => step('OPENING_TALK', { czesc: String(n) })
  const assessment = (k: string | undefined) => step(first ? 'FIRST_ASSESSMENT' : 'ASSESSMENT', k ? { k } : undefined)

  if (/LEVEL_TEXT/i.test(item.id)) return field(fields.justification, first ? step('FIRST_CONDITIONS') : sheetPart(2))
  switch (item.id) {
    case 'SHEET_SELECTED':
      return step('OSP_ANALYSIS')
    case 'ASSESSMENT_TALK_HELD':
      return step('ASSESSMENT_TALK')
    case 'PART_I_CONFIRMED':
    case 'ADDITIONAL_CRITERIA_CONSISTENT':
      return sheetPart(1)
    case 'ALL_CRITERIA_DECIDED':
      return assessment(criteria?.all.find((c) => detail.decisions[c] == null))
    case 'POINTS_IN_SCALE':
      return assessment(Object.keys(detail.decisions).find((c) => criteria && !criteria.scale.includes(detail.decisions[c])))
    case 'JUSTIFICATION_IF_NEGATIVE':
      return field(fields.justification, first ? step('FIRST_CONDITIONS') : sheetPart(2))
    case 'IPRZ_REQUIRED':
    case 'DEVELOPMENT_ONLY_IF_POSITIVE':
      return field(fields.iprz, first ? step('FIRST_CONDITIONS') : sheetPart(2))
    case 'FIRST_CONDITIONS_FILLED':
      return field(fields.conditions, step('FIRST_CONDITIONS'))
    case 'PROMOTION_REQUEST':
      // The YES/NO answer is in part II; the request itself, once attached, in part III.
      return sheetPart(detail.promotionRequest.attached === 'YES' ? 3 : 2)
    default:
      return null
  }
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
