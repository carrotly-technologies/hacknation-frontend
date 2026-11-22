import { apiDelete, apiGet } from './client'

// Activity monitor (backend src/monitor, GET /api/monitor/*): only with X-Monitor-Token = MONITOR_TOKEN, else 404.

export type LogKind = 'API' | 'PAGEVIEW'

export interface RequestLogEntry {
  id: string
  /** ISO 8601 (UTC). */
  at: string
  sessionId: string | null
  kind: LogKind
  /** null for a pageview */
  method: string | null
  path: string
  /** null for a pageview */
  status: number | null
  /** null for a pageview */
  durationMs: number | null
  ip: string | null
  userAgent: string | null
  userId: string | null
  /** The account's login. */
  userName: string | null
}

export interface SessionUser {
  id: string
  name: string | null
}

export interface SessionSummary {
  /** X-Session-Id, or `anon-…` for calls without one (grouped by IP, browser and day). */
  sessionId: string
  anonymous: boolean
  users: SessionUser[]
  ips: string[]
  userAgent: string | null
  firstAt: string
  lastAt: string
  pageviews: number
  apiCalls: number
  /** API calls answered with 4xx or 5xx. */
  errors: number
}

export interface SessionPage {
  items: SessionSummary[]
  total: number
  page: number
  pageSize: number
}

export interface SessionDetail {
  session: SessionSummary
  /** Oldest first. */
  entries: RequestLogEntry[]
}

export interface SessionFilters {
  /** YYYY-MM-DD */
  from?: string
  /** YYYY-MM-DD, the whole day included */
  to?: string
  /** Part of an IP address. */
  ip?: string
  /** Part of an account id or login. */
  userId?: string
  page?: number
  pageSize?: number
}

const tokenHeader = (token: string) => ({ 'X-Monitor-Token': token })

export function getSessions(token: string, filters: SessionFilters, signal?: AbortSignal): Promise<SessionPage> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const query = params.toString()
  return apiGet<SessionPage>(`/monitor/sessions${query ? `?${query}` : ''}`, signal, tokenHeader(token))
}

export function getSession(token: string, sessionId: string, signal?: AbortSignal): Promise<SessionDetail> {
  return apiGet<SessionDetail>(`/monitor/sessions/${encodeURIComponent(sessionId)}`, signal, tokenHeader(token))
}

/** Deletes the whole activity log (e.g. after the demo); returns how many entries were removed. */
export function clearSessions(token: string): Promise<{ removed: number }> {
  return apiDelete<{ removed: number }>('/monitor/sessions', tokenHeader(token))
}
