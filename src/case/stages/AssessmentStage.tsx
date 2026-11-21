import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { CaseDetail, Observation, Points } from '../../api/cases'
import { suggestLevel, type CompetencyModel, type Indicator, type LevelKey } from '../../api/kompas'
import { ScoreChip } from '../../components/Score'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtAvg, fmtDate } from '../../lib/format'
import { competencyName, findCompetency, type CaseCriteria } from '../../lib/model'
import { SCALE_LABELS, SCALE_SHORT, scoreClass } from '../../lib/scale'
import { caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { MutationError, StageHeader } from './common'
import c from './CriteriaNav.module.css'
import { ResultBar } from './ResultBar'

export function AssessmentStage({ detail, model, criteria, stage }: StageProps) {
  const [params, setParams] = useSearchParams()
  const all = criteria.all
  const firstOpen = all.find((c) => detail.decisions[c] == null) ?? all[0]
  const selected = params.get('k') && all.includes(params.get('k')!) ? params.get('k')! : firstOpen
  const idx = all.indexOf(selected)
  const competency = findCompetency(model, selected)
  const patch = usePatchCase(detail.id)
  const locked = !!detail.signedByEvaluatorOn
  const info = detail.stages.find((s) => s.id === stage)!
  const isFirst = detail.path === 'FIRST'
  const scale = criteria.scale

  // Pin the selected criterion in the URL so a decision never moves the user to another criterion.
  useEffect(() => {
    if (!params.get('k') && selected) setParams((p) => { p.set('k', selected); return p }, { replace: true })
  }, [params, selected, setParams])

  const go = (id: string) => {
    setParams((p) => { p.set('k', id); return p }, { replace: true })
    document.querySelector('.case-work')?.scrollTo({ top: 0 })
  }

  if (!competency) {
    return (
      <div className="stage">
        <StageHeader title={info.name} />
        <p className="stage-pad muted">Brak kryteriów do oceny — najpierw ustal arkusz i kryteria w części I.</p>
      </div>
    )
  }

  const ratings = detail.ratings[selected] ?? {}
  // The API merges ratings per indicator and has no "unset" — a choice can only be replaced.
  const setRating = (indicatorId: string, points: Points | null) => {
    patch.mutate({ ratings: { [selected]: { [indicatorId]: points } } })
  }

  const generalObs = detail.observations.filter((o) => o.criterionId === selected && !o.indicatorId)

  return (
    <div className="stage stage--assess">
      <StageHeader title={info.name} />

      <CriteriaNav detail={detail} model={model} criteria={criteria} selected={selected} onPick={go} />

      <div className="assess">
        <div className="assess__main">
          <div className="crit-head">
            <div>
              <p className="crit-head__kicker">
                Kryterium {idx + 1} z {all.length} · {criteria.additional.includes(selected) ? 'dodatkowe' : isFirst ? 'element oceny' : 'obowiązkowe'}
              </p>
              <h3 className="crit-head__title">{competencyName(model, selected)}</h3>
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn--sm btn--ghost" disabled={idx === 0} onClick={() => go(all[idx - 1])}>
                <ArrowLeft size={14} aria-hidden="true" /> Poprzednie
              </button>
              <button type="button" className="btn btn--sm btn--ghost" disabled={idx === all.length - 1} onClick={() => go(all[idx + 1])}>
                Następne <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          {detail.path === 'PERIODIC' && detail.partI.expectations[selected] && (
            <p className="expect-line">
              <span className="h-sub">Oczekiwania z części I</span> {detail.partI.expectations[selected]}
            </p>
          )}

          {generalObs.length > 0 && (
            <div className="obs-general">
              <p className="h-sub">Obserwacje do kryterium (bez wskazanego wskaźnika)</p>
              <ObsList items={generalObs} />
            </div>
          )}

          {locked && (
            <p className="notice notice--info" style={{ marginBottom: 12 }}>
              Ocena została podpisana {fmtDate(detail.signedByEvaluatorOn)} — rubryka jest tylko do odczytu.
            </p>
          )}

          <Rubric
            indicators={competency.indicators}
            scale={scale}
            ratings={ratings}
            observations={detail.observations.filter((o) => o.criterionId === selected)}
            disabled={locked}
            onRate={setRating}
          />
          <MutationError error={patch.error} />
        </div>

        <Verdict key={selected} detail={detail} criterionId={selected} indicators={competency.indicators} scale={scale} locked={locked} onNext={() => {
          const nextOpen = all.slice(idx + 1).find((c) => detail.decisions[c] == null) ?? all.find((c) => c !== selected && detail.decisions[c] == null)
          if (nextOpen) go(nextOpen)
        }} nextLabel={(() => {
          const nextOpen = all.slice(idx + 1).find((c) => detail.decisions[c] == null) ?? all.find((c) => c !== selected && detail.decisions[c] == null)
          return nextOpen ? competencyName(model, nextOpen) : null
        })()} finishHref={caseUrl(detail.id, isFirst ? 'FIRST_CONDITIONS' : 'JUSTIFICATION')} finishLabel={isFirst ? 'Przejdź do warunków i wyniku' : 'Przejdź do uzasadnienia i IPRZ'} />
      </div>

      <ResultBar detail={detail} criteria={all} model={model} onPick={go} active={selected} />
    </div>
  )
}

/* ------------------------------------------------------------------ */

/** All criteria of the sheet in one row at the top of the stage, with the decided points (or progress) of each. */
function CriteriaNav({
  detail,
  model,
  criteria,
  selected,
  onPick,
}: {
  detail: CaseDetail
  model: CompetencyModel
  criteria: CaseCriteria
  selected: string
  onPick: (id: string) => void
}) {
  const listRef = useRef<HTMLOListElement>(null)
  // Keep the selected criterion visible when the row scrolls sideways (phones, many criteria).
  useEffect(() => {
    const list = listRef.current
    const item = list?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!list || !item) return
    const left = item.offsetLeft
    const right = left + item.offsetWidth
    if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) list.scrollLeft = left - 16
  }, [selected])

  return (
    <nav className={c.root} aria-label="Kryteria oceny">
      <ol ref={listRef} className={c.list}>
        {criteria.all.map((id) => {
          const decided = detail.decisions[id]
          const touched = Object.keys(detail.ratings[id] ?? {}).length > 0
          const state = decided != null ? 'decided' : touched ? 'progress' : 'todo'
          const active = id === selected
          return (
            <li key={id}>
              <button
                type="button"
                className={`${c.item} ${state === 'progress' ? c.progress : ''} ${active ? c.active : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => onPick(id)}
              >
                <span className={c.name}>
                  <span>{competencyName(model, id)}</span>
                  {criteria.additional.includes(id) && <span className={c.extra}>dodatkowe</span>}
                </span>
                {state === 'decided' ? (
                  <ScoreChip points={decided} size="sm" />
                ) : (
                  <span className={c.state} title={state === 'progress' ? 'w toku' : 'nieocenione'}>
                    <span className="visually-hidden">{state === 'progress' ? 'w toku' : 'nieocenione'}</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------ */

function Rubric({
  indicators,
  scale,
  ratings,
  observations,
  disabled,
  onRate,
}: {
  indicators: Indicator[]
  scale: number[]
  ratings: Record<string, Points | null>
  observations: Observation[]
  disabled: boolean
  onRate: (indicatorId: string, points: Points | null) => void
}) {
  const [openObs, setOpenObs] = useState<Record<string, boolean>>({})
  return (
    <table className="rubric" style={{ ['--cols' as string]: scale.length }}>
      <colgroup>
        {scale.map((p) => (
          <col key={p} className={p === 5 ? 'is-standard' : ''} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {scale.map((p) => (
            <th key={p} scope="col" className={`rubric__colhead ${p === 5 ? 'is-standard' : ''}`}>
              <span className={`rubric__pts ${scoreClass(p)}`}>{p} pkt</span>
              <span className="rubric__lvl">{SCALE_SHORT[p]}</span>
              {p === 5 && <span className="rubric__std">standard</span>}
            </th>
          ))}
        </tr>
      </thead>
      {indicators.map((ind, i) => {
        const value = ratings[ind.id]
        const skipped = value === null
        const obs = observations.filter((o) => o.indicatorId === ind.id)
        const open = openObs[ind.id] ?? false
        return (
          <tbody key={ind.id} className={`rubric__group ${skipped ? 'is-skipped' : ''}`}>
            <tr className="rubric__indrow">
              <th scope="rowgroup" colSpan={scale.length}>
                <div className="rubric__ind">
                  <span className="rubric__indnum num">{i + 1}.</span>
                  <span className="rubric__indname">{ind.name}</span>
                  <span className="rubric__tools">
                    {obs.length > 0 ? (
                      <button type="button" className="rubric__tool" aria-expanded={open} onClick={() => setOpenObs((s) => ({ ...s, [ind.id]: !open }))}>
                        {open ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
                        Obserwacje ({obs.length})
                      </button>
                    ) : (
                      <span className="rubric__tool rubric__tool--none">Brak obserwacji</span>
                    )}
                    <button
                      type="button"
                      className={`rubric__skip ${skipped ? 'is-on' : ''}`}
                      aria-pressed={skipped}
                      disabled={disabled}
                      title="Nie było okazji zaobserwować tego zachowania — wskaźnik nie wejdzie do sugestii"
                      onClick={() => onRate(ind.id, null)}
                    >
                      <span className="rubric__skipbox" aria-hidden="true">{skipped && <Check size={10} strokeWidth={3} />}</span>
                      Brak podstaw do oceny
                    </button>
                  </span>
                </div>
                {open && obs.length > 0 && (
                  <div className="rubric__obs">
                    <ObsList items={obs} />
                  </div>
                )}
              </th>
            </tr>
            <tr className="rubric__cells">
              {scale.map((p) => {
                const on = value === p
                const text = ind.levels[String(p) as LevelKey]
                return (
                  <td key={p} className={p === 5 ? 'is-standard' : ''}>
                    <button
                      type="button"
                      className={`rubric__cell ${on ? `is-selected ${scoreClass(p)}` : ''}`}
                      aria-pressed={on}
                      aria-label={`${p} pkt, ${SCALE_LABELS[p]}: ${text}`}
                      disabled={disabled}
                      onClick={() => !on && onRate(ind.id, p as Points)}
                    >
                      {on && (
                        <span className="rubric__check" aria-hidden="true">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                      {text}
                    </button>
                  </td>
                )
              })}
            </tr>
          </tbody>
        )
      })}
    </table>
  )
}

function ObsList({ items }: { items: Observation[] }) {
  return (
    <ul className="obs-list">
      {items.map((o) => (
        <li key={o.id} className="obs-item">
          <div className="obs-item__head">
            <span className="num faint">{fmtDate(o.date)}</span>
            <span className={`tag ${o.kind === 'STRENGTH' ? 'tag--ok' : 'tag--warn'}`}>{o.kind === 'STRENGTH' ? 'mocna strona' : 'do rozwoju'}</span>
          </div>
          <dl className="sdr">
            <dt>Sytuacja</dt>
            <dd>{o.situation}</dd>
            <dt>Działanie</dt>
            <dd>{o.action}</dd>
            <dt>Rezultat</dt>
            <dd>{o.result}</dd>
          </dl>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */

function Verdict({
  detail,
  criterionId,
  indicators,
  scale,
  locked,
  onNext,
  nextLabel,
  finishHref,
  finishLabel,
}: {
  detail: CaseDetail
  criterionId: string
  indicators: Indicator[]
  scale: number[]
  locked: boolean
  onNext: () => void
  nextLabel: string | null
  finishHref: string
  finishLabel: string
}) {
  const patch = usePatchCase(detail.id)
  const ratings = detail.ratings[criterionId] ?? {}
  const indicatorRatings = indicators.filter((i) => i.id in ratings).map((i) => ({ indicatorId: i.id, points: ratings[i.id] ?? null }))
  const sheetId = detail.path === 'FIRST' ? 'FIRST' : (detail.sheetId ?? 'C')
  const suggestion = useQuery({
    queryKey: ['suggest', sheetId, criterionId, indicatorRatings],
    queryFn: ({ signal }) => suggestLevel({ sheetId, competencyId: criterionId, indicatorRatings }, signal),
    enabled: indicatorRatings.length > 0,
    placeholderData: keepPreviousData,
  })
  const s = indicatorRatings.length > 0 ? suggestion.data : undefined
  const decision = detail.decisions[criterionId]
  const suggested = s?.suggestedPoints ?? null
  const deviates = decision != null && suggested != null && decision !== suggested
  const [note, setNote] = useState(detail.deviationNotes[criterionId] ?? '')

  const decide = (p: number) => patch.mutate({ decisions: { ...detail.decisions, [criterionId]: p } })
  const unrated = indicators.filter((i) => !(i.id in ratings)).length
  const allDecided = Object.keys(detail.decisions).length > 0 && nextLabel === null && decision != null

  return (
    <aside className="verdict" aria-label="Werdykt kryterium">
      <section className="verdict__block">
        <h4 className="h-sub">Sugestia systemu</h4>
        {indicatorRatings.length === 0 ? (
          <p className="verdict__empty">Oceń co najmniej jeden wskaźnik, a system zaproponuje poziom kryterium.</p>
        ) : !s ? (
          <p className="verdict__empty">Liczenie…</p>
        ) : (
          <>
            <div className="verdict__suggest">
              <ScoreChip points={s.suggestedPoints} />
              <span className="verdict__suggest-label">{s.suggestedLabel ?? 'brak sugestii'}</span>
            </div>
            <div className="calc" aria-label="Wyliczenie sugestii">
              <div className="calc__row">
                {indicators.map((ind, i) => (
                  <span key={ind.id} className="calc__cell" title={ind.name}>
                    <span className="calc__w">W{i + 1}</span>
                    {ind.id in ratings ? (
                      ratings[ind.id] === null ? <span className="calc__skip">b.p.</span> : <ScoreChip points={ratings[ind.id]} size="sm" />
                    ) : (
                      <span className="calc__skip">—</span>
                    )}
                  </span>
                ))}
              </div>
              <p className="calc__line num">
                średnia {fmtAvg(s.mean)} → najbliższa wartość skali: <strong>{s.suggestedPoints ?? '—'} pkt</strong>
              </p>
              <p className="calc__meta">
                Ocenione wskaźniki: {s.ratedCount} z {indicators.length}
                {s.skippedCount > 0 && ` · bez podstaw: ${s.skippedCount}`}
                {unrated > 0 && ` · nieocenione: ${unrated}`}
              </p>
            </div>
            <details className="verdict__rule">
              <summary>Jak to liczymy</summary>
              <p>{s.rationale}</p>
            </details>
            {s.warnings.map((w) => (
              <p key={w} className="notice notice--warn verdict__warn">{w}</p>
            ))}
          </>
        )}
      </section>

      <section className="verdict__block verdict__block--decision">
        <h4 className="h-sub">Decyzja przełożonego</h4>
        <p className="verdict__hint">Ocenę cząstkową wybierasz Ty. Sugestia jest tylko pomocą.</p>
        <div className="seg" role="radiogroup" aria-label="Ocena cząstkowa kryterium">
          {scale.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={decision === p}
              className={`seg__opt ${decision === p ? `is-on ${scoreClass(p)}` : ''} ${suggested === p ? 'is-suggested' : ''}`}
              disabled={locked}
              title={SCALE_LABELS[p]}
              onClick={() => decide(p)}
            >
              <span className="num">{p}</span>
            </button>
          ))}
        </div>
        <p className="seg__caption">
          {decision != null ? (
            <>
              <strong>{decision} pkt</strong> · {SCALE_LABELS[decision]}
            </>
          ) : suggested != null ? (
            <span className="faint">Kropka pod przyciskiem oznacza sugestię systemu.</span>
          ) : (
            <span className="faint">Nie podjęto decyzji.</span>
          )}
        </p>
        {suggested != null && decision !== suggested && !locked && (
          <button type="button" className="btn btn--sm" onClick={() => decide(suggested)}>
            Przyjmij sugestię ({suggested} pkt)
          </button>
        )}
        {decision === 1 && detail.path === 'PERIODIC' && (
          <p className="notice notice--danger verdict__warn">Ocena 1 pkt w którymkolwiek kryterium oznacza ocenę okresową negatywną (§11 ust. 1 pkt 4 rozp. 2016).</p>
        )}
        {deviates && (
          <div className="field verdict__why">
            <label className="field__label" htmlFor={`why-${criterionId}`}>
              Dlaczego decyzja różni się od sugestii? <span className="faint">(opcjonalnie)</span>
            </label>
            <textarea
              id={`why-${criterionId}`}
              className="textarea"
              rows={3}
              value={note}
              disabled={locked}
              placeholder="Np. powtarzalność zachowania, złożoność sytuacji, zakres uprawnień, obserwacje spoza wskaźników."
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => {
                if (note !== (detail.deviationNotes[criterionId] ?? ''))
                  patch.mutate({ deviationNotes: { ...detail.deviationNotes, [criterionId]: note } })
              }}
            />
          </div>
        )}
        <MutationError error={patch.error} />
      </section>

      <div className="verdict__next">
        {nextLabel ? (
          <button type="button" className="btn btn--primary" disabled={decision == null} onClick={onNext}>
            Następne: {nextLabel} <ArrowRight size={14} aria-hidden="true" />
          </button>
        ) : allDecided ? (
          <Link className="btn btn--primary" to={finishHref}>
            {finishLabel} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ) : null}
        {decision == null && nextLabel && <p className="blocked-reason">Wybierz ocenę cząstkową, aby przejść dalej.</p>}
      </div>
    </aside>
  )
}
