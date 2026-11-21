import { ArrowLeft, CircleCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button, ButtonLink, ErrorSummary, Field, InfoList, InfoRow, RadioGroup, Stepper, TextArea, TextInput, type FormError } from '../components/ui'
import { peselError } from '../lib/pesel'
import s from './DemoFormPage.module.css'

/* Step-by-step form pattern: one question per page, "Krok X z Y", error summary on top,
   check answers before sending, then a confirmation page. State lives in memory only. */

type Answers = {
  fullName: string
  pesel: string
  delivery: '' | 'email' | 'post' | 'office'
  email: string
  address: string
}

const EMPTY: Answers = { fullName: '', pesel: '', delivery: '', email: '', address: '' }
const TOTAL = 3
const BASE = '/wniosek-demo'
const DELIVERY_LABEL = { email: 'E-mailem', post: 'Pocztą, listem poleconym', office: 'Osobiście w urzędzie' } as const

type StepId = '1' | '2' | '3' | 'sprawdz' | 'gotowe'

function validate(step: StepId, a: Answers): FormError[] {
  const e: FormError[] = []
  if (step === '1') {
    if (!a.fullName.trim()) e.push({ id: 'fullName', message: 'Wpisz imię i nazwisko' })
    else if (!/\s/.test(a.fullName.trim())) e.push({ id: 'fullName', message: 'Wpisz imię i nazwisko, oddzielone spacją' })
  }
  if (step === '2') {
    const m = peselError(a.pesel)
    if (m) e.push({ id: 'pesel', message: m })
  }
  if (step === '3') {
    if (!a.delivery) e.push({ id: 'delivery', message: 'Wybierz, jak chcesz odebrać decyzję' })
    if (a.delivery === 'email') {
      if (!a.email.trim()) e.push({ id: 'email', message: 'Wpisz adres e-mail' })
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim()))
        e.push({ id: 'email', message: 'Wpisz adres e-mail w formacie nazwa@domena.pl' })
    }
    if (a.delivery === 'post' && !a.address.trim()) e.push({ id: 'address', message: 'Wpisz adres do korespondencji' })
  }
  return e
}

const TITLES: Record<StepId, string> = {
  '1': 'Jak się nazywasz?',
  '2': 'Jaki jest Twój numer PESEL?',
  '3': 'Jak chcesz odebrać decyzję?',
  sprawdz: 'Sprawdź dane przed wysłaniem',
  gotowe: 'Wniosek wysłany',
}

export function DemoFormPage() {
  const { step = '1' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Answers>(EMPTY)
  // Errors belong to the step they were raised on, so they disappear when the step changes.
  const [shown, setShown] = useState<{ step: string; errors: FormError[] }>({ step: '', errors: [] })
  const errors = shown.step === step ? shown.errors : []
  const [sent, setSent] = useState(false)
  const returnToReview = params.get('zmiana') === '1'
  const stepId = (['1', '2', '3', 'sprawdz', 'gotowe'].includes(step) ? step : null) as StepId | null

  useEffect(() => {
    if (!stepId) return
    document.title = `${errors.length ? 'Błąd: ' : ''}${TITLES[stepId]} — wniosek demonstracyjny — Kompas Kompetencji`
    return () => {
      document.title = 'Kompas Kompetencji'
    }
  }, [stepId, errors.length])

  if (!stepId) return <Navigate to={BASE} replace />
  // Pages after a question cannot be opened before the question is answered.
  const firstInvalid = (['1', '2', '3'] as const).find((st) => validate(st, answers).length > 0)
  const order: StepId[] = ['1', '2', '3', 'sprawdz', 'gotowe']
  if (stepId === 'gotowe' && !sent) return <Navigate to={`${BASE}/sprawdz`} replace />
  if (firstInvalid && order.indexOf(stepId) > order.indexOf(firstInvalid) && stepId !== 'gotowe')
    return <Navigate to={firstInvalid === '1' ? BASE : `${BASE}/${firstInvalid}`} replace />

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setAnswers((a) => ({ ...a, [k]: v }))
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message
  const go = (st: StepId) => navigate(st === '1' ? BASE : `${BASE}/${st}`)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(stepId, answers)
    setShown({ step, errors: errs })
    if (errs.length) return
    if (returnToReview) return go('sprawdz')
    go(stepId === '1' ? '2' : stepId === '2' ? '3' : 'sprawdz')
  }

  const backTo = returnToReview ? `${BASE}/sprawdz` : stepId === '2' ? BASE : stepId === '3' ? `${BASE}/2` : stepId === 'sprawdz' ? `${BASE}/3` : null

  if (stepId === 'gotowe') {
    return (
      <div className={s.page}>
        <div className={s.panel} role="status">
          <CircleCheck size={40} aria-hidden="true" />
          <h1 className={s.panelTitle}>{TITLES.gotowe}</h1>
          <p className={s.panelText}>
            Numer sprawy: <strong>DEMO-2026-0001</strong>
          </p>
        </div>
        <h2 className={s.h2}>Co dalej</h2>
        <p className={s.text}>
          To wniosek demonstracyjny: dane nie zostały nigdzie wysłane. W prawdziwej usłudze w tym miejscu jest informacja, kiedy i jak
          urząd odpowie.
        </p>
        <div className={s.actions}>
          <Button
            variant="secondary"
            onClick={() => {
              setAnswers(EMPTY)
              setSent(false)
              go('1')
            }}
          >
            Wypełnij nowy wniosek
          </Button>
          <ButtonLink to="/ui" variant="text">
            Zobacz katalog komponentów
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      {backTo && (
        <Link to={backTo} className={s.back}>
          <ArrowLeft size={18} aria-hidden="true" />
          Wstecz
        </Link>
      )}

      {stepId === 'sprawdz' ? (
        <>
          <h1 className={s.h1}>{TITLES.sprawdz}</h1>
          <InfoList>
            <InfoRow label="Imię i nazwisko" value={answers.fullName} action={<ChangeLink step="1" what="imię i nazwisko" />} />
            <InfoRow label="PESEL" value={answers.pesel} action={<ChangeLink step="2" what="numer PESEL" />} />
            <InfoRow
              label="Sposób odbioru decyzji"
              value={
                answers.delivery &&
                DELIVERY_LABEL[answers.delivery] +
                  (answers.delivery === 'email' ? `: ${answers.email}` : answers.delivery === 'post' ? `: ${answers.address}` : '')
              }
              action={<ChangeLink step="3" what="sposób odbioru decyzji" />}
            />
          </InfoList>
          <h2 className={s.h2}>Wyślij wniosek</h2>
          <p className={s.text}>Wysyłając wniosek, potwierdzasz, że podane dane są prawdziwe.</p>
          <div className={s.actions}>
            <Button
              onClick={() => {
                setSent(true)
                go('gotowe')
              }}
            >
              Wyślij wniosek
            </Button>
          </div>
        </>
      ) : (
        <form noValidate onSubmit={onSubmit}>
          <Stepper current={Number(stepId)} total={TOTAL} />
          <ErrorSummary errors={errors} />
          {stepId === '1' && (
            <Field id="fullName" asHeading label={TITLES['1']} hint="Wpisz tak, jak w dowodzie osobistym." error={errorFor('fullName')}>
              {(p) => (
                <TextInput {...p} autoComplete="name" spellCheck={false} value={answers.fullName} onChange={(e) => set('fullName', e.target.value)} />
              )}
            </Field>
          )}
          {stepId === '2' && (
            <Field id="pesel" asHeading label={TITLES['2']} hint="Ma 11 cyfr, na przykład 44051401359." error={errorFor('pesel')}>
              {(p) => (
                <TextInput
                  {...p}
                  width={20}
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  value={answers.pesel}
                  onChange={(e) => set('pesel', e.target.value.replace(/\s/g, ''))}
                />
              )}
            </Field>
          )}
          {stepId === '3' && (
            <RadioGroup
              id="delivery"
              name="delivery"
              asHeading
              legend={TITLES['3']}
              hint="Wybierz jedną odpowiedź."
              error={errorFor('delivery')}
              value={answers.delivery}
              onChange={(v) => set('delivery', v as Answers['delivery'])}
              options={[
                {
                  value: 'email',
                  label: DELIVERY_LABEL.email,
                  conditional: (
                    <Field id="email" label="Adres e-mail" error={errorFor('email')}>
                      {(p) => (
                        <TextInput {...p} type="email" autoComplete="email" spellCheck={false} value={answers.email} onChange={(e) => set('email', e.target.value)} />
                      )}
                    </Field>
                  ),
                },
                {
                  value: 'post',
                  label: DELIVERY_LABEL.post,
                  conditional: (
                    <Field id="address" label="Adres do korespondencji" hint="Ulica, numer, kod pocztowy i miejscowość." error={errorFor('address')}>
                      {(p) => <TextArea {...p} rows={3} autoComplete="street-address" value={answers.address} onChange={(e) => set('address', e.target.value)} />}
                    </Field>
                  ),
                },
                { value: 'office', label: DELIVERY_LABEL.office, hint: 'Decyzję odbierzesz w godzinach pracy urzędu.' },
              ]}
            />
          )}
          <div className={s.actions}>
            <Button type="submit">{returnToReview ? 'Zapisz i wróć' : 'Dalej'}</Button>
          </div>
        </form>
      )}
    </div>
  )
}

function ChangeLink({ step, what }: { step: '1' | '2' | '3'; what: string }) {
  return (
    <Link to={`${step === '1' ? BASE : `${BASE}/${step}`}?zmiana=1`} className={s.change}>
      Zmień<span className="visually-hidden"> {what}</span>
    </Link>
  )
}
