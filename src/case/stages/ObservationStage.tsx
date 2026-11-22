import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import type { Observation } from '../../api/cases'
import { useAddObservation, useCaseAction } from '../../lib/caseQueries'
import { DEMO_TODAY, fmtDate } from '../../lib/format'
import { competencyName, findCompetency } from '../../lib/model'
import { allows, caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { MutationError, StageHeader } from './common'

const empty = (crit: string): Omit<Observation, 'id'> => ({
  date: DEMO_TODAY,
  criterionId: crit,
  indicatorId: null,
  kind: 'STRENGTH',
  situation: '',
  action: '',
  result: '',
})

export function ObservationStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const done = info.status === 'DONE'
  const add = useAddObservation(detail.id)
  // One navigation, to step 4: with every partial rating drafted in part II the case is already at ASSESSMENT_TALK
  // after START_ASSESSMENT, and following it would land on step 5 first (#137).
  const act = useCaseAction(detail.id, { follow: false })
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(() => empty(criteria.all[0] ?? ''))
  const [filter, setFilter] = useState<string>('')

  const comp = findCompetency(model, form.criterionId)
  const counts = Object.fromEntries(criteria.all.map((c) => [c, detail.observations.filter((o) => o.criterionId === c).length]))
  const thin = criteria.all.filter((c) => counts[c] < 2)
  const list = [...detail.observations].filter((o) => !filter || o.criterionId === filter).sort((a, b) => b.date.localeCompare(a.date))
  const indicatorName = (o: Observation) => {
    const c = findCompetency(model, o.criterionId)
    const idx = c?.indicators.findIndex((i) => i.id === o.indicatorId) ?? -1
    return idx >= 0 ? `W${idx + 1}. ${c!.indicators[idx].name}` : null
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    add.mutate(form, {
      onSuccess: () => {
        setForm(empty(form.criterionId))
        setFormOpen(false)
      },
    })
  }

  const start = () =>
    act.mutate('START_ASSESSMENT', { onSuccess: () => navigate(caseUrl(detail.id, 'ASSESSMENT')) })

  return (
    <div className="stage">
      <StageHeader
        title={info.name}
        actions={
          !done && (
            <button type="button" className="btn" onClick={() => setFormOpen((v) => !v)} aria-expanded={formOpen}>
              <Plus size={15} aria-hidden="true" /> Dodaj obserwację
            </button>
          )
        }
      />

      <div className="two-col">
        <div className="two-col__main">
          {formOpen && (
            <form className="obs-form panel" onSubmit={submit}>
              <div className="obs-form__row">
                <label className="field">
                  <span className="field__label">Data</span>
                  <input type="date" className="input" value={form.date} max={DEMO_TODAY} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field__label">Kryterium</span>
                  <select className="select" value={form.criterionId} onChange={(e) => setForm({ ...form, criterionId: e.target.value, indicatorId: null })}>
                    {criteria.all.map((c) => (
                      <option key={c} value={c}>{competencyName(model, c)}</option>
                    ))}
                  </select>
                </label>
                <fieldset className="field obs-form__kind">
                  <legend className="field__label">Rodzaj</legend>
                  <div className="radio-row">
                    {(['STRENGTH', 'DEVELOPMENT'] as const).map((k) => (
                      <label key={k} className={`radio-pill ${form.kind === k ? 'is-on' : ''}`}>
                        <input type="radio" name="kind" checked={form.kind === k} onChange={() => setForm({ ...form, kind: k })} />
                        {k === 'STRENGTH' ? 'Mocna strona' : 'Do rozwoju'}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <label className="field">
                <span className="field__label">Wskaźnik <span className="faint">(opcjonalne)</span></span>
                <select className="select" value={form.indicatorId ?? ''} onChange={(e) => setForm({ ...form, indicatorId: e.target.value || null })}>
                  <option value="">Dotyczy całego kryterium</option>
                  {comp?.indicators.map((i, n) => (
                    <option key={i.id} value={i.id}>W{n + 1}. {i.name}</option>
                  ))}
                </select>
              </label>
              <div className="obs-form__sdr">
                {(
                  [
                    ['situation', 'Sytuacja', 'Co się działo, kiedy, w jakim kontekście?'],
                    ['action', 'Działanie', 'Co konkretnie zrobił(a) oceniany?'],
                    ['result', 'Rezultat', 'Jaki był skutek?'],
                  ] as const
                ).map(([k, label, ph]) => (
                  <label key={k} className="field">
                    <span className="field__label">{label}</span>
                    <textarea className="textarea" rows={3} required placeholder={ph} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </label>
                ))}
              </div>
              <div className="btn-row">
                <button type="submit" className="btn btn--primary" disabled={add.isPending}>Zapisz obserwację</button>
                <button type="button" className="btn btn--ghost" onClick={() => setFormOpen(false)}>Anuluj</button>
              </div>
              <MutationError error={add.error} />
            </form>
          )}

          <div className="timeline-head">
            <h3 className="h-section">Dziennik obserwacji <span className="faint num">({detail.observations.length})</span></h3>
            <select className="select select--inline" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtruj po kryterium">
              <option value="">Wszystkie kryteria</option>
              {criteria.all.map((c) => (
                <option key={c} value={c}>{competencyName(model, c)}</option>
              ))}
            </select>
          </div>
          {list.length === 0 ? (
            <p className="muted">Brak obserwacji{filter ? ' dla tego kryterium' : ''}. Zapisuj je na bieżąco — po kilku miesiącach trudno odtworzyć szczegóły.</p>
          ) : (
            <ol className="timeline">
              {list.map((o) => (
                <li key={o.id} className="timeline__item">
                  <span className="timeline__date num">{fmtDate(o.date)}</span>
                  <div className="timeline__body">
                    <div className="timeline__meta">
                      <strong title={competencyName(model, o.criterionId)}>{competencyName(model, o.criterionId)}</strong>
                      <span className={`tag ${o.kind === 'STRENGTH' ? 'tag--ok' : 'tag--warn'}`}>{o.kind === 'STRENGTH' ? 'mocna strona' : 'do rozwoju'}</span>
                    </div>
                    {indicatorName(o) && <p className="timeline__ind" title={indicatorName(o) ?? undefined}>{indicatorName(o)}</p>}
                    <dl className="sdr">
                      <dt>Sytuacja</dt>
                      <dd>{o.situation}</dd>
                      <dt>Działanie</dt>
                      <dd>{o.action}</dd>
                      <dt>Rezultat</dt>
                      <dd>{o.result}</dd>
                    </dl>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="two-col__side">
          <h3 className="h-sub">Pokrycie kryteriów dowodami</h3>
          <ul className="coverage">
            {criteria.all.map((c) => (
              <li key={c}>
                <button type="button" className={`coverage__row ${filter === c ? 'is-active' : ''}`} onClick={() => setFilter(filter === c ? '' : c)}>
                  <span className="coverage__name" title={competencyName(model, c)}>{competencyName(model, c)}</span>
                  <span className="coverage__bar" aria-hidden="true">
                    {Array.from({ length: Math.max(3, counts[c]) }, (_, i) => (
                      <span key={i} className={i < counts[c] ? 'is-on' : ''} />
                    ))}
                  </span>
                  <span className={`coverage__n num ${counts[c] < 2 ? 'is-thin' : ''}`}>{counts[c]}</span>
                </button>
              </li>
            ))}
          </ul>
          {thin.length > 0 && (
            <p className="notice notice--warn" style={{ marginTop: 12 }}>
              {thin.length > 3 ? `Mniej niż 2 obserwacje w ${thin.length} z ${criteria.all.length} kryteriów.` : `Mało dowodów: ${thin.map((c) => competencyName(model, c)).join(', ')}.`} Bez przykładów ocena opiera się na ogólnym wrażeniu — zbieraj je przed wypełnieniem formularza oceny kompetencji.
            </p>
          )}

          {!done && (
            <div className="side-cta">
              <h3 className="h-sub">Formularz oceny kompetencji</h3>
              <p className="small muted">Rubryka otworzy się z obserwacjami przy wskaźnikach.</p>
              <button type="button" className="btn btn--primary" disabled={act.isPending || !allows(detail, 'START_ASSESSMENT')} onClick={start}>
                Przejdź do formularza oceny kompetencji
              </button>
              <MutationError error={act.error} />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
