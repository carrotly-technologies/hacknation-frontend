import { Compass, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { ApiError, errorMessage } from '../api/client'
import { Button, Card, ErrorSummary, Field, InlineAlert, TextInput, type FormError } from '../components/ui'
import { DEMO_ACCOUNTS, DEMO_ACCOUNTS_ENABLED, DEMO_PASSWORD } from '../lib/demoAccounts'
import { HOME_BY_ROLE, LOGIN_PATH, ROLE_LABEL, useAuth } from '../lib/useAuth'
import { BrandLogo } from '../branding/BrandLogo'
import s from './LoginPage.module.css'

/**
 * Sign-in with login and password. The role comes from the account.
 * Below the form: one-click sign-in as a demo account (POC, hidden with VITE_DEMO_ACCOUNTS=false).
 */
export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormError[]>([])
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  /** Login of the demo account being signed in, if any. */
  const [demoBusy, setDemoBusy] = useState<string | null>(null)

  const next = safeNext(params.get('next'))

  if (user) return <Navigate to={next ?? HOME_BY_ROLE[user.role]} replace />

  const pending = busy || demoBusy !== null

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

  const fieldError = (id: string) => errors.find((x) => x.id === id)?.message

  return (
    <main className={s.root} id="main">
      <div className={s.card}>
        <div className={s.brand}>
          <BrandLogo
            name="Kompas Kompetencji"
            layout="stacked"
            fallback={
              <>
                <Compass size={24} strokeWidth={1.75} aria-hidden="true" />
                <span>Kompas Kompetencji</span>
              </>
            }
          />
        </div>
        <h1 className={s.h1}>Zaloguj się</h1>
        <p className={s.lead}>Użyj loginu i hasła swojego konta. Uprawnienia wynikają z roli przypisanej do konta.</p>

        <ErrorSummary errors={errors} />
        {failure && (
          <InlineAlert tone="error" live title="Nie udało się zalogować" className={s.alert}>
            {failure}
          </InlineAlert>
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
            disabled={demoBusy !== null}
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
      </div>
    </main>
  )
}

/** Only same-app paths: no open redirect through ?next=. */
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith(LOGIN_PATH)) return null
  return next
}
