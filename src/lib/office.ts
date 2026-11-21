/**
 * Miejscowość wpisywana przy podpisach na arkuszu oceny („miejscowość, data”): w podglądzie arkusza
 * (`SheetDocument`) i przy podpisie oceniającego w części II. Jedyne miejsce w kodzie.
 *
 * Ograniczenie: API nie podaje jeszcze miejscowości urzędu (jest tylko `officeName`), więc to wartość
 * demonstracyjna. Gdy backend ją doda, zmień tylko tę funkcję, żeby czytała ją z teczki.
 */
export function officePlace(): string {
  return 'Warszawa'
}
