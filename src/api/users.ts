import type { Role } from './cases'
import { apiGet, apiPatch } from './client'

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

/** The demo accounts for the account switcher (public, no header needed). */
export const getDemoUsers = (signal?: AbortSignal) => apiGet<UserView[]>('/users/demo', signal)

export const getUsers = (signal?: AbortSignal) => apiGet<UserView[]>('/admin/users', signal)
export const updateUserRole = (id: string, role: Role) =>
  apiPatch<UserView>(`/admin/users/${encodeURIComponent(id)}`, { role })
