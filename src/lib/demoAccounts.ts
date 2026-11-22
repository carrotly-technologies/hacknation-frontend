import type { Role } from '../api/cases'

/**
 * Demo accounts of the functional POC, shown as one-click sign-in on /logowanie.
 * They mirror the seed in hacknation-backend (`src/auth/users.seed.ts`, credentials in its README);
 * fictional people, update this list by hand when the seed changes.
 */
export type DemoAccount = {
  login: string
  name: string
  role: Role
  description: string
}

/**
 * Hidden with VITE_DEMO_ACCOUNTS=false at build time (e.g. a real deployment without demo data).
 * Vite inlines the value, so with `false` the list, the password and the section are dropped from the bundle.
 */
export const DEMO_ACCOUNTS_ENABLED = import.meta.env.VITE_DEMO_ACCOUNTS !== 'false'

/** Shared password of every demo account (POC only, the same as in the backend README). Never displayed. */
export const DEMO_PASSWORD = DEMO_ACCOUNTS_ENABLED ? 'Kompas2026!' : ''

export const DEMO_ACCOUNTS: readonly DemoAccount[] = DEMO_ACCOUNTS_ENABLED
  ? [
      { login: 'k.wisniewska', name: 'Karolina Wiśniewska', role: 'SUPERVISOR', description: 'Zespół z 7 teczkami ocen' },
      { login: 'a.szymanczak', name: 'Agnieszka Szymańczak', role: 'SUPERVISOR', description: 'Zespół z 2 teczkami ocen' },
      { login: 'j.kuchta', name: 'Jolanta Kuchta', role: 'SUPERVISOR', description: 'Zespół z 2 teczkami ocen' },
      { login: 'a.cieslak-dyjecinska', name: 'Agata Cieślak-Dyjecińska', role: 'HR', description: 'Monitoring ocen w całym urzędzie' },
      { login: 'admin', name: 'Marek Zając', role: 'ADMIN', description: 'Konta użytkowników i ich role' },
    ]
  : []
