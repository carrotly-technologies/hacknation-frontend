import { useQuery } from '@tanstack/react-query'
import { MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { CaseDetail } from '../../api/cases'
import { suggestLevel, type CompetencyModel } from '../../api/kompas'
import { ScoreChip } from '../../components/Score'
import { Button, Field, Fieldset, InlineAlert, TextInput, Checkbox } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { DEMO_TODAY, fmtAvg, fmtDate } from '../../lib/format'
import { competencyName, findCompetency } from '../../lib/model'
import { liveResult } from '../../lib/result'
import { allows, caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import s from './AssessmentTalkStage.module.css'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'

const DATE_ID = 'data-rozmowy'

/**
 * Step 5, "Rozmowa oceniająca" (Poradnik „Oceny okresowe w służbie cywilnej”, Tabela nr 1, etap III; §10 rozp. PRM
 * z 4.04.2016). The evaluator prepares the talk from the draft sheet (read only here), goes through the §10 topics
 * (sent by the API, ticked only as a personal checklist, not saved) and records the date of the talk. Recording it
 * moves the case on to step 6, "Weryfikacja formularza", where the forms can still be corrected.
 */
export function AssessmentTalkStage({ detail, model, criteria, stage, askAssistant }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const act = useCaseAction(detail.id)
  const [date, setDate] = useState(DEMO_TODAY)
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const [dateError, setDateError] = useState<string>()
  const r = liveResult(detail, criteria.all, model)
  const talk = detail.assessmentTalkOn
  const canRecord = allows(detail, 'RECORD_ASSESSMENT_TALK')
  const goals = detail.partI.topics.goals.trim()

  const decided = criteria.all.filter((c) => detail.decisions[c] != null)
  const byPoints = [...decided].sort((a, b) => detail.decisions[b] - detail.decisions[a])
  const strongest = byPoints.filter((c) => detail.decisions[c] > 5).slice(0, 2)
  const weakest = [...byPoints].reverse().filter((c) => detail.decisions[c] < 5).slice(0, 2)

  const record = () => {
    if (!date) {
      setDateError('Wpisz datę rozmowy oceniającej')
      return
    }
    if (date > DEMO_TODAY) {
      setDateError('Data rozmowy nie może być z przyszłości: odnotuj rozmowę po jej przeprowadzeniu')
      return
    }
    setDateError(undefined)
    act.mutate({ action: 'RECORD_ASSESSMENT_TALK', date })
  }

  return (
    <StageLayout
      info={info}
      status={
        talk ? (
          <InlineAlert tone="success" title={`Rozmowa oceniająca przeprowadzona ${fmtDate(talk)}`}>
            Formularze możesz jeszcze poprawić w kroku <Link to={caseUrl(detail.id, 'JUSTIFICATION')}>„Weryfikacja formularza”</Link>.
          </InlineAlert>
        ) : !r.complete ? (
          <InlineAlert tone="warning" title="Formularz oceny kompetencji nie jest jeszcze wypełniony">
            Oceny cząstkowe ma {r.decided} z {r.total} kryteriów. <Link to={caseUrl(detail.id, 'ASSESSMENT')}>Wróć do formularza</Link>, aby
            przygotować arkusz na roboczo przed rozmową.
          </InlineAlert>
        ) : undefined
      }
    >
      <p className={layout.muted}>
        Przed sporządzeniem oceny na piśmie omów z ocenianym jego obowiązki, cele i dalszy rozwój. Materiał poniżej pochodzi z
        formularza wypełnionego na roboczo; ocenę możesz zmienić po rozmowie.
      </p>

      <section aria-labelledby="material-h" className={s.section}>
        <h3 id="material-h" className={s.heading}>Materiał do rozmowy</h3>
        <table className={s.table}>
          <caption className="visually-hidden">Oceny cząstkowe i sugestie systemu dla każdego kryterium</caption>
          <thead>
            <tr>
              <th scope="col">Kryterium</th>
              <th scope="col">Ocena cząstkowa (wersja robocza)</th>
              <th scope="col">Sugestia systemu</th>
            </tr>
          </thead>
          <tbody>
            {criteria.all.map((c) => (
              <tr key={c}>
                <th scope="row">
                  {competencyName(model, c)}
                  {detail.deviationNotes[c] && <span className={s.note}>Odstępstwo od sugestii: {detail.deviationNotes[c]}</span>}
                </th>
                <td data-label="Ocena cząstkowa">
                  <ScoreChip points={detail.decisions[c]} size="sm" />
                </td>
                <td data-label="Sugestia systemu">
                  <Suggestion detail={detail} model={model} criterionId={c} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={layout.muted}>
          Średnia {fmtAvg(r.average)}
          {r.band && ` · ${r.band.label.toLowerCase()}`}
          {r.result && ` · wstępnie ${r.result === 'POSITIVE' ? 'pozytywna' : 'negatywna'}`}. Sugestie są tylko pomocą: ocenę ustalasz Ty.
        </p>
        <div className={s.lists}>
          <div>
            <h4 className={s.subheading}>Najmocniejsze kryteria</h4>
            {strongest.length ? (
              <ul className={layout.bullets}>
                {strongest.map((c) => (
                  <li key={c}>{competencyName(model, c)} ({detail.decisions[c]} pkt)</li>
                ))}
              </ul>
            ) : (
              <p className={layout.muted}>Żadne kryterium nie ma oceny powyżej oczekiwań.</p>
            )}
          </div>
          <div>
            <h4 className={s.subheading}>Najsłabsze kryteria</h4>
            {weakest.length ? (
              <ul className={layout.bullets}>
                {weakest.map((c) => (
                  <li key={c}>{competencyName(model, c)} ({detail.decisions[c]} pkt)</li>
                ))}
              </ul>
            ) : (
              <p className={layout.muted}>Żadne kryterium nie ma oceny poniżej oczekiwań.</p>
            )}
          </div>
        </div>
      </section>

      {detail.assessmentTalkTopics.length > 0 && (
        <Fieldset
          id="tematy-rozmowy"
          legend="Tematy rozmowy oceniającej"
          hint="Lista pomocnicza: zaznaczenia nie są zapisywane. §10 rozp. PRM z 4.04.2016."
        >
          {detail.assessmentTalkTopics.map((t) => (
            <Checkbox
              key={t.id}
              label={t.label}
              hint={
                <>
                  „{t.quote}” ({t.legalBasis})
                  {t.id === 'GOALS' && goals && <span className={s.goals}>Cele z części I: {goals}</span>}
                </>
              }
              checked={!!ticked[t.id]}
              onChange={(e) => setTicked((v) => ({ ...v, [t.id]: e.target.checked }))}
            />
          ))}
        </Fieldset>
      )}

      {askAssistant && (
        <div>
          <Button
            variant="secondary"
            icon={<MessageSquareText size={18} aria-hidden="true" />}
            onClick={() => askAssistant({ mode: 'CONVERSATION', question: 'Przygotuj pytania do rozmowy oceniającej.' })}
          >
            Przygotuj pytania do rozmowy
          </Button>
          <p className={layout.muted}>Asystent zaproponuje pytania na podstawie kryteriów i obserwacji. Nie proponuje ocen.</p>
        </div>
      )}

      {!talk && (
        <section aria-labelledby="record-h" className={s.section}>
          <h3 id="record-h" className={s.heading}>Odnotuj rozmowę</h3>
          <Field id={DATE_ID} label="Data rozmowy oceniającej" hint="Nie może być z przyszłości." error={dateError}>
            {(p) => <TextInput {...p} type="date" width={20} max={DEMO_TODAY} value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <div className={s.actions}>
            <Button loading={act.isPending} disabled={!canRecord} onClick={record}>
              Rozmowa przeprowadzona
            </Button>
            {!canRecord && <p className="blocked-reason">Dostępne po wpisaniu ocen cząstkowych wszystkich kryteriów</p>}
          </div>
          <StageError error={act.error} />
        </section>
      )}
    </StageLayout>
  )
}

/** The advisory suggestion of one criterion from its indicator answers (the same query as in step 4). */
function Suggestion({ detail, model, criterionId }: { detail: CaseDetail; model: CompetencyModel; criterionId: string }) {
  const ratings = detail.ratings[criterionId] ?? {}
  const indicators = findCompetency(model, criterionId)?.indicators ?? []
  const indicatorRatings = indicators.filter((i) => i.id in ratings).map((i) => ({ indicatorId: i.id, points: ratings[i.id] ?? null }))
  const sheetId = detail.path === 'FIRST' ? 'FIRST' : (detail.sheetId ?? 'C')
  const q = useQuery({
    queryKey: ['suggest', sheetId, criterionId, indicatorRatings],
    queryFn: ({ signal }) => suggestLevel({ sheetId, competencyId: criterionId, indicatorRatings }, signal),
    enabled: indicatorRatings.length > 0,
  })
  if (indicatorRatings.length === 0) return <span className={layout.muted}>brak odpowiedzi przy wskaźnikach</span>
  if (!q.data) return <span className={layout.muted}>…</span>
  const p = q.data.suggestedPoints
  return <span>{p == null ? 'brak sugestii' : `${p} pkt${q.data.suggestedLabel ? ` · ${q.data.suggestedLabel.toLowerCase()}` : ''}`}</span>
}
