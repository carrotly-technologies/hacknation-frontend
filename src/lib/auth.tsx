import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { login as apiLogin, logout as apiLogout } from '../api/auth'
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

  const signIn = useCallback(
    async (login: string, password: string) => {
      const res = await apiLogin(login, password)
      qc.clear()
      setToken(res.accessToken)
      setTokenState(res.accessToken)
      const user = await qc.fetchQuery({ queryKey: meQueryKey, queryFn: ({ signal }) => getMe(signal), staleTime: Infinity })
      return user
    },
    [qc],
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
      signOut,
    }),
    [token, me.data, me.error, signIn, signOut],
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
