import { createContext, useContext } from 'react'
import type { Me, Role } from '../api/cases'

export const LOGIN_PATH = '/logowanie'

/** Where each role lands after signing in, and when it opens a route it may not use. */
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
  /** null while signed out; undefined while /api/me loads. */
  user: Me | null | undefined
  meError: Error | null
  signIn: (login: string, password: string) => Promise<Me>
  /** Ends the simulated login.gov.pl flow: exchanges the one-time artifact for a session. */
  signInWithLoginGov: (artifact: string, state: string) => Promise<Me>
  signOut: () => Promise<void>
}

export const AuthCtx = createContext<AuthState | null>(null)

export const meQueryKey = ['me'] as const

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

/** The signed-in user; only inside RequireAuth. */
export function useMe(): Me {
  const { user } = useAuth()
  if (!user) throw new Error('useMe outside RequireAuth')
  return user
}
