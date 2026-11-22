/** Fixed demo "today" — keep in sync with the backend's DEMO_TODAY. */
export const DEMO_TODAY = '2026-11-21'

const MONTHS_GEN = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

/** 2026-12-12 → 12.12.2026 (format used in the official sheets: dd.mm.rrrr). */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}.${m}.${y}`
}

/** 2026-12-12 → 12 grudnia 2026 */
export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS_GEN[m - 1]} ${y}`
}

function plural(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n)
  if (abs === 1) return one
  const d = abs % 10
  const h = abs % 100
  return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many
}

export const days = (n: number) => `${n} ${plural(n, 'dzień', 'dni', 'dni')}`

/** 1 kryterium, 3 kryteria, 5 kryteriów. */
export const criteriaCount = (n: number) => `${n} ${plural(n, 'kryterium', 'kryteria', 'kryteriów')}`

/** Lower case without Polish diacritics, for search that ignores both ("Łączność" matches "lacznosc"). */
export function foldText(text: string): string {
  return text.toLocaleLowerCase('pl').normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l')
}

/** Relative deadline text: "za 21 dni", "dziś", "po terminie 3 dni". */
export function fmtDaysLeft(daysLeft: number | null): string {
  if (daysLeft === null) return ''
  if (daysLeft === 0) return 'dziś'
  if (daysLeft === 1) return 'jutro'
  if (daysLeft > 0) return `za ${days(daysLeft)}`
  return `po terminie ${days(-daysLeft)}`
}

/** 4.2 → "4,20" (exact average, Polish decimal comma). */
export function fmtAvg(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return n.toFixed(digits).replace('.', ',')
}

export function plPoints(n: number): string {
  return `${n} ${plural(n, 'punkt', 'punkty', 'punktów')}`
}

export function countLabel(n: number, one: string, few: string, many: string) {
  return `${n} ${plural(n, one, few, many)}`
}

/** "RZETELNOŚĆ" → "Rzetelność"; keeps "i ORIENTACJA" lower-cased too. */
export function sentenceCase(s: string): string {
  const lower = s.toLocaleLowerCase('pl-PL')
  return lower.charAt(0).toLocaleUpperCase('pl-PL') + lower.slice(1)
}

export function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`
}
