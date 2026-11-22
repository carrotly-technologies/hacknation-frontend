import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { errorMessage } from '../api/client'
import { Spinner } from '../components/ui'
import { isRememberedLoginGovState, type LoginGovFailure } from '../lib/loginGov'
import { HOME_BY_ROLE, LOGIN_PATH, useAuth } from '../lib/useAuth'
import s from './LoginPage.module.css'

/**
 * Return from the simulated login.gov.pl: exchanges the one-time artifact for a session,
 * then goes to the role's start page. Any failure goes back to /logowanie with a message.
 */
export function LoginGovReturnPage() {
  const { signInWithLoginGov } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // The artifact is single use: exchange it once, also under StrictMode's double effects.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const artifact = params.get('artifact') ?? ''
    const state = params.get('state') ?? ''
    const fail = (loginGovError: string) =>
      navigate(LOGIN_PATH, { replace: true, state: { loginGovError } satisfies LoginGovFailure })

    if (!artifact || !state || !isRememberedLoginGovState(state)) {
      fail('Ten link logowania nie pochodzi z tej karty przeglądarki albo jest niepełny. Zaloguj się ponownie.')
      return
    }
    signInWithLoginGov(artifact, state).then(
      (me) => navigate(HOME_BY_ROLE[me.role], { replace: true }),
      (err: unknown) => fail(errorMessage(err)),
    )
  }, [params, navigate, signInWithLoginGov])

  return (
    <main className={s.root} id="main">
      <div className={s.card} role="status">
        <Spinner /> Kończymy logowanie…
      </div>
    </main>
  )
}
