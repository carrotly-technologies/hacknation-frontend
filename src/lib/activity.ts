// Activity log (backend src/monitor): a random id of this browser tab, sent with every API call as X-Session-Id, so
// the team can see one visit as one session on /aktywnosc. sessionStorage: it ends with the tab and is not personal data.
const KEY = 'kompas.session'

let memoryId: string | null = null

/** A random UUID v4; crypto.randomUUID exists only on HTTPS and localhost, getRandomValues everywhere. */
function newUuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(KEY)
    if (!id) {
      id = newUuid()
      sessionStorage.setItem(KEY, id)
    }
    return id
  } catch {
    // storage unavailable: one id for this page load
    memoryId ??= newUuid()
    return memoryId
  }
}

// Token of the activity monitor (/aktywnosc), kept only for this tab.
const MONITOR_KEY = 'kompas.monitorToken'

export function getMonitorToken(): string | null {
  try {
    return sessionStorage.getItem(MONITOR_KEY)
  } catch {
    return null
  }
}

export function setMonitorToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(MONITOR_KEY, token)
    else sessionStorage.removeItem(MONITOR_KEY)
  } catch {
    // storage unavailable: the page asks again after a reload
  }
}
