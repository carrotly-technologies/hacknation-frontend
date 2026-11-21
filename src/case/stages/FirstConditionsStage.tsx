import type { ExamPassed } from '../../api/cases'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtAvg, fmtDate } from '../../lib/format'
import { liveResult } from '../../lib/result'
import type { StageProps } from '../CasePage'
import { MutationError, StageHeader } from './common'
import { FormalCheck, SignedStatus } from './FormalCheck'
import { useDraft } from './useDraft'

const EXAM: { v: ExamPassed; label: string; hint?: string }[] = [
  { v: 'YES', label: 'TAK' },
  { v: 'NO', label: 'NIE' },
  { v: 'NOT_APPLICABLE', label: 'NIE DOTYCZY', hint: 'absolwent KSAP, zatrudnienie na zastępstwo lub na wyższym stanowisku' },
]

export function FirstConditionsStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const patch = usePatchCase(detail.id)
  const locked = !!detail.signedByEvaluatorOn
  const fc = detail.firstConditions
  const r = liveResult(detail, criteria.all, model)
  const negative = r.result === 'NEGATIVE'
  const just = useDraft(detail.justification, (v) => patch.mutate({ justification: v }))
  const dev = useDraft(detail.iprz, (v) => patch.mutate({ iprz: v }))
  const onTime = fc?.reportSubmittedOn && fc.reportDue ? fc.reportSubmittedOn <= fc.reportDue : null

  return (
    <div className="stage">
      <StageHeader title={info.name} status={locked && <SignedStatus detail={detail} />} />
      <div className="stage-pad">
        <div className="cond-grid">
          <fieldset className="cond" disabled={locked}>
            <legend className="cond__legend">Oceniany zaliczył egzamin ze służby przygotowawczej</legend>
            <div className="radio-row">
              {EXAM.map((o) => (
                <label key={o.v} className={`radio-pill ${fc?.examPassed === o.v ? 'is-on' : ''}`}>
                  <input
                    type="radio"
                    name="exam"
                    checked={fc?.examPassed === o.v}
                    onChange={() => patch.mutate({ firstConditions: { examPassed: o.v } })}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <p className="field__hint">NIE DOTYCZY: {EXAM[2].hint}. §10 ust. 1 pkt 1 i ust. 3 rozp. PRM z 23.07.2015.</p>
          </fieldset>

          <div className="cond">
            <p className="cond__legend">Sprawozdanie złożone w wyznaczonym terminie</p>
            <dl className="dl">
              <dt>Termin</dt>
              <dd className="num">{fmtDate(fc?.reportDue)}</dd>
              <dt>Złożono</dt>
              <dd className="num">{fmtDate(fc?.reportSubmittedOn)}</dd>
              <dt>W terminie</dt>
              <dd>
                {onTime === null ? <span className="faint">—</span> : onTime ? <span className="tag tag--ok">TAK</span> : <span className="tag tag--danger">NIE</span>}
              </dd>
            </dl>
            <p className="field__hint">Wyliczane z dat. §10 ust. 1 pkt 2 rozp. PRM z 23.07.2015.</p>
          </div>
        </div>

        <div className="result-strip" style={{ marginTop: 20 }}>
          <span className={`verdict-tag ${r.result === 'POSITIVE' ? 'verdict-tag--pos' : r.result ? 'verdict-tag--neg' : 'verdict-tag--none'} ${r.provisional ? 'is-provisional' : ''}`}>
            {r.result === 'POSITIVE' ? 'POZYTYWNA' : r.result === 'NEGATIVE' ? 'NEGATYWNA' : 'brak wyniku'}
            {r.provisional && r.result && <span className="verdict-tag__note">wstępnie</span>}
          </span>
          <span className="result-strip__avg num">ocena łączna {fmtAvg(r.average)}</span>
          <span className="muted small">{r.reason}</span>
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label className="field__label" htmlFor="just1">
            Uzasadnienie
            {!negative && <span className="field__optional"> (opcjonalne)</span>}
          </label>
          <textarea id="just1" className="textarea textarea--doc" rows={6} readOnly={locked} value={just.value} onChange={(e) => just.change(e.target.value)} onBlur={just.flush} />
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label className="field__label" htmlFor="dev1">
            Wnioski dotyczące rozwoju zawodowego
            {!negative && <span className="field__optional"> (opcjonalne)</span>}
          </label>
          <textarea
            id="dev1"
            className="textarea textarea--doc"
            rows={4}
            readOnly={locked || negative}
            value={dev.value}
            onChange={(e) => dev.change(e.target.value)}
            onBlur={dev.flush}
            placeholder={negative ? 'Przy ocenie negatywnej nie wpisuje się wniosków rozwojowych (§10 ust. 6 rozp. 2015).' : 'Zakres wiedzy i umiejętności do rozwinięcia, formy rozwoju.'}
          />
        </div>
        <MutationError error={patch.error} />
        <FormalCheck detail={detail} label="Zatwierdź pierwszą ocenę i podpisz" />
      </div>
    </div>
  )
}
