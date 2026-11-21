import { Lightbulb, MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Field, InlineAlert, TextInput } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { DEMO_TODAY, fmtDate } from '../../lib/format'
import { liveResult } from '../../lib/result'
import { allows, caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import s from './AssessmentTalkStage.module.css'
import { CompetencyScoresTable, ResultSummary } from './CompetencyScores'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'

const DATE_ID = 'data-rozmowy'

/**
 * Step 5, "Rozmowa oceniająca" (Poradnik „Oceny okresowe w służbie cywilnej”, Tabela nr 1, etap III; §10 rozp. PRM
 * z 4.04.2016). The evaluator prepares the talk from the draft sheet (read only here), goes through the §10 topics
 * (sent by the API, shown as a system suggestion, not a checklist) and records the date of the talk. Recording it
 * moves the case on to step 6, "Weryfikacja formularza", where the forms can still be corrected.
 */
export function AssessmentTalkStage({ detail, model, criteria, stage, askAssistant }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const act = useCaseAction(detail.id)
  const [date, setDate] = useState(DEMO_TODAY)
  const [dateError, setDateError] = useState<string>()
  const r = liveResult(detail, criteria.all, model)
  const talk = detail.assessmentTalkOn
  const canRecord = allows(detail, 'RECORD_ASSESSMENT_TALK')
  const goals = detail.partI.topics.goals.trim()

  const decided = criteria.all.filter((c) => detail.decisions[c] != null)
  const byPoints = [...decided].sort((a, b) => detail.decisions[b] - detail.decisions[a])
  const strongest = byPoints.filter((c) => detail.decisions[c] > 5).slice(0, 2)
  const weakest = [...byPoints].reverse().filter((c) => detail.decisions[c] < 5).slice(0, 2)
  const topics = detail.assessmentTalkTopics

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
        <CompetencyScoresTable detail={detail} model={model} criteria={criteria.all} caption="Oceny cząstkowe (wersja robocza)" />
        <ResultSummary result={r} />
        <p className={layout.muted}>Oceny pochodzą z wersji roboczej formularza.</p>
        {strongest.length + weakest.length > 0 ? (
          <CompetencyScoresTable
            detail={detail}
            model={model}
            criteria={[...strongest, ...weakest]}
            caption="Mocne strony i obszary do rozwoju"
            showCaption
            firstHeader="Kryterium"
            extra={[{ header: 'Do omówienia', cell: (c) => (strongest.includes(c) ? 'Mocna strona' : 'Obszar do rozwoju') }]}
          />
        ) : (
          decided.length > 0 && <p>Wszystkie kryteria na poziomie oczekiwań.</p>
        )}
      </section>

      <section aria-labelledby="tematy-h" className={s.suggestion}>
        <h3 id="tematy-h" className={s.suggestionTitle}>
          <Lightbulb size={20} aria-hidden="true" className={s.suggestionIcon} />
          Sugestia systemu: o czym porozmawiać
        </h3>
        {topics.length > 0 && (
          <>
            <ul className={layout.bullets}>
              {topics.map((t) => (
                <li key={t.id}>
                  {t.label}
                  <span className={s.topicNote}>
                    „{t.quote}” ({t.legalBasis})
                  </span>
                  {t.id === 'GOALS' && goals && <span className={s.topicNote}>Cele z części I: {goals}</span>}
                </li>
              ))}
            </ul>
            <p className={layout.muted}>Na podstawie §10 rozporządzenia. To propozycja — rozmowę prowadzisz po swojemu.</p>
          </>
        )}
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
      </section>

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
