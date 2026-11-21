import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { CaseDetail, Observation, Points } from '../../api/cases'
import { suggestLevel, type CompetencyModel, type Indicator, type LevelKey } from '../../api/kompas'
import { Button, ErrorSummary, Field, InlineAlert, RadioGroup, Stepper, TextArea, type FormError } from '../../components/ui'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtAvg, fmtDate } from '../../lib/format'
import { competencyName, findCompetency } from '../../lib/model'
import { caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import s from './AssessmentStage.module.css'
import { ResultBar } from './ResultBar'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'

/** Radio value of "no grounds to assess" (the API stores it as null). */
const SKIP = 'brak'
const DECISION_ID = 'ocena-czastkowa'
const indicatorFieldId = (i: number) => `wskaznik-${i + 1}`

/** Scale labels come from the competency model sent by the API (the legal scale lives in the backend). */
const scaleLabel = (model: CompetencyModel, p: number) => model.scale.find((l) => l.points === p)?.label ?? ''

/**
 * "Formularz oceny kompetencji": one competency per page, in the order of the "Proponowany formularz"
 * questions. Every indicator is a question with the behaviours of the competency model as answers; the
 * system suggests a partial score and the evaluator decides it. The current competency stays in `?k=`.
 */
export function AssessmentStage({ detail, model, criteria, stage }: StageProps) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const all = criteria.all
  const firstOpen = all.find((c) => detail.decisions[c] == null) ?? all[0]
  const k = params.get('k')
  const selected = k && all.includes(k) ? k : firstOpen
  const idx = all.indexOf(selected)
  const competency = findCompetency(model, selected)
  const patch = usePatchCase(detail.id)
  const locked = !!detail.signedByEvaluatorOn
  const info = detail.stages.find((x) => x.id === stage)!
  const isFirst = detail.path === 'FIRST'
  const scale = criteria.scale
  // Errors belong to the competency they were raised on, so they disappear when it changes.
  const [shown, setShown] = useState<{ k: string; errors: FormError[] }>({ k: '', errors: [] })
  const errors = shown.k === selected ? shown.errors : []

  // Pin the competency in the URL so a decision never moves the user to another competency.
  useEffect(() => {
    if (!k && selected) setParams((p) => { p.set('k', selected); return p }, { replace: true })
  }, [k, selected, setParams])

  if (!competency) {
    return (
      <StageLayout info={info}>
        <p className={layout.muted}>Brak kompetencji do oceny. Najpierw ustal arkusz i kryteria w kroku „Proponowany formularz”.</p>
      </StageLayout>
    )
  }

  const go = (id: string) => {
    setParams((p) => { p.set('k', id); return p }, { replace: true })
    document.querySelector('.case-work')?.scrollTo({ top: 0 })
  }

  const ratings = detail.ratings[selected] ?? {}
  // The API merges ratings per indicator and has no "unset": a choice can only be replaced.
  const setRating = (indicatorId: string, points: Points | null) => {
    patch.mutate({ ratings: { [selected]: { [indicatorId]: points } } })
  }
  const decision = detail.decisions[selected]
  const missing = (ind: Indicator) => !(ind.id in ratings)

  const next = () => {
    if (!locked) {
      const errs: FormError[] = competency.indicators.flatMap((ind, i) =>
        missing(ind) ? [{ id: indicatorFieldId(i), message: `Wskaźnik ${i + 1}: zaznacz jedną odpowiedź` }] : [],
      )
      if (decision == null) errs.push({ id: DECISION_ID, message: 'Wybierz ocenę cząstkową kompetencji' })
      setShown({ k: selected, errors: errs })
      if (errs.length) return
    }
    if (idx < all.length - 1) go(all[idx + 1])
    else navigate(caseUrl(detail.id, isFirst ? 'FIRST_CONDITIONS' : 'JUSTIFICATION'))
  }

  const generalObs = detail.observations.filter((o) => o.criterionId === selected && !o.indicatorId)
  const extra = criteria.additional.includes(selected)
  const expectation = detail.path === 'PERIODIC' ? detail.partI.expectations[selected] : undefined

  return (
    <>
      <StageLayout info={info}>
        <div className={s.form}>
          <Stepper unit={isFirst ? 'Element' : 'Kompetencja'} current={idx + 1} total={all.length} />
          <ErrorSummary errors={errors} />

          {locked && (
            <InlineAlert tone="info" title="Formularz jest tylko do odczytu">
              Ocena została podpisana {fmtDate(detail.signedByEvaluatorOn)}.
            </InlineAlert>
          )}

          <section className={s.competency} aria-labelledby="kompetencja-h">
            <div className={s.head}>
              <h3 id="kompetencja-h" className={s.name}>{competencyName(model, selected)}</h3>
              <span className={`${layout.tag} ${extra ? layout.tagAccent : ''}`}>
                {extra ? 'dodatkowe' : isFirst ? 'element oceny' : 'obowiązkowe'}
              </span>
            </div>
            {expectation && (
              <p className={s.expectation}>
                <strong>Oczekiwania z części I:</strong> {expectation}
              </p>
            )}
            {generalObs.length > 0 && <ObsDetails title="Obserwacje do kompetencji" items={generalObs} />}

            <ol className={s.questions}>
              {competency.indicators.map((ind, i) => {
                const value = ratings[ind.id]
                const obs = detail.observations.filter((o) => o.criterionId === selected && o.indicatorId === ind.id)
                const fieldId = indicatorFieldId(i)
                return (
                  <li key={ind.id} className={s.question}>
                    <RadioGroup
                      id={fieldId}
                      name={`${selected}-${ind.id}`}
                      legend={
                        <>
                          <span className={s.qnum}>{i + 1}.</span> {ind.name}
                        </>
                      }
                      hint="Wybierz zachowanie, które najlepiej opisuje to, co obserwowałeś."
                      error={errors.some((e) => e.id === fieldId) && missing(ind) ? 'Zaznacz jedną odpowiedź' : undefined}
                      value={value === undefined ? '' : value === null ? SKIP : String(value)}
                      onChange={(v) => setRating(ind.id, v === SKIP ? null : (Number(v) as Points))}
                      options={[
                        ...scale.map((p) => ({
                          value: String(p),
                          label: ind.levels[String(p) as LevelKey],
                          hint: `${p} pkt · ${scaleLabel(model, p)}${p === 5 ? ' (standard)' : ''}`,
                          disabled: locked,
                        })),
                        {
                          value: SKIP,
                          label: 'Brak podstaw do oceny',
                          hint: 'Nie było okazji zaobserwować tego zachowania. Wskaźnik nie wejdzie do sugestii.',
                          disabled: locked,
                        },
                      ]}
                    />
                    {obs.length > 0 && <ObsDetails title="Obserwacje przy tym wskaźniku" items={obs} />}
                  </li>
                )
              })}
            </ol>
          </section>

          <Decision
            key={selected}
            detail={detail}
            model={model}
            criterionId={selected}
            indicators={competency.indicators}
            scale={scale}
            locked={locked}
            error={errors.some((e) => e.id === DECISION_ID) && decision == null ? 'Wybierz ocenę cząstkową' : undefined}
          />
          <StageError error={patch.error} />

          <div className={s.actions}>
            <Button onClick={next}>Dalej</Button>
            {idx > 0 && (
              <Button variant="text" onClick={() => go(all[idx - 1])}>
                Wstecz
              </Button>
            )}
          </div>
        </div>
      </StageLayout>

      <ResultBar detail={detail} criteria={all} model={model} onPick={go} active={selected} />
    </>
  )
}

/* ------------------------------------------------------------------ */

function ObsDetails({ title, items }: { title: string; items: Observation[] }) {
  return (
    <details className={s.obs}>
      <summary className={s.obsSummary}>
        <span>
          {title} ({items.length})
        </span>
        <ChevronDown className={s.obsIcon} size={18} aria-hidden="true" />
      </summary>
      <ul className={s.obsList}>
        {items.map((o) => (
          <li key={o.id} className={s.obsItem}>
            <p className={s.obsMeta}>
              {fmtDate(o.date)} · <strong>{o.kind === 'STRENGTH' ? 'mocna strona' : 'do rozwoju'}</strong>
            </p>
            <dl className={s.sdr}>
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
    </details>
  )
}

/* ------------------------------------------------------------------ */

/** System suggestion (advisory only) and the evaluator's partial score of the competency. */
function Decision({
  detail,
  model,
  criterionId,
  indicators,
  scale,
  locked,
  error,
}: {
  detail: CaseDetail
  model: CompetencyModel
  criterionId: string
  indicators: Indicator[]
  scale: number[]
  locked: boolean
  error?: string
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
  const sug = indicatorRatings.length > 0 ? suggestion.data : undefined
  const decision = detail.decisions[criterionId]
  const suggested = sug?.suggestedPoints ?? null
  const deviates = decision != null && suggested != null && decision !== suggested
  const [note, setNote] = useState(detail.deviationNotes[criterionId] ?? '')
  const unrated = indicators.filter((i) => !(i.id in ratings)).length

  const decide = (p: number) => patch.mutate({ decisions: { ...detail.decisions, [criterionId]: p } })

  return (
    <section className={s.decision} aria-labelledby="decyzja-h">
      <h3 id="decyzja-h" className={s.decisionTitle}>Ocena cząstkowa kompetencji</h3>

      <div className={s.suggestion} aria-live="polite">
        <p className={s.suggestionLabel}>Sugestia systemu</p>
        {indicatorRatings.length === 0 ? (
          <p className={layout.muted}>Zaznacz odpowiedź przy co najmniej jednym wskaźniku, a system zaproponuje poziom.</p>
        ) : !sug ? (
          <p className={layout.muted}>Liczenie…</p>
        ) : (
          <>
            <p className={s.suggestionValue}>
              {sug.suggestedPoints != null ? `${sug.suggestedPoints} pkt · ${sug.suggestedLabel ?? scaleLabel(model, sug.suggestedPoints)}` : 'Brak sugestii'}
            </p>
            <ul className={s.calc} aria-label="Odpowiedzi przy wskaźnikach">
              {indicators.map((ind, i) => (
                <li key={ind.id} title={ind.name}>
                  W{i + 1}: {!(ind.id in ratings) ? '—' : ratings[ind.id] === null ? 'b.p.' : `${ratings[ind.id]} pkt`}
                </li>
              ))}
            </ul>
            <p className={s.calcLine}>
              Średnia {fmtAvg(sug.mean)} → najbliższa wartość skali: <strong>{sug.suggestedPoints ?? '—'} pkt</strong>
            </p>
            <p className={layout.muted}>
              Ocenione wskaźniki: {sug.ratedCount} z {indicators.length}
              {sug.skippedCount > 0 && ` · bez podstaw: ${sug.skippedCount}`}
              {unrated > 0 && ` · bez odpowiedzi: ${unrated}`}
            </p>
            <details className={s.rule}>
              <summary>Jak to liczymy</summary>
              <p>{sug.rationale}</p>
            </details>
            {sug.warnings.map((w) => (
              <InlineAlert key={w} tone="warning">
                {w}
              </InlineAlert>
            ))}
          </>
        )}
        {suggested != null && decision !== suggested && !locked && (
          <div>
            <Button variant="secondary" size="small" onClick={() => decide(suggested)}>
              Przyjmij sugestię ({suggested} pkt)
            </Button>
          </div>
        )}
      </div>

      <RadioGroup
        id={DECISION_ID}
        name={`${DECISION_ID}-${criterionId}`}
        legend="Twoja decyzja"
        hint="Ocenę cząstkową wybierasz Ty. Sugestia systemu jest tylko pomocą."
        error={error}
        value={decision == null ? '' : String(decision)}
        onChange={(v) => decide(Number(v))}
        options={scale.map((p) => ({
          value: String(p),
          label: `${p} pkt · ${scaleLabel(model, p)}`,
          hint: suggested === p ? 'Sugestia systemu' : undefined,
          disabled: locked,
        }))}
      />

      {decision === 1 && detail.path === 'PERIODIC' && (
        <InlineAlert tone="error">
          Ocena 1 pkt w którymkolwiek kryterium oznacza ocenę okresową negatywną (§11 ust. 1 pkt 4 rozp. 2016).
        </InlineAlert>
      )}

      {deviates && (
        <Field label="Dlaczego decyzja różni się od sugestii?" optional>
          {(control) => (
            <TextArea
              {...control}
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
          )}
        </Field>
      )}
      <StageError error={patch.error} />
    </section>
  )
}
