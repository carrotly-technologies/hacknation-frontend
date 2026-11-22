import { getSessionId } from '../lib/activity'
import { getToken, notifyUnauthorized, setToken } from '../lib/session'

// Empty VITE_API_URL = same origin, so requests go through the Vite dev proxy.
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/**
 * A link returned by the API: "/api/..." paths are relative to the API origin
 * (VITE_API_URL), absolute URLs (e.g. ISAP) are kept as they are.
 */
export function apiUrl(url: string): string {
  return url.startsWith('/') ? `${API_URL}${url}` : url
}

/** Error thrown by the API client. `status` is 0 when the server could not be reached. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Sends a request with the sign-in token; throws ApiError (Polish message) for a network error or a non-2xx answer. */
async function send(path: string, init: RequestInit): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  // The activity log groups the calls of this tab into one session (src/lib/activity.ts).
  headers.set('X-Session-Id', getSessionId())
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, { ...init, headers })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('Brak połączenia z serwerem API. Sprawdź, czy backend jest uruchomiony.', 0)
  }

  if (!res.ok) {
    // The token expired or was rejected: drop it and send the user to the sign-in page.
    if (res.status === 401 && token) {
      setToken(null)
      notifyUnauthorized()
    }
    throw new ApiError(await readErrorMessage(res), res.status)
  }
  return res
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await send(path, init)

  if (res.status === 204) return undefined as T
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) {
    throw new ApiError('Serwer zwrócił nieoczekiwaną odpowiedź (to nie jest API Kompasu).', res.status)
  }
  return (await res.json()) as T
}

// NestJS returns { message: string | string[], error, statusCode } for errors.
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown }
    if (Array.isArray(body.message)) return body.message.join(' ')
    if (typeof body.message === 'string') return body.message
  } catch {
    // body was not JSON
  }
  return `Serwer API odpowiedział błędem ${res.status} ${res.statusText}`.trim()
}

export function apiGet<T>(path: string, signal?: AbortSignal, headers?: HeadersInit): Promise<T> {
  return request<T>(path, { signal, headers })
}

function withBody(method: string, body: unknown, signal?: AbortSignal): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  }
}

export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, withBody('POST', body, signal))
}

export function apiPatch<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, withBody('PATCH', body, signal))
}

/**
 * Reports a screen of the app to the activity log. Fire and forget: never throws, never blocks the UI, no sign-in
 * needed; `keepalive` lets it finish when the tab is closing.
 */
export function sendPageview(path: string): void {
  try {
    void fetch(`${API_URL}/api/telemetry/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': getSessionId() },
      body: JSON.stringify({ path: path.slice(0, 500) }),
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // never visible to the user
  }
}

/** A file from the API (e.g. the sheet as PDF) with the name the server gave it in `Content-Disposition`. */
export async function apiGetFile(path: string, fallbackName: string, signal?: AbortSignal): Promise<{ blob: Blob; fileName: string }> {
  const res = await send(path, { signal })
  return { blob: await res.blob(), fileName: fileNameFrom(res.headers.get('content-disposition')) ?? fallbackName }
}

/** `filename*=UTF-8''…` (Polish letters) first, then the plain `filename="…"`. */
export function fileNameFrom(disposition: string | null): string | null {
  if (!disposition) return null
  const utf8 = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim())
    } catch {
      // malformed: fall back to the plain name
    }
  }
  const plain = /filename\s*=\s*"([^"]+)"/i.exec(disposition) ?? /filename\s*=\s*([^;]+)/i.exec(disposition)
  return plain ? plain[1].trim() : null
}

/** Saves a Blob through a temporary `download` link (works in every current browser). */
export function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
