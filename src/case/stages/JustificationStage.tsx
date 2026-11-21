import { Link } from 'react-router'
import { ScoreChip } from '../../components/Score'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtAvg, fmtDate } from '../../lib/format'
import { competencyName } from '../../lib/model'
import { liveResult } from '../../lib/result'
import { caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { MutationError, StageHeader } from './common'
import { FormalCheck } from './FormalCheck'
import { useDraft } from './useDraft'

export function JustificationStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const patch = usePatchCase(detail.id)
  const locked = !!detail.signedByEvaluatorOn
  const r = liveResult(detail, criteria.all, model)
  const negative = r.result === 'NEGATIVE'
  const just = useDraft(detail.justification, (v) => patch.mutate({ justification: v }))
  const iprz = useDraft(detail.iprz, (v) => patch.mutate({ iprz: v }))

  const decided = criteria.all.filter((c) => detail.decisions[c] != null)
  const weakest = [...decided].sort((a, b) => detail.decisions[a] - detail.decisions[b]).slice(0, 2).filter((c) => detail.decisions[c] < 7)
  const devObs = detail.observations.filter((o) => o.kind === 'DEVELOPMENT')

  return (
    <div className="stage">
      <StageHeader title={info.name} />

      {!r.complete && (
        <div className="stage-pad stage-pad--tight">
          <p className="notice notice--warn">
            Nie wszystkie kryteria mają ocenę cząstkową ({r.decided} z {r.total}).{' '}
            <Link to={caseUrl(detail.id, 'ASSESSMENT')}>Wróć do oceny</Link>, aby dokończyć.
          </p>
        </div>
      )}

      <div className="two-col">
        <div className="two-col__main">
          <div className="result-strip">
            <span className={`verdict-tag ${r.result === 'POSITIVE' ? 'verdict-tag--pos' : r.result ? 'verdict-tag--neg' : 'verdict-tag--none'} ${r.provisional ? 'is-provisional' : ''}`}>
              {r.result === 'POSITIVE' ? 'POZYTYWNA' : r.result === 'NEGATIVE' ? 'NEGATYWNA' : 'brak wyniku'}
              {r.provisional && r.result && <span className="verdict-tag__note">wstępnie</span>}
            </span>
            <span className="result-strip__avg num">średnia {fmtAvg(r.average)}</span>
            {r.band && <span className="muted">{r.band.label.toLowerCase()}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="just">
              Uzasadnienie przyznanej oceny okresowej{' '}
              {negative ? <span className="tag tag--danger">obowiązkowe</span> : <span className="tag">fakultatywne</span>}
            </label>
            <p className="field__hint">
              Odnieś się do kryteriów po nazwie i do przyznanego poziomu. Przy ocenach innych niż 5 pkt podaj 1–2 konkretne przykłady. §11 ust. 3–4 rozp. PRM z 4.04.2016.
            </p>
            <textarea
              id="just"
              className="textarea textarea--doc"
              rows={9}
              value={just.value}
              readOnly={locked}
              onChange={(e) => just.change(e.target.value)}
              onBlur={just.flush}
              placeholder={negative ? 'Np. Oceniam wykonywanie obowiązków na poziomie „poniżej oczekiwań”. W kryterium Współpraca…' : 'Np. Oceniana wykonuje obowiązki na poziomie „na poziomie oczekiwań”. W kryterium Rzetelność…'}
            />
          </div>

          <div className="field" style={{ marginTop: 20 }}>
            <label className="field__label" htmlFor="iprz">
              Wnioski dotyczące indywidualnego programu rozwoju zawodowego <span className="tag tag--accent">wymagane</span>
            </label>
            <p className="field__hint">Obszar → forma rozwoju → termin lub sposób monitorowania → oczekiwany efekt. Art. 108 ustawy o służbie cywilnej.</p>
            <textarea
              id="iprz"
              className="textarea textarea--doc"
              rows={6}
              value={iprz.value}
              readOnly={locked}
              onChange={(e) => iprz.change(e.target.value)}
              onBlur={iprz.flush}
              placeholder="Np. Komunikacja (słuchanie rozmówcy): warsztat z prowadzenia spotkań z interesariuszami, I kw. 2027; omówienie postępów po 3 miesiącach."
            />
          </div>
          <p className="save-state faint small" aria-live="polite">
            {patch.isPending ? 'Zapisywanie…' : patch.isSuccess ? 'Zapisano' : ' '}
          </p>
          <MutationError error={patch.error} />

          <FormalCheck detail={detail} label="Zatwierdź ocenę i podpisz" />
        </div>

        <aside className="two-col__side material" aria-label="Materiał do uzasadnienia">
          <h3 className="h-sub">Zestawienie decyzji</h3>
          <table className="mini-table">
            <tbody>
              {criteria.all.map((c) => (
                <tr key={c}>
                  <td className="mini-table__name" title={competencyName(model, c)}>{competencyName(model, c)}</td>
                  <td className="mini-table__pts">
                    <ScoreChip points={detail.decisions[c]} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {decided.some((c) => detail.deviationNotes[c]) && (
            <>
              <h3 className="h-sub material__h">Odstępstwa od sugestii</h3>
              <ul className="material__list">
                {decided.filter((c) => detail.deviationNotes[c]).map((c) => (
                  <li key={c}>
                    <strong>{competencyName(model, c)}:</strong> {detail.deviationNotes[c]}
                  </li>
                ))}
              </ul>
            </>
          )}
          {weakest.length > 0 && (
            <>
              <h3 className="h-sub material__h">Najsłabsze kryteria — kierunki IPRZ</h3>
              <ul className="material__list">
                {weakest.map((c) => (
                  <li key={c}>
                    {competencyName(model, c)} — {detail.decisions[c]} pkt
                  </li>
                ))}
              </ul>
            </>
          )}
          {devObs.length > 0 && (
            <>
              <h3 className="h-sub material__h">Obserwacje „do rozwoju”</h3>
              <ul className="material__list">
                {devObs.map((o) => (
                  <li key={o.id}>
                    <span className="num faint">{fmtDate(o.date)}</span> {competencyName(model, o.criterionId)}: {o.action}
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
