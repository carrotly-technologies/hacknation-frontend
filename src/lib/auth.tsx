import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router'
import { getMe, type Me } from '../api/cases'
import { ApiError } from '../api/client'
import { ErrorState, LoadingState } from '../components/QueryState'
import { DEFAULT_USER_ID, getUserId, setUserId } from './session'
import { AuthCtx, HOME_BY_ROLE, meQueryKey, type AuthState } from './useAuth'

/** Queries that do not depend on the account (or are keyed by it, like 'me'): kept when switching. */
const SHARED_QUERIES = new Set(['config', 'users', 'me'])

/**
 * No sign-in: the app acts as the demo account picked in the header (X-User-Id),
 * a supervisor by default. Renders its children once that account is loaded.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [userId, setUserIdState] = useState(getUserId)

  const me = useQuery({
    queryKey: meQueryKey(userId),
    queryFn: ({ signal }) => loadMe(signal),
    staleTime: Infinity,
    retry: false,
  })

  const switchUser = useCallback(
    async (id: string) => {
      const previous = getUserId()
      setUserId(id)
      let user: Me
      try {
        user = await qc.fetchQuery({ queryKey: meQueryKey(id), queryFn: ({ signal }) => getMe(signal) })
      } catch (err) {
        setUserId(previous)
        throw err
      }
      // Leave the old account's page first, so it does not refetch as the new one.
      flushSync(() => {
        navigate(HOME_BY_ROLE[user.role])
        setUserIdState(id)
      })
      // Another account sees other data: drop the old one's, refetch what is on screen.
      await qc.resetQueries({ predicate: (q) => !SHARED_QUERIES.has(String(q.queryKey[0])) })
    },
    [qc, navigate],
  )

  const user = me.data
  const value = useMemo<AuthState | null>(() => (user ? { user, switchUser } : null), [user, switchUser])

  if (!value) {
    return (
      <div className="page">
        {me.isError ? (
          <ErrorState error={me.error} what="dane konta demonstracyjnego" onRetry={() => void me.refetch()} />
        ) : (
          <LoadingState />
        )}
      </div>
    )
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

/** The current account; a stored id the API no longer knows (400) falls back to the default one. */
async function loadMe(signal: AbortSignal) {
  try {
    return await getMe(signal)
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 400) || getUserId() === DEFAULT_USER_ID) throw err
    setUserId(DEFAULT_USER_ID)
    return getMe(signal)
  }
}
