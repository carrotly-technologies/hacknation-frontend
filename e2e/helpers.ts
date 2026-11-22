import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/** Demo seed of hacknation-backend (README there): every account has the same password. */
export const PASSWORD = 'Kompas2026!'
export const SUPERVISOR = 'k.wisniewska'
export const HR = 'a.cieslak-dyjecinska'
export const ADMIN = 'admin'

export const apiUrl = (path: string) => `${(process.env.A11Y_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')}${path}`

/** The appearance settings stored by /ustawienia (src/lib/preferences.ts). */
export const THEMES = {
  jasny: { theme: 'light', textSize: 100, highContrast: false },
  ciemny: { theme: 'dark', textSize: 100, highContrast: false },
  'wysoki kontrast': { theme: 'light', textSize: 100, highContrast: true },
  'wysoki kontrast, ciemny': { theme: 'dark', textSize: 100, highContrast: true },
} as const
export type ThemeName = keyof typeof THEMES
export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]

export async function apiLogin(login: string): Promise<string> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`login ${login}: HTTP ${res.status}`)
  return ((await res.json()) as { accessToken: string }).accessToken
}

export async function api<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${await res.text()}`)
  return (res.status === 204 ? undefined : await res.json()) as T
}

/** Back to the demo seed (the API allows it for HR and ADMIN). */
export async function resetDemo(): Promise<void> {
  await api(await apiLogin(ADMIN), 'POST', '/api/demo/reset')
}

/** Sets the theme (and optionally a signed-in user) before any script of the app runs. */
export async function prepare(page: Page, theme: ThemeName, token?: string): Promise<void> {
  await page.addInitScript(
    ([prefs, t]) => {
      localStorage.setItem('kompas.prefs', prefs)
      if (t) sessionStorage.setItem('kompas.token', t)
    },
    [JSON.stringify(THEMES[theme]), token ?? ''] as const,
  )
}

/** Waits until the page settled: no spinner, fonts loaded. */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 })
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
}

/** axe-core with the WCAG 2.0/2.1 A and AA rules; fails with a readable list of every violation. */
export async function expectNoAxeViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const report = results.violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `    ${n.target.join(' ')} → ${n.failureSummary?.split('\n').slice(1).join(' ')}`).join('\n')}`)
    .join('\n')
  expect(results.violations, `${label}\n${report}`).toEqual([])
}
