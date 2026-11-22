import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { exchangeLoginGov, login as apiLogin, logout as apiLogout, type LoginResponse } from '../api/auth'
import { getMe } from '../api/cases'
import { AuthCtx, LOGIN_PATH, meQueryKey, type AuthState } from './useAuth'
import { getToken, onUnauthorized, setToken } from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [token, setTokenState] = useState(getToken)

  const me = useQuery({
    queryKey: meQueryKey,
    queryFn: ({ signal }) => getMe(signal),
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
  })

  const clear = useCallback(() => {
    setToken(null)
    setTokenState(null)
    qc.clear()
  }, [qc])

  // An expired or rejected token: back to sign-in, then back to the same page.
  useEffect(
    () =>
      onUnauthorized(() => {
        clear()
        if (location.pathname !== LOGIN_PATH) {
          navigate(`${LOGIN_PATH}?next=${encodeURIComponent(location.pathname + location.search)}`, { replace: true })
        }
      }),
    [clear, navigate, location.pathname, location.search],
  )

  /** Stores the token like any sign-in and loads /api/me. */
  const adopt = useCallback(
    async (res: LoginResponse) => {
      qc.clear()
      setToken(res.accessToken)
      setTokenState(res.accessToken)
      return qc.fetchQuery({ queryKey: meQueryKey, queryFn: ({ signal }) => getMe(signal), staleTime: Infinity })
    },
    [qc],
  )

  const signIn = useCallback(async (login: string, password: string) => adopt(await apiLogin(login, password)), [adopt])

  const signInWithLoginGov = useCallback(
    async (artifact: string, state: string) => adopt(await exchangeLoginGov(artifact, state)),
    [adopt],
  )

  const signOut = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // stateless tokens: signing out is dropping the token
    }
    // Leave first, so the sign-in page doesn't offer to come back here.
    navigate(LOGIN_PATH, { replace: true })
    clear()
  }, [clear, navigate])

  const value = useMemo<AuthState>(
    () => ({
      user: !token ? null : me.data,
      meError: me.error,
      signIn,
      signInWithLoginGov,
      signOut,
    }),
    [token, me.data, me.error, signIn, signInWithLoginGov, signOut],
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
