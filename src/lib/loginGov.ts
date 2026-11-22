// Simulated sign-in through login.gov.pl (Węzeł Krajowy flow, hacknation-backend#67).
// The `state` of the started flow is kept for this tab only, so a return link opened
// elsewhere (or forged) is rejected before it reaches the API. Not personal data.
import type { LoginGovMethod } from '../api/auth'

const KEY = 'kompas.loginGovState'

export const LOGIN_GOV_RETURN_PATH = '/logowanie/login-gov'
export const MOCK_LOGIN_GOV_PATH = '/mock-login-gov'

export const LOGIN_GOV_METHODS: ReadonlyArray<{ value: LoginGovMethod; label: string; hint: string }> = [
  { value: 'profil-zaufany', label: 'Profil zaufany', hint: 'Symulacja: bez wpisywania loginu i hasła' },
  { value: 'mobywatel', label: 'Aplikacja mObywatel', hint: 'Symulacja: bez kodu z telefonu' },
  { value: 'bank', label: 'Bankowość elektroniczna', hint: 'Symulacja: bez logowania do banku' },
]

export function rememberLoginGovState(state: string): void {
  try {
    sessionStorage.setItem(KEY, state)
  } catch {
    // storage unavailable: the return page cannot check the state and refuses the link
  }
}

export function isRememberedLoginGovState(state: string): boolean {
  try {
    return sessionStorage.getItem(KEY) === state
  } catch {
    return false
  }
}

/** Shown on /logowanie when the flow fails (passed as router state). */
export type LoginGovFailure = { loginGovError: string }
