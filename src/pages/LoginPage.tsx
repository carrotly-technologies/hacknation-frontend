import { Landmark, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { startLoginGov } from '../api/auth'
import { ApiError, errorMessage } from '../api/client'
import { Button, Card, ErrorSummary, Field, InlineAlert, TextInput, type FormError } from '../components/ui'
import { DEMO_ACCOUNTS, DEMO_ACCOUNTS_ENABLED, DEMO_PASSWORD } from '../lib/demoAccounts'
import { rememberLoginGovState, type LoginGovFailure } from '../lib/loginGov'
import { HOME_BY_ROLE, LOGIN_PATH, ROLE_LABEL, useAuth } from '../lib/useAuth'
import { ActivityNotice } from '../components/ActivityNotice'
import { BrandMark } from '../components/BrandMark'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import s from './LoginPage.module.css'

/**
 * Sign-in with login and password. The role comes from the account.
 * Above the form: the simulated login.gov.pl sign-in; below it: one-click sign-in as a demo account
 * (both POC only, hidden with VITE_DEMO_ACCOUNTS=false, as the simulation signs in as a demo person).
 */
export function LoginPage() {
  useDocumentTitle('Logowanie')
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormError[]>([])
  // A failed login.gov.pl return lands here with its message.
  const [failure, setFailure] = useState<string | null>(
    () => (location.state as LoginGovFailure | null)?.loginGovError ?? null,
  )
  const [busy, setBusy] = useState(false)
  /** Login of the demo account being signed in, if any. */
  const [demoBusy, setDemoBusy] = useState<string | null>(null)
  const [govBusy, setGovBusy] = useState(false)

  const next = safeNext(params.get('next'))

  if (user) return <Navigate to={next ?? HOME_BY_ROLE[user.role]} replace />

  const pending = busy || demoBusy !== null || govBusy

  /** Shared by the form and the demo cards; throws nothing, shows the failure in the alert. */
  const attempt = async (l: string, p: string): Promise<boolean> => {
    setFailure(null)
    try {
      const me = await signIn(l, p)
      navigate(next ?? HOME_BY_ROLE[me.role], { replace: true })
      return true
    } catch (err) {
      setFailure(
        err instanceof ApiError && err.status === 401 ? 'Nieprawidłowy login lub hasło. Sprawdź dane i spróbuj ponownie.' : errorMessage(err),
      )
      return false
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (pending) return
    const errs: FormError[] = []
    if (!login.trim()) errs.push({ id: 'login', message: 'Podaj login' })
    if (!password) errs.push({ id: 'password', message: 'Podaj hasło' })
    setErrors(errs)
    setFailure(null)
    if (errs.length) return
    setBusy(true)
    const ok = await attempt(login.trim(), password)
    if (!ok) setPassword('')
    setBusy(false)
  }

  const onDemo = async (demoLogin: string) => {
    if (pending) return
    setErrors([])
    setDemoBusy(demoLogin)
    await attempt(demoLogin, DEMO_PASSWORD)
    setDemoBusy(null)
  }

  /** Like Węzeł Krajowy: the API starts the flow (state) and says where to go. */
  const onLoginGov = async () => {
    if (pending) return
    setErrors([])
    setFailure(null)
    setGovBusy(true)
    try {
      const { redirectUrl, state } = await startLoginGov()
      rememberLoginGovState(state)
      window.location.assign(redirectUrl)
    } catch (err) {
      setFailure(errorMessage(err))
      setGovBusy(false)
    }
  }

  const fieldError = (id: string) => errors.find((x) => x.id === id)?.message

  return (
    <main className={s.root} id="main">
      <div className={s.card}>
        <div className={s.brand}>
          <BrandMark />
          <span>Kompas Kompetencji</span>
        </div>
        <h1 className={s.h1}>Zaloguj się</h1>
        <p className={s.lead}>Użyj loginu i hasła swojego konta. Uprawnienia wynikają z roli przypisanej do konta.</p>

        <ErrorSummary errors={errors} />
        {failure && (
          <InlineAlert tone="error" live title="Nie udało się zalogować" className={s.alert}>
            {failure}
          </InlineAlert>
        )}

        {DEMO_ACCOUNTS_ENABLED && (
          <div className={s.gov}>
            <Button
              variant="secondary"
              loading={govBusy}
              disabled={pending && !govBusy}
              onClick={() => void onLoginGov()}
              icon={<Landmark size={20} aria-hidden="true" />}
              fullWidth
            >
              Zaloguj przez login.gov.pl
            </Button>
            <p className={s.govHint}>Symulacja logowania urzędowego (profil zaufany, mObywatel, bank) na potrzeby pokazu.</p>
            <p className={s.divider}>albo login i hasło</p>
          </div>
        )}

        <form className={s.form} onSubmit={onSubmit} noValidate>
          <Field label="Login" id="login" error={fieldError('login')}>
            {(p) => (
              <TextInput
                {...p}
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            )}
          </Field>
          <Field label="Hasło" id="password" error={fieldError('password')}>
            {(p) => (
              <TextInput
                {...p}
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          <Button
            type="submit"
            loading={busy}
            disabled={demoBusy !== null || govBusy}
            icon={<LogIn size={20} aria-hidden="true" />}
            fullWidth
          >
            Zaloguj się
          </Button>
        </form>

        {DEMO_ACCOUNTS_ENABLED && (
          <section className={s.demo} aria-labelledby="demo-accounts">
            <h2 className={s.h2} id="demo-accounts">
              Konta demonstracyjne
            </h2>
            <p className={s.demoLead}>Wybierz osobę, żeby zalogować się jednym kliknięciem i zobaczyć widok jej roli.</p>
            <ul className={s.demoList}>
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.login}>
                  <Card
                    title={a.name}
                    onClick={() => void onDemo(a.login)}
                    loading={demoBusy === a.login}
                    disabled={pending && demoBusy !== a.login}
                  >
                    <span className={s.demoRole}>{ROLE_LABEL[a.role]}</span> · {a.description}
                    <span className={s.demoLogin}>Login: {a.login}</span>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className={s.footer}>
          <Link to="/deklaracja-dostepnosci">Deklaracja dostępności</Link>
        </p>
      </div>
      <ActivityNotice />
    </main>
  )
}

/** Only same-app paths: no open redirect through ?next=. */
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith(LOGIN_PATH)) return null
  return next
}
