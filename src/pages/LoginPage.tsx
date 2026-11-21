import { Compass, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { ApiError, errorMessage } from '../api/client'
import { Button, ErrorSummary, Field, InlineAlert, TextInput, type FormError } from '../components/ui'
import { HOME_BY_ROLE, LOGIN_PATH, useAuth } from '../lib/useAuth'
import s from './LoginPage.module.css'

/** Sign-in with login and password. The role comes from the account; there are no shortcuts to demo accounts. */
export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormError[]>([])
  const [failure, setFailure] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const next = safeNext(params.get('next'))

  if (user) return <Navigate to={next ?? HOME_BY_ROLE[user.role]} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: FormError[] = []
    if (!login.trim()) errs.push({ id: 'login', message: 'Podaj login' })
    if (!password) errs.push({ id: 'password', message: 'Podaj hasło' })
    setErrors(errs)
    setFailure(null)
    if (errs.length) return
    setBusy(true)
    try {
      const me = await signIn(login.trim(), password)
      navigate(next ?? HOME_BY_ROLE[me.role], { replace: true })
    } catch (err) {
      setPassword('')
      setFailure(
        err instanceof ApiError && err.status === 401 ? 'Nieprawidłowy login lub hasło. Sprawdź dane i spróbuj ponownie.' : errorMessage(err),
      )
    } finally {
      setBusy(false)
    }
  }

  const fieldError = (id: string) => errors.find((x) => x.id === id)?.message

  return (
    <main className={s.root} id="main">
      <div className={s.card}>
        <div className={s.brand}>
          <Compass size={24} strokeWidth={1.75} aria-hidden="true" />
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
          <Button type="submit" loading={busy} icon={<LogIn size={20} aria-hidden="true" />} fullWidth>
            Zaloguj się
          </Button>
        </form>
      </div>
    </main>
  )
}

/** Only same-app paths: no open redirect through ?next=. */
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith(LOGIN_PATH)) return null
  return next
}
