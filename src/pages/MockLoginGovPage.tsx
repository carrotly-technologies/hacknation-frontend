import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { mockAuthorizeLoginGov, type LoginGovMethod } from '../api/auth'
import { errorMessage } from '../api/client'
import { Button, ButtonLink, ErrorSummary, InlineAlert, RadioGroup, type FormError } from '../components/ui'
import { DEMO_ACCOUNTS } from '../lib/demoAccounts'
import { LOGIN_GOV_METHODS, LOGIN_GOV_RETURN_PATH } from '../lib/loginGov'
import { LOGIN_PATH, ROLE_LABEL } from '../lib/useAuth'
import s from './MockLoginGovPage.module.css'

/**
 * Mock identity provider for the simulated login.gov.pl sign-in (hacknation-backend#67).
 * Deliberately neutral: no official logos, colours or layout, a visible simulation banner,
 * no password or code fields. Step 1: method, step 2: demo person, then back to the app
 * with a one-time artifact, like Węzeł Krajowy.
 */
export function MockLoginGovPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const state = params.get('state') ?? ''
  const [step, setStep] = useState<1 | 2>(1)
  const [method, setMethod] = useState<LoginGovMethod | ''>('')
  const [person, setPerson] = useState('')
  const [errors, setErrors] = useState<FormError[]>([])
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Symulacja logowania urzędowego · Kompas Kompetencji'
  }, [])

  const methodLabel = LOGIN_GOV_METHODS.find((m) => m.value === method)?.label

  const onMethod = (e: FormEvent) => {
    e.preventDefault()
    if (!method) {
      setErrors([{ id: 'method', message: 'Wybierz metodę logowania' }])
      return
    }
    setErrors([])
    setStep(2)
  }

  const onPerson = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || !method) return
    const account = DEMO_ACCOUNTS.find((a) => a.login === person)
    if (!account) {
      setErrors([{ id: 'person', message: 'Wybierz osobę' }])
      return
    }
    setErrors([])
    setFailure(null)
    setBusy(true)
    try {
      const { artifact } = await mockAuthorizeLoginGov(state, account.pesel, method)
      const q = new URLSearchParams({ artifact, state })
      navigate(`${LOGIN_GOV_RETURN_PATH}?${q.toString()}`, { replace: true })
    } catch (err) {
      setFailure(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <main className={s.root} id="main">
      <div className={s.card}>
        <InlineAlert tone="warning" title="Symulacja: to nie jest prawdziwy login.gov.pl" className={s.banner}>
          Ta strona tylko udaje logowanie urzędowe na potrzeby pokazu. Nie podawaj tu żadnych prawdziwych danych.
        </InlineAlert>

        {!state || DEMO_ACCOUNTS.length === 0 ? (
          <>
            <h1 className={s.h1}>Nie można kontynuować</h1>
            <p className={s.lead}>
              {state
                ? 'Symulacja logowania jest wyłączona w tej wersji aplikacji.'
                : 'Brakuje danych sesji logowania. Wróć do aplikacji i zacznij logowanie od nowa.'}
            </p>
            <ButtonLink to={LOGIN_PATH} variant="secondary" icon={<ArrowLeft size={20} aria-hidden="true" />}>
              Wróć do logowania
            </ButtonLink>
          </>
        ) : step === 1 ? (
          <>
            <p className={s.step}>Krok 1 z 2</p>
            <h1 className={s.h1}>Wybierz sposób potwierdzenia tożsamości</h1>
            <p className={s.lead}>W symulacji nic nie wpisujesz: wybierasz metodę, a potem osobę demonstracyjną.</p>
            <ErrorSummary errors={errors} />
            <form className={s.form} onSubmit={onMethod} noValidate>
              <RadioGroup
                id="method"
                name="method"
                legend="Metoda logowania"
                options={LOGIN_GOV_METHODS}
                value={method}
                onChange={(v) => setMethod(v as LoginGovMethod)}
                error={errors.find((x) => x.id === 'method')?.message}
              />
              <div className={s.actions}>
                <Button type="submit" icon={<ArrowRight size={20} aria-hidden="true" />}>
                  Dalej
                </Button>
                <ButtonLink to={LOGIN_PATH} variant="tertiary">
                  Anuluj
                </ButtonLink>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className={s.step}>Krok 2 z 2 · {methodLabel}</p>
            <h1 className={s.h1}>Wybierz osobę demonstracyjną</h1>
            <p className={s.lead}>Osoby są fikcyjne. Po wyborze wrócisz do aplikacji zalogowany jako ta osoba.</p>
            <ErrorSummary errors={errors} />
            {failure && (
              <InlineAlert tone="error" live title="Nie udało się potwierdzić tożsamości" className={s.alert}>
                {failure}
              </InlineAlert>
            )}
            <form className={s.form} onSubmit={onPerson} noValidate>
              <RadioGroup
                id="person"
                name="person"
                legend="Osoba"
                options={DEMO_ACCOUNTS.map((a) => ({ value: a.login, label: a.name, hint: `${ROLE_LABEL[a.role]} · ${a.description}` }))}
                value={person}
                onChange={setPerson}
                error={errors.find((x) => x.id === 'person')?.message}
              />
              <div className={s.actions}>
                <Button type="submit" loading={busy} icon={<Check size={20} aria-hidden="true" />}>
                  Potwierdź i wróć do aplikacji
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  disabled={busy}
                  onClick={() => {
                    setErrors([])
                    setStep(1)
                  }}
                >
                  Wstecz
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
