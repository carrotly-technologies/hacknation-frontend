import type { Person } from '../api/cases'
import type { AssessmentResult, HistoryItem, PersonProfile, SystemHistoryEntry } from '../api/people'

/** The employee profile (/pracownik/:personId). */
export const personUrl = (personId: string) => `/pracownik/${encodeURIComponent(personId)}`

export const EMPLOYMENT_LABEL: Record<Person['employment'], string> = {
  URZEDNIK: 'Urzędnik służby cywilnej',
  PRACOWNIK: 'Pracownik służby cywilnej',
}

export const RESULT_LABEL: Record<AssessmentResult, string> = {
  POSITIVE: 'Pozytywna',
  NEGATIVE: 'Negatywna',
}

/** The newest assessment the assessed person has acknowledged (signed and accepted), if any. */
export function lastCompleted(history: HistoryItem[]): (SystemHistoryEntry & { result: AssessmentResult }) | null {
  const hit = history.find((h): h is SystemHistoryEntry => h.source === 'SYSTEM' && !!h.result && !!h.acknowledgedOn)
  return hit ? { ...hit, result: hit.result! } : null
}

/** Label of the main button: continue the current case, or start the next assessment. */
export function assessmentAction(profile: PersonProfile): string {
  const first = profile.currentCase ? profile.currentCase.path === 'FIRST' : profile.nextAssessment === 'PIERWSZA'
  if (profile.currentCase) return first ? 'Kontynuuj pierwszą ocenę' : 'Kontynuuj ocenę okresową'
  return first ? 'Rozpocznij pierwszą ocenę' : 'Rozpocznij ocenę okresową'
}
