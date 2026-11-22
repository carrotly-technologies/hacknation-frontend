import { useCallback, useSyncExternalStore } from 'react'

/**
 * Appearance settings (/ustawienia): theme, text size and high contrast.
 * Kept only in this browser's localStorage (UI preferences, no personal data) and applied to <html>:
 * `data-theme` ("light" | "dark"; none = follow the system), `data-contrast="high"` and `style.fontSize`.
 * public/preferences-init.js (loaded by index.html) applies the same key before the first paint, so keep the two in step.
 */
export type Theme = 'system' | 'light' | 'dark'
export type TextSize = 100 | 125 | 150
export type Preferences = { theme: Theme; textSize: TextSize; highContrast: boolean }

export const PREFS_KEY = 'kompas.prefs'
export const DEFAULT_PREFS: Preferences = { theme: 'system', textSize: 100, highContrast: false }
export const TEXT_SIZES: readonly TextSize[] = [100, 125, 150]

const THEMES: readonly Theme[] = ['system', 'light', 'dark']

/** Keeps only known values; anything else (old or hand-edited storage) falls back to the default. */
export function parsePreferences(raw: string | null): Preferences {
  let v: Partial<Record<keyof Preferences, unknown>> = {}
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (parsed && typeof parsed === 'object') v = parsed
  } catch {
    // broken JSON: defaults
  }
  return {
    theme: THEMES.includes(v.theme as Theme) ? (v.theme as Theme) : DEFAULT_PREFS.theme,
    textSize: TEXT_SIZES.includes(v.textSize as TextSize) ? (v.textSize as TextSize) : DEFAULT_PREFS.textSize,
    highContrast: v.highContrast === true,
  }
}

function load(): Preferences {
  try {
    return parsePreferences(localStorage.getItem(PREFS_KEY))
  } catch {
    // storage blocked (private mode, policy): defaults for this visit
    return DEFAULT_PREFS
  }
}

/** Puts the preferences on <html>; tokens.css and the rem-based type scale do the rest. */
export function applyPreferences(p: Preferences, root: HTMLElement = document.documentElement): void {
  if (p.theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', p.theme)
  // the browser canvas (scrollbars, the area before CSS loads) follows the chosen theme too
  root.style.colorScheme = p.theme === 'system' ? '' : p.theme
  if (p.highContrast) root.setAttribute('data-contrast', 'high')
  else root.removeAttribute('data-contrast')
  // a percentage keeps the user's own browser font size as the 100% base
  root.style.fontSize = p.textSize === 100 ? '' : `${p.textSize}%`
}

let current: Preferences | null = null
const listeners = new Set<() => void>()

function snapshot(): Preferences {
  current ??= load()
  return current
}

function set(next: Preferences): void {
  current = next
  applyPreferences(next)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // a change made in another tab applies here as well
  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFS_KEY) set(parsePreferences(e.newValue))
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Saves a change, applies it at once and notifies every component using the hook. */
export function updatePreferences(patch: Partial<Preferences>): void {
  const next = { ...snapshot(), ...patch }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  } catch {
    // storage blocked: the change still applies until the page is closed
  }
  set(next)
}

/** Current appearance settings and a setter that saves and applies a change. */
export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const prefs = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_PREFS)
  const update = useCallback((patch: Partial<Preferences>) => updatePreferences(patch), [])
  return [prefs, update]
}

/** Re-applies the stored settings at app start (public/preferences-init.js already did it once). */
export function initPreferences(): void {
  applyPreferences(snapshot())
}
