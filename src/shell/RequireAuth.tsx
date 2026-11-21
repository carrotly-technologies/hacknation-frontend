import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '../api/cases'
import { ErrorState, LoadingState } from '../components/QueryState'
import { HOME_BY_ROLE, LOGIN_PATH, useAuth, useMe } from '../lib/useAuth'

/** Signed-out users go to the sign-in page, then back to where they were going. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user, meError, signOut } = useAuth()
  const location = useLocation()
  if (user === null) {
    const next = location.pathname + location.search
    return <Navigate to={next === '/' ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(next)}`} replace />
  }
  if (user === undefined) {
    return (
      <div className="page">
        {meError ? (
          <ErrorState error={meError} what="dane zalogowanego użytkownika" onRetry={() => void signOut()} />
        ) : (
          <LoadingState />
        )}
      </div>
    )
  }
  return children ?? <Outlet />
}

/** A route for some roles only: anyone else lands on their own start page. */
export function RequireRole({ roles, children }: { roles: readonly Role[]; children?: ReactNode }) {
  const me = useMe()
  if (!roles.includes(me.role)) return <Navigate to={HOME_BY_ROLE[me.role]} replace />
  return children ?? <Outlet />
}

/** "/" and other entry points: the signed-in user's start page. */
export function HomeRedirect() {
  const me = useMe()
  return <Navigate to={HOME_BY_ROLE[me.role]} replace />
}
