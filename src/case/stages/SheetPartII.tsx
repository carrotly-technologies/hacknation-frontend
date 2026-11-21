import { useState, type FormEvent } from 'react'
import { ErrorSummary, Field, InfoList, InfoRow, InlineAlert, RadioGroup, TextArea, type FormError } from '../../components/ui'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtAvg, fmtDate } from '../../lib/format'
import { competencyName } from '../../lib/model'
import { liveResult } from '../../lib/result'
import { SCALE_LABELS } from '../../lib/scale'
import type { StageProps } from '../CasePage'
import { PartHeading, PartSection, WizardActions } from './SheetWizardCommon'
import { StageError } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetWizard.module.css'

const decisionId = (c: string) => `decision-${c}`
const JUST_ID = 'justification'
const IPRZ_ID = 'iprz'

/** Part II: the assessment itself. Editable only while the backend is in part II (assessment talk, justification). */
export function SheetPartII({ detail, model, criteria, onBack, onNext }: StageProps & { onBack: () => void; onNext: () => void }) {
  const patch = usePatchCase(detail.id)
  const signed = detail.signedByEvaluatorOn
  const editable = !signed && (detail.currentStage === 'ASSESSMENT' || detail.currentStage === 'JUSTIFICATION')
  const [justification, setJustification] = useState(detail.justification)
  const [iprz, setIprz] = useState(detail.iprz)
  const [errors, setErrors] = useState<FormError[]>([])
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message

  const r = liveResult(detail, criteria.all, model)
  const negative = r.result === 'NEGATIVE'
  const conversationDate = detail.stages.find((x) => x.id === 'ASSESSMENT')?.completedOn ?? null
  const periodFrom = detail.partI.acknowledgedByEmployeeOn
  const periodTo = signed ?? detail.partI.assessmentDue
  // Labels of the scale come from the competency model (API); the local table is only a fallback.
  const scaleLabel = (p: number) => model.scale.find((x) => x.points === p)?.label ?? SCALE_LABELS[p] ?? ''
  const options = criteria.scale.map((p) => ({ value: String(p), label: `${p} pkt · ${scaleLabel(p).toLowerCase()}`, disabled: !editable }))

  const decide = (c: string, v: string) => patch.mutate({ decisions: { [c]: Number(v) } })

  const validate = (): FormError[] => {
    const e: FormError[] = criteria.all
      .filter((c) => detail.decisions[c] == null)
      .map((c) => ({ id: decisionId(c), message: `Wybierz ocenę cząstkową kryterium „${competencyName(model, c)}”` }))
    if (negative && !justification.trim()) e.push({ id: JUST_ID, message: 'Wpisz uzasadnienie: przy ocenie negatywnej jest obowiązkowe' })
    if (!iprz.trim()) e.push({ id: IPRZ_ID, message: 'Wpisz wnioski dotyczące indywidualnego programu rozwoju zawodowego' })
    return e
  }

  const dirty = justification !== detail.justification || iprz !== detail.iprz

  // "Wstecz" keeps what was typed: unsaved text goes to the server without the checks of "Dalej".
  const back = () => {
    if (editable && dirty) patch.mutate({ justification, iprz })
    onBack()
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!editable) return onNext()
    const e = validate()
    setErrors(e)
    if (e.length) return
    try {
      if (dirty) await patch.mutateAsync({ justification, iprz })
      onNext()
    } catch {
      // the error is shown under the form
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className={s.form}>
      <PartHeading roman="II">Ocena okresowa</PartHeading>
      <ErrorSummary errors={errors} />

      {!editable && (
        <InlineAlert tone="info" title={signed ? 'Ocena jest zatwierdzona' : 'Część II wypełnisz w rozmowie oceniającej'}>
          {signed ? (
            <>Oceniający zatwierdził ocenę {fmtDate(signed)}, więc pola są tylko do odczytu.</>
          ) : (
            <>
              Pola będą dostępne po rozpoczęciu rozmowy oceniającej (krok „Formularz oceny kompetencji”), na koniec okresu oceny
              {detail.partI.assessmentDue ? `, przed terminem sporządzenia oceny ${fmtDate(detail.partI.assessmentDue)}` : ''}. Do tego czasu
              możesz przejrzeć, co będzie oceniane.
            </>
          )}
        </InlineAlert>
      )}

      <PartSection title="Rozmowa i okres oceny" hint="Uzupełniane automatycznie.">
        <InfoList>
          <InfoRow label="Data przeprowadzenia rozmowy oceniającej" value={conversationDate ? fmtDate(conversationDate) : 'Po rozmowie oceniającej'} />
          <InfoRow
            label="Okres, w którym oceniany podlegał ocenie"
            value={
              periodFrom
                ? `od ${fmtDate(periodFrom)} do ${periodTo ? fmtDate(periodTo) : '—'}${!signed && periodTo ? ' (termin oceny)' : ''}`
                : 'Od dnia, w którym oceniany zapozna się z częścią I'
            }
          />
        </InfoList>
      </PartSection>

      <PartSection title="Oceny cząstkowe" hint="Ocenę cząstkową każdego kryterium wybierasz Ty. Wybór zapisuje się od razu.">
        <div className={s.fields}>
          {criteria.all.map((c) => (
            <RadioGroup
              key={c}
              id={decisionId(c)}
              name={decisionId(c)}
              inline
              legend={
                <>
                  {competencyName(model, c)}{' '}
                  <span className={`${layout.tag} ${criteria.additional.includes(c) ? layout.tagAccent : ''}`}>
                    {criteria.additional.includes(c) ? 'dodatkowe' : 'obowiązkowe'}
                  </span>
                </>
              }
              hint={detail.partI.expectations[c] ? `Oczekiwania z części I: ${detail.partI.expectations[c]}` : undefined}
              error={errorFor(decisionId(c))}
              options={options}
              value={detail.decisions[c] != null ? String(detail.decisions[c]) : ''}
              onChange={(v) => decide(c, v)}
            />
          ))}
        </div>
      </PartSection>

      <PartSection title="Przyznanie oceny" hint="Liczone przez system z ocen cząstkowych.">
        <InfoList>
          <InfoRow label="Średnia arytmetyczna z ocen cząstkowych" value={r.average === null ? '—' : `${fmtAvg(r.average)}${r.complete ? '' : ` (wstępnie, ${r.decided} z ${r.total})`}`} />
          <InfoRow label="Ogólny poziom spełniania kryteriów oceny" value={r.band ? r.band.label.toLowerCase() : '—'} />
          <InfoRow
            label="Ocena okresowa w służbie cywilnej"
            value={r.result === 'POSITIVE' ? 'Pozytywna' : r.result === 'NEGATIVE' ? 'Negatywna' : '—'}
          />
        </InfoList>
        <p className={layout.muted} aria-live="polite">
          {r.reason} <span className={s.legal}>{r.legal}</span>
        </p>
      </PartSection>

      <Field
        id={JUST_ID}
        label="Uzasadnienie przyznanej oceny okresowej"
        optional={!negative}
        hint="Obowiązkowe przy ocenie negatywnej. Odnieś się do kryteriów po nazwie i do przyznanego poziomu (§11 ust. 3–4 rozp. PRM z 4.04.2016)."
        error={errorFor(JUST_ID)}
      >
        {(p) => <TextArea {...p} rows={6} readOnly={!editable} value={justification} onChange={(e) => setJustification(e.target.value)} />}
      </Field>

      <Field
        id={IPRZ_ID}
        label="Wnioski dotyczące indywidualnego programu rozwoju zawodowego"
        hint="Obszar, forma rozwoju, termin lub sposób monitorowania, oczekiwany efekt (art. 108 ustawy o służbie cywilnej)."
        error={errorFor(IPRZ_ID)}
      >
        {(p) => <TextArea {...p} rows={5} readOnly={!editable} value={iprz} onChange={(e) => setIprz(e.target.value)} />}
      </Field>

      <StageError error={patch.error} />
      <WizardActions onBack={back} loading={patch.isPending} />
    </form>
  )
}
