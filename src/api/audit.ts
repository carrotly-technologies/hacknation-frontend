import type { Role } from './cases'
import { apiGet } from './client'

/** Event log of the backend (`GET /api/admin/audit*`, ADMIN only; backend README „Audit log”). */

export type AuditActorRole = Role | 'ASSESSED_VIA_LINK'
export type AuditResult = 'OK' | 'DENIED' | 'ERROR'

export interface AuditEntry {
  id: string
  seq: number
  /** ISO timestamp (UTC). */
  at: string
  actorId: string | null
  /** Current name of the account, resolved by the API; null without an account. */
  actorName: string | null
  actorRole: AuditActorRole | null
  action: string
  /** Polish name of the action. */
  actionLabel: string
  resourceType: string | null
  resourceTypeLabel: string | null
  resourceId: string | null
  /** Names of the fields sent, never their values. */
  changedFields: string[]
  ip: string | null
  result: AuditResult
  prevHash: string
  hash: string
}

export interface AuditPage {
  items: AuditEntry[]
  total: number
  page: number
  pageSize: number
}

export interface AuditFilters {
  actorId?: string
  /** Exact action, or a family: `CASE_ACTION` = every action in a case. */
  action?: string
  /** Inclusive ISO timestamps. */
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export type AuditVerification =
  | { ok: true; count: number }
  | { ok: false; count: number; firstBrokenId: string }

export function getAudit(filters: AuditFilters, signal?: AbortSignal) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  }
  const query = qs.toString()
  return apiGet<AuditPage>(`/admin/audit${query ? `?${query}` : ''}`, signal)
}

export const getAuditActions = (signal?: AbortSignal) =>
  apiGet<{ action: string; label: string }[]>('/admin/audit/actions', signal)

export const verifyAudit = () => apiGet<AuditVerification>('/admin/audit/verify')
