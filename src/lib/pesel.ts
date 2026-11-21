const WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]

/** PESEL: exactly 11 digits and a valid check digit. */
export function isValidPesel(value: string) {
  if (!/^\d{11}$/.test(value)) return false
  const d = [...value].map(Number)
  const sum = WEIGHTS.reduce((acc, w, i) => acc + w * d[i], 0)
  return (10 - (sum % 10)) % 10 === d[10]
}

/** Polish error message for a PESEL field, or undefined when it is valid. */
export function peselError(raw: string) {
  const v = raw.replace(/\s/g, '')
  if (!v) return 'Wpisz numer PESEL'
  if (!/^\d+$/.test(v)) return 'PESEL może zawierać tylko cyfry'
  if (v.length !== 11) return 'PESEL musi mieć 11 cyfr'
  if (!isValidPesel(v)) return 'Ten numer PESEL jest niepoprawny. Sprawdź, czy nie ma literówki'
  return undefined
}
