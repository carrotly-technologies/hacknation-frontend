import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button, Field, InlineAlert, TextInput } from '../../components/ui'
import { ScoreChip } from '../../components/Score'
import { useCaseAction } from '../../lib/caseQueries'
import { DEMO_TODAY, fmtAvg, fmtDate } from '../../lib/format'
import { competencyName } from '../../lib/model'
import { liveResult } from '../../lib/result'
import { allows, caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { MutationError, StageHeader } from './common'
import { FormalCheck, SignedStatus } from './FormalCheck'

/**
 * What the assessment talk covers: §10 rozp. PRM z 4.04.2016 (Dz.U. 2016 poz. 470) — „Przed sporządzeniem oceny
 * na piśmie oceniający przeprowadza z ocenianym rozmowę oceniającą, podczas której omawia: 1) główne obowiązki (…)
 * 2) realizację celów (…) 3) kierunki dalszego rozwoju zawodowego (…)”.
 */
const TALK_TOPICS = [
  'Główne obowiązki w okresie oceny i sposób ich realizacji, z uwzględnieniem spełniania kryteriów',
  'Realizacja celów (jeśli zostały wyznaczone)',
  'Kierunki dalszego rozwoju zawodowego i potrzeby w zakresie podnoszenia kwalifikacji',
]
const TALK_LEGAL = '§10 rozp. PRM z 4.04.2016'
const TALK_DATE_ID = 'assessment-talk-date'

/**
 * Step 5 "Weryfikacja formularza": the evaluator meets the assessed person (the assessment talk), records it, and
 * may then correct the sheet (step 3, part II) and the competency form (step 4). Signing is in part II of the sheet
 * and opens only after the talk is recorded (the backend's `availableActions`).
 */
export function JustificationStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const act = useCaseAction(detail.id, { follow: false })
  const signed = !!detail.signedByEvaluatorOn
  const talkOn = detail.assessmentTalkOn
  const [date, setDate] = useState('')
  const r = liveResult(detail, criteria.all, model)
  const canRecord = allows(detail, 'RECORD_ASSESSMENT_TALK')

  const decided = criteria.all.filter((c) => detail.decisions[c] != null)
  const weakest = [...decided]
    .sort((a, b) => detail.decisions[a] - detail.decisions[b])
    .slice(0, 2)
    .filter((c) => detail.decisions[c] < 7)

  const record = (ev: FormEvent) => {
    ev.preventDefault()
    act.mutate({ action: 'RECORD_ASSESSMENT_TALK', ...(date ? { date } : {}) }, { onSuccess: () => setDate('') })
  }

  const status = signed ? (
    <SignedStatus detail={detail} />
  ) : talkOn ? (
    <InlineAlert tone="success" live title={`Rozmowa oceniająca przeprowadzona ${fmtDate(talkOn)}`}>
      Wnioski z rozmowy możesz teraz uwzględnić w formularzach:{' '}
      <Link to={`${caseUrl(detail.id, 'OPENING_TALK')}?czesc=2`}>Popraw formularz oceny</Link>
      {' · '}
      <Link to={caseUrl(detail.id, 'ASSESSMENT')}>Popraw formularz oceny kompetencji</Link>. Ocenę podpiszesz w części II
      formularza oceny.
    </InlineAlert>
  ) : null

  return (
    <div className="stage">
      <StageHeader title={info.name} status={status} />

      {!r.complete && (
        <div className="stage-pad stage-pad--tight">
          <p className="notice notice--warn">
            Nie wszystkie kryteria mają ocenę cząstkową ({r.decided} z {r.total}).{' '}
            <Link to={caseUrl(detail.id, 'ASSESSMENT')}>Wróć do formularza oceny kompetencji</Link>, aby dokończyć.
          </p>
        </div>
      )}

      <div className="two-col">
        <div className="two-col__main">
          <h3 className="h-section">Rozmowa oceniająca</h3>
          <p className="field__hint">
            Przed podpisaniem oceny porozmawiaj z ocenianym osobiście. Podczas rozmowy omów:
          </p>
          <ul className="material__list">
            {TALK_TOPICS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="legal">{TALK_LEGAL}</p>

          {!signed && (
            <form onSubmit={record} style={{ marginTop: 20 }}>
              <Field
                id={TALK_DATE_ID}
                label="Data rozmowy oceniającej"
                hint={
                  talkOn
                    ? `Odnotowano ${fmtDate(talkOn)}. Wpisz inną datę, jeśli trzeba ją poprawić.`
                    : 'Zostaw puste, jeśli rozmowa odbyła się dziś.'
                }
              >
                {(control) => (
                  <TextInput
                    {...control}
                    type="date"
                    width={10}
                    value={date}
                    min={detail.partI.acknowledgedByEmployeeOn ?? undefined}
                    max={DEMO_TODAY}
                    onChange={(e) => setDate(e.target.value)}
                  />
                )}
              </Field>
              <Button
                type="submit"
                variant={talkOn ? 'secondary' : 'primary'}
                loading={act.isPending}
                disabled={!canRecord || (!!talkOn && !date)}
              >
                {talkOn ? 'Zmień datę rozmowy' : 'Rozmowa przeprowadzona'}
              </Button>
              {!canRecord && !r.complete && (
                <p className="blocked-reason">Dostępne po ocenie wszystkich kryteriów</p>
              )}
              <MutationError error={act.error} />
            </form>
          )}

          <FormalCheck detail={detail} title="Do sprawdzenia przed podpisem" />
        </div>

        <aside className="two-col__side material" aria-label="Materiał do rozmowy oceniającej">
          <h3 className="h-sub">Podsumowanie ocen</h3>
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
          <div className="result-strip">
            <span className={`verdict-tag ${r.result === 'POSITIVE' ? 'verdict-tag--pos' : r.result ? 'verdict-tag--neg' : 'verdict-tag--none'} ${r.provisional ? 'is-provisional' : ''}`}>
              {r.result === 'POSITIVE' ? 'POZYTYWNA' : r.result === 'NEGATIVE' ? 'NEGATYWNA' : 'brak wyniku'}
              {r.provisional && r.result && <span className="verdict-tag__note">wstępnie</span>}
            </span>
            <span className="result-strip__avg num">średnia {fmtAvg(r.average)}</span>
            {r.band && <span className="muted">{r.band.label.toLowerCase()}</span>}
          </div>
          {weakest.length > 0 && (
            <>
              <h3 className="h-sub material__h">Najsłabsze kryteria</h3>
              <ul className="material__list">
                {weakest.map((c) => (
                  <li key={c}>
                    {competencyName(model, c)} — {detail.decisions[c]} pkt
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
