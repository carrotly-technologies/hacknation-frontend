import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { CaseDetail, StageId } from '../api/cases'
import type { CompetencyModel } from '../api/kompas'
import { ScoreChip } from '../components/Score'
import { fmtDate } from '../lib/format'
import { competencyName, type CaseCriteria } from '../lib/model'
import s from './CaseSidebar.module.css'

interface Props {
  detail: CaseDetail
  active: StageId
  model: CompetencyModel
  criteria: CaseCriteria
}

/** Side column of the case: criteria of the assessment (while rating), the assessed person and the history. */
export function CaseSidebar({ detail, active, model, criteria }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const isAssess = active === 'ASSESSMENT' || active === 'FIRST_ASSESSMENT'
  const p = detail.person
  const periodFrom = detail.partI.acknowledgedByEmployeeOn
  const period = periodFrom ? `${fmtDate(periodFrom)} – ${fmtDate(detail.partI.assessmentDue)}` : 'rozpocznie się po części I'
  const evaluator = `${detail.evaluator.firstName} ${detail.evaluator.lastName}, ${detail.evaluator.position}`

  return (
    <aside className={s.root} aria-label="Informacje o sprawie">
      {isAssess && (
        <section className={s.section} aria-labelledby="side-criteria">
          <h2 id="side-criteria" className={s.heading}>Kryteria oceny</h2>
          <CriteriaNav detail={detail} model={model} criteria={criteria} />
        </section>
      )}

      <section className={s.section} aria-labelledby="side-person">
        <h2 id="side-person" className={s.heading}>Oceniany</h2>
        <dl className={s.facts}>
          <Fact label="Komórka" value={p.unit} />
          <Fact label="Status" value={p.employment === 'URZEDNIK' ? 'urzędnik służby cywilnej' : 'pracownik służby cywilnej'} />
          {detail.path === 'FIRST' ? <Fact label="Zatrudnienie" value={fmtDate(p.hiredOn)} /> : <Fact label="Okres oceny" value={period} />}
          <Fact label="Oceniający" value={evaluator} />
        </dl>
      </section>

      {detail.history.length > 0 && (
        <section className={s.section}>
          <button type="button" className={s.toggle} aria-expanded={showHistory} onClick={() => setShowHistory((v) => !v)}>
            <span className={s.heading}>Historia ({detail.history.length})</span>
            <span className={s.toggleHint}>{showHistory ? 'zwiń' : 'rozwiń'}</span>
          </button>
          {showHistory && (
            <ol className={s.history}>
              {[...detail.history].reverse().map((h, i) => (
                <li key={i}>
                  <span className={s.historyDate}>{fmtDate(h.date)}</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </aside>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function CriteriaNav({ detail, model, criteria }: { detail: CaseDetail; model: CompetencyModel; criteria: CaseCriteria }) {
  const [params, setParams] = useSearchParams()
  const selected = params.get('k') ?? criteria.all[0]
  return (
    <ol className="crit-nav" aria-label="Kryteria oceny">
      {criteria.all.map((id) => {
        const decided = detail.decisions[id]
        const touched = Object.keys(detail.ratings[id] ?? {}).length > 0
        const state = decided != null ? 'decided' : touched ? 'progress' : 'todo'
        return (
          <li key={id}>
            <button
              type="button"
              className={`crit-nav__item crit-nav__item--${state} ${id === selected ? 'is-active' : ''}`}
              aria-current={id === selected ? 'true' : undefined}
              onClick={() => setParams((p) => { p.set('k', id); return p }, { replace: true })}
            >
              <span className="crit-nav__name" title={competencyName(model, id)}>
                <span className="crit-nav__label">{competencyName(model, id)}</span>
                {criteria.additional.includes(id) && <span className="crit-nav__extra">dodatkowe</span>}
              </span>
              {state === 'decided' ? (
                <ScoreChip points={decided} size="sm" />
              ) : (
                <span className="crit-nav__state" title={state === 'progress' ? 'w toku' : 'nieocenione'}>
                  <span className="visually-hidden">{state === 'progress' ? 'w toku' : 'nieocenione'}</span>
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
