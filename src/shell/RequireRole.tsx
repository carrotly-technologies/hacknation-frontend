import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import type { Role } from '../api/cases'
import { HOME_BY_ROLE, useMe } from '../lib/useAuth'

/** A route for some roles only: anyone else lands on their own start page. */
export function RequireRole({ roles, children }: { roles: readonly Role[]; children?: ReactNode }) {
  const me = useMe()
  if (!roles.includes(me.role)) return <Navigate to={HOME_BY_ROLE[me.role]} replace />
  return children ?? <Outlet />
}

/** "/" and other entry points: the current account's start page. */
export function HomeRedirect() {
  const me = useMe()
  return <Navigate to={HOME_BY_ROLE[me.role]} replace />
}
