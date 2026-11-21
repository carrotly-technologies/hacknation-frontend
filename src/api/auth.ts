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
export const logout = () => apiPost<void>('/auth/logout', undefined)

export const getUsers = (signal?: AbortSignal) => apiGet<UserView[]>('/admin/users', signal)
export const updateUserRole = (id: string, role: Role) =>
  apiPatch<UserView>(`/admin/users/${encodeURIComponent(id)}`, { role })
