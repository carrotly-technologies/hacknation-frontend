import type { Role } from './cases'
import { apiGet, apiPatch, apiPost } from './client'

export interface UserView {
  id: string
  login: string
  name: string
  firstName: string
  lastName: string
  role: Role
  position: string
  unit: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: UserView
}

export const login = (login: string, password: string) => apiPost<LoginResponse>('/auth/login', { login, password })

/** Simulated login.gov.pl (Węzeł Krajowy flow): start → mock identity provider → exchange. */
export type LoginGovMethod = 'profil-zaufany' | 'mobywatel' | 'bank'

export const startLoginGov = () => apiPost<{ redirectUrl: string; state: string }>('/auth/login-gov/start', undefined)
/** The mock identity provider; the only call that carries a (fictional) PESEL. */
export const mockAuthorizeLoginGov = (state: string, pesel: string, method: LoginGovMethod) =>
  apiPost<{ artifact: string }>('/auth/login-gov/mock-authorize', { state, pesel, method })
/** Same answer as login(). */
export const exchangeLoginGov = (artifact: string, state: string) =>
  apiPost<LoginResponse>('/auth/login-gov', { artifact, state })

export const logout = () => apiPost<void>('/auth/logout', undefined)

export const getUsers = (signal?: AbortSignal) => apiGet<UserView[]>('/admin/users', signal)
export const updateUserRole = (id: string, role: Role) =>
  apiPatch<UserView>(`/admin/users/${encodeURIComponent(id)}`, { role })
