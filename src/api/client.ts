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

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, init)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('Brak połączenia z serwerem API. Sprawdź, czy backend jest uruchomiony.', 0)
  }

  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res), res.status)
  }

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

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { signal })
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

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
