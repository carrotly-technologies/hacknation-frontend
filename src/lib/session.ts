// Bearer token of the signed-in user. sessionStorage: it ends with the tab, never shared across tabs.
const KEY = 'kompas.token'

let memoryToken: string | null = null

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return memoryToken
  }
}

export function setToken(token: string | null): void {
  memoryToken = token
  try {
    if (token) sessionStorage.setItem(KEY, token)
    else sessionStorage.removeItem(KEY)
  } catch {
    // storage unavailable: the token lives only in memory
  }
}

type Listener = () => void
const listeners = new Set<Listener>()

/** Called when the API answers 401 to a signed-in request (expired or revoked token). */
export function onUnauthorized(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyUnauthorized(): void {
  for (const l of listeners) l()
}
