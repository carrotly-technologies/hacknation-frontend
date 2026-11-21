// The demo account the app acts as (no sign-in): its id goes with every API call as X-User-Id.
// localStorage keeps only that id (no personal data), so the choice survives a reload.
const KEY = 'kompas.userId'

/** Used when nothing was chosen yet: a supervisor (backend default too). */
export const DEFAULT_USER_ID = 'u-kaminska'

let memoryUserId: string | null = null

export function getUserId(): string {
  try {
    return localStorage.getItem(KEY) || DEFAULT_USER_ID
  } catch {
    return memoryUserId ?? DEFAULT_USER_ID
  }
}

export function setUserId(id: string): void {
  memoryUserId = id
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // storage unavailable: the choice lives only in memory
  }
}
