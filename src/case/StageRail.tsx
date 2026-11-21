import { Check, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { CaseDetail, StageId, StageInfo } from '../api/cases'
import type { CompetencyModel } from '../api/kompas'
import { ScoreChip } from '../components/Score'
import { fmtDate, fmtDaysLeft } from '../lib/format'
import { competencyName, type CaseCriteria } from '../lib/model'
import { caseUrl } from '../lib/stages'

interface Props {
  detail: CaseDetail
  active: StageId
  model: CompetencyModel
  criteria: CaseCriteria
}

export function StageRail({ detail, active, model, criteria }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const isAssess = active === 'ASSESSMENT' || active === 'FIRST_ASSESSMENT'
  const p = detail.person
  const periodFrom = detail.partI.acknowledgedByEmployeeOn
  const periodTo = detail.partI.assessmentDue
  const evaluator = `${detail.evaluator.firstName} ${detail.evaluator.lastName}, ${detail.evaluator.position}`

  return (
    <aside className="rail" aria-label="Etapy procesu">
      <div className="rail__section">
        <h2 className="h-sub rail__heading">{detail.path === 'FIRST' ? 'Pierwsza ocena · etapy' : 'Ocena okresowa · etapy'}</h2>
        <ol className="rail__stages">
          {detail.stages.map((s, i) => (
            <li key={s.id}>
              <RailItem s={s} index={i} detail={detail} active={s.id === active} />
              {s.id === active && isAssess && <CriteriaNav detail={detail} model={model} criteria={criteria} />}
            </li>
          ))}
        </ol>
      </div>

      <div className="rail__section">
        <h2 className="h-sub rail__heading">Oceniany</h2>
        <dl className="rail__dl">
          <dt>Stanowisko</dt>
          <dd title={p.position}>{p.position}</dd>
          <dt>Komórka</dt>
          <dd title={p.unit}>{p.unit}</dd>
          <dt>Status</dt>
          <dd>{p.employment === 'URZEDNIK' ? 'urzędnik służby cywilnej' : 'pracownik służby cywilnej'}</dd>
          {detail.path === 'FIRST' ? (
            <>
              <dt>Zatrudnienie</dt>
              <dd className="num">{fmtDate(p.hiredOn)}</dd>
            </>
          ) : (
            <>
              <dt>Okres oceny</dt>
              <dd className="num" title={periodFrom ? `${fmtDate(periodFrom)} – ${fmtDate(periodTo)}` : 'rozpocznie się po cz. I'}>
                {periodFrom ? `${fmtDate(periodFrom)} – ${fmtDate(periodTo)}` : 'rozpocznie się po cz. I'}
              </dd>
            </>
          )}
          <dt>Oceniający</dt>
          <dd title={evaluator}>{evaluator}</dd>
        </dl>
      </div>

      {detail.history.length > 0 && (
        <div className="rail__section">
          <button type="button" className="rail__toggle" aria-expanded={showHistory} onClick={() => setShowHistory((v) => !v)}>
            <span className="h-sub">Historia ({detail.history.length})</span>
            <span className="faint small">{showHistory ? 'zwiń' : 'rozwiń'}</span>
          </button>
          {showHistory && (
            <ol className="rail__history">
              {[...detail.history].reverse().map((h, i) => (
                <li key={i} title={`${fmtDate(h.date)} ${h.text}`}>
                  <span className="num faint">{fmtDate(h.date)}</span>
                  <span className="rail__history-text">{h.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </aside>
  )
}

function RailItem({ s, index, detail, active }: { s: StageInfo; index: number; detail: CaseDetail; active: boolean }) {
  const status = s.status.toLowerCase()
  return (
    <Link to={caseUrl(detail.id, s.id)} className={`rail-item rail-item--${status} ${active ? 'is-active' : ''}`} aria-current={active ? 'step' : undefined}>
      <span className="rail-item__marker" aria-hidden="true">
        {s.status === 'DONE' ? <Check size={11} strokeWidth={3} /> : s.status === 'LOCKED' ? <Lock size={10} strokeWidth={2.25} /> : index + 1}
      </span>
      <span className="rail-item__body">
        <span className="rail-item__name" title={s.name}>{s.name}</span>
        <span className="rail-item__meta">
          {s.status === 'DONE' ? (
            <span className="num" title={`Zakończono ${fmtDate(s.completedOn)}`}>Zakończono {fmtDate(s.completedOn)}</span>
          ) : s.deadline?.date ? (
            <span
              className={`num deadline__rel--${s.status === 'CURRENT' ? tone(s.deadline.state) : 'none'}`}
              title={`do ${fmtDate(s.deadline.date)}${s.status === 'CURRENT' ? ` · ${fmtDaysLeft(s.deadline.daysLeft)}` : ''}`}
            >
              do {fmtDate(s.deadline.date)}
              {s.status === 'CURRENT' && ` · ${fmtDaysLeft(s.deadline.daysLeft)}`}
            </span>
          ) : s.deadline ? (
            <span title={s.deadline.label}>{s.deadline.label}</span>
          ) : null}
        </span>
        {active && <span className="rail-item__legal" title={s.legalBasis}>{s.legalBasis}</span>}
      </span>
    </Link>
  )
}

const tone = (st: string) => (st === 'OVERDUE' ? 'danger' : st === 'SOON' ? 'warn' : 'ok')

function CriteriaNav({ detail, model, criteria }: { detail: CaseDetail; model: CompetencyModel; criteria: CaseCriteria }) {
  const [params, setParams] = useSearchParams()
  const selected = params.get('k') ?? criteria.all[0]
  return (
    <ol className="crit-nav" aria-label="Kryteria oceny">
      {criteria.all.map((id) => {
        const decided = detail.decisions[id]
        const ratings = detail.ratings[id] ?? {}
        const touched = Object.keys(ratings).length > 0
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
