import { createContext, useContext } from 'react'
import type { Me, Role } from '../api/cases'

/** Each role's start page: after switching accounts, and when it opens a route it may not use. */
export const HOME_BY_ROLE: Record<Role, string> = {
  SUPERVISOR: '/zespol',
  HR: '/hr',
  ADMIN: '/admin/uzytkownicy',
}

export const ROLE_LABEL: Record<Role, string> = {
  SUPERVISOR: 'Przełożony',
  HR: 'Kadry HR',
  ADMIN: 'Administrator',
}

export type AuthState = {
  /** The demo account the app acts as (loaded before anything else renders). */
  user: Me
  /** Acts as another demo account from now on, refetches the data and opens its start page. */
  switchUser: (id: string) => Promise<void>
}

export const AuthCtx = createContext<AuthState | null>(null)

export const meQueryKey = (userId: string) => ['me', userId] as const
export const demoUsersQueryKey = ['users', 'demo'] as const

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

/** The current demo account. */
export function useMe(): Me {
  return useAuth().user
}
