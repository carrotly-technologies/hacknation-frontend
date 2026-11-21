import { useState, type FormEvent } from 'react'
import type { PromotionRequest } from '../../api/cases'
import { ErrorSummary, Field, InfoList, InfoRow, InlineAlert, Select, TextArea, TextInput, type FormError } from '../../components/ui'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { useCivilServiceGrades } from '../../lib/model'
import type { StageProps } from '../CasePage'
import { PartHeading, PartSection, WizardActions } from './SheetWizardCommon'
import { StageError } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetWizard.module.css'

type Part3 = Pick<PromotionRequest, 'appointedYear' | 'currentGrade' | 'gradeGrantedOn' | 'requestedGrade' | 'motivation'>

const YEAR_ID = 'appointed-year'
const CURRENT_ID = 'current-grade'
const GRANTED_ID = 'grade-granted-on'
const REQUESTED_ID = 'requested-grade'
const MOTIVATION_ID = 'motivation'

const pick = (r: PromotionRequest): Part3 => ({
  appointedYear: r.appointedYear,
  currentGrade: r.currentGrade,
  gradeGrantedOn: r.gradeGrantedOn,
  requestedGrade: r.requestedGrade,
  motivation: r.motivation,
})

const same = (a: Part3, b: Part3) => (Object.keys(a) as (keyof Part3)[]).every((k) => a[k] === b[k])

/**
 * Every field starts empty (nothing is suggested); the backend checks that the requested grade is the next one.
 *
 * Part III: the request for the next civil-service grade (art. 89 ust. 1 ustawy o służbie cywilnej). It is a form
 * only when part II answers TAK; otherwise the part is not attached, as the template's footnote says.
 */
export function SheetPartIII({ detail, criteria, onBack, onNext }: StageProps & { onBack: () => void; onNext: () => void }) {
  const patch = usePatchCase(detail.id)
  const grades = useCivilServiceGrades()
  const template = criteria.sheet?.template
  const request = detail.promotionRequest
  const signed = detail.signedByEvaluatorOn
  // The same window as part II: the backend accepts the request until the evaluator signs the assessment.
  const editable = !signed && (detail.currentStage === 'ASSESSMENT' || detail.currentStage === 'JUSTIFICATION')
  const attached = request.attached === 'YES'
  const name = `${detail.person.firstName} ${detail.person.lastName}`

  const [form, setForm] = useState<Part3>(() => pick(request))
  const [year, setYear] = useState(request.appointedYear ? String(request.appointedYear) : '')
  const [errors, setErrors] = useState<FormError[]>([])
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message

  const list = grades.data?.grades ?? []
  const options = list.map((g) => ({ value: g.id, label: g.label }))

  const current: Part3 = { ...form, appointedYear: /^\d{4}$/.test(year) ? Number(year) : null }
  const dirty = attached && editable && !same(current, pick(request))


  const validate = (): FormError[] => {
    const e: FormError[] = []
    if (!/^\d{4}$/.test(year)) e.push({ id: YEAR_ID, message: 'Wpisz rok mianowania jako 4 cyfry, np. 2018' })
    if (!form.currentGrade) e.push({ id: CURRENT_ID, message: 'Wybierz posiadany stopień służbowy' })
    if (!form.gradeGrantedOn) e.push({ id: GRANTED_ID, message: 'Wpisz datę przyznania stopnia służbowego' })
    if (!form.requestedGrade) e.push({ id: REQUESTED_ID, message: 'Wybierz wnioskowany stopień służbowy' })
    if (!form.motivation.trim()) e.push({ id: MOTIVATION_ID, message: 'Wpisz umotywowanie wniosku' })
    return e
  }

  // "Wstecz" keeps what was typed, without the checks of "Dalej".
  const back = () => {
    if (dirty) patch.mutate({ promotionRequest: current })
    onBack()
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!attached || !editable) return onNext()
    const e = validate()
    setErrors(e)
    if (e.length) return
    try {
      if (dirty) await patch.mutateAsync({ promotionRequest: current })
      onNext()
    } catch {
      // the error is shown under the form
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className={s.form}>
      <PartHeading roman="III">Wniosek o przyznanie kolejnego stopnia służbowego</PartHeading>
      <ErrorSummary errors={errors} />
      {template && <p className={layout.text}>{template.partIIIApplicability}</p>}

      {!attached ? (
        <InlineAlert tone="info" title={request.attached === null ? 'Najpierw odpowiedz na pytanie w części II' : 'Część III nie jest dołączana'}>
          {request.attached === 'NOT_APPLICABLE' && <p>Oceniany jest pracownikiem służby cywilnej.</p>}
          {request.attached === 'NO' && <p>Oceniający nie dołącza wniosku o przyznanie kolejnego stopnia służbowego.</p>}
          {request.attached === null && (
            <p>Pytanie „Czy do oceny okresowej dołączono wniosek o przyznanie kolejnego stopnia służbowego?” jest na końcu części II.</p>
          )}
          {template && request.attached !== null && <p className={layout.muted}>{template.partIIINotAttached}</p>}
        </InlineAlert>
      ) : (
        <>
          <PartSection title="Dane urzędnika służby cywilnej">
            <InfoList>
              <InfoRow label="Imię" value={detail.person.firstName} />
              <InfoRow label="Nazwisko" value={detail.person.lastName} />
            </InfoList>
            <div className={s.fields}>
              <Field id={YEAR_ID} label="Rok mianowania" hint="4 cyfry, np. 2018" error={errorFor(YEAR_ID)}>
                {(p) => (
                  <TextInput
                    {...p}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    width={5}
                    placeholder="rrrr"
                    readOnly={!editable}
                    value={year}
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
                  />
                )}
              </Field>
              <Field id={CURRENT_ID} label="Posiadany stopień służbowy" error={errorFor(CURRENT_ID)}>
                {(p) => (
                  <Select
                    {...p}
                    disabled={!editable}
                    placeholder="Wybierz"
                    options={options}
                    value={form.currentGrade ?? ''}
                    onChange={(e) => setForm((v) => ({ ...v, currentGrade: e.target.value || null }))}
                  />
                )}
              </Field>
              <Field id={GRANTED_ID} label="Data przyznania stopnia służbowego" error={errorFor(GRANTED_ID)}>
                {(p) => (
                  <TextInput
                    {...p}
                    type="date"
                    width={20}
                    placeholder="dd.mm.rrrr"
                    readOnly={!editable}
                    value={form.gradeGrantedOn ?? ''}
                    onChange={(e) => setForm((v) => ({ ...v, gradeGrantedOn: e.target.value || null }))}
                  />
                )}
              </Field>
            </div>
          </PartSection>

          <PartSection title="Wniosek o przyznanie urzędnikowi służby cywilnej kolejnego stopnia służbowego">
            <Field id={REQUESTED_ID} label="Wnioskowany stopień służbowy" hint="Kolejny stopień po posiadanym." error={errorFor(REQUESTED_ID)}>
              {(p) => (
                <Select
                  {...p}
                  disabled={!editable}
                  placeholder="Wybierz"
                  options={options}
                  value={form.requestedGrade ?? ''}
                  onChange={(e) => setForm((v) => ({ ...v, requestedGrade: e.target.value || null }))}
                />
              )}
            </Field>
            {template && (
              <blockquote className={s.quote} aria-live="polite">
                <p className={s.sentence}>
                  {template.promotionRequest.beforeName} <strong>{name}</strong> {template.promotionRequest.afterName}{' '}
                  <strong>{form.requestedGrade ?? '……'}</strong> {template.promotionRequest.afterGrade}
                </p>
              </blockquote>
            )}
            <Field
              id={MOTIVATION_ID}
              label="Umotywowanie wniosku"
              hint="Dlaczego oceniany powinien otrzymać kolejny stopień: wyniki oceny, zadania, rozwój."
              error={errorFor(MOTIVATION_ID)}
            >
              {(p) => (
                <TextArea {...p} rows={6} readOnly={!editable} value={form.motivation} onChange={(e) => setForm((v) => ({ ...v, motivation: e.target.value }))} />
              )}
            </Field>
            <InfoList>
              <InfoRow
                label="Data i podpis oceniającego"
                value={signed ? `${fmtDate(signed)}, ${detail.evaluator.firstName} ${detail.evaluator.lastName}, podpisano elektronicznie` : 'Po zatwierdzeniu oceny (krok „Dokument”)'}
              />
            </InfoList>
          </PartSection>
        </>
      )}

      <StageError error={patch.error} />
      <WizardActions onBack={back} loading={patch.isPending} />
    </form>
  )
}
