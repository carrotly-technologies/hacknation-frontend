import { apiGet } from './client'
import type { CaseStatus, Path, Person, StageId } from './cases'

/** Contract of GET /api/people/:personId (backend src/people/people.types.ts). */

export type AssessmentResult = 'POSITIVE' | 'NEGATIVE'

/** An assessment case kept in the system. `result` only once the evaluator signed it. */
export interface SystemHistoryEntry {
  source: 'SYSTEM'
  caseId: string
  path: Path
  cycleLabel: string
  status: CaseStatus
  result: AssessmentResult | null
  /** Overall level of a periodic assessment; null for the first assessment and while in progress. */
  level: string | null
  signedByEvaluatorOn: string | null
  acknowledgedOn: string | null
}

/** The previous periodic assessment made before the system (part II of the oldest sheet). */
export interface ExternalHistoryEntry {
  source: 'EXTERNAL'
  result: AssessmentResult | null
  level: string | null
  date: string | null
}

export type HistoryItem = SystemHistoryEntry | ExternalHistoryEntry

export interface PersonSupervisor {
  firstName: string
  lastName: string
  position: string
  unit: string
}

export interface PersonProfile {
  person: Person
  supervisor: PersonSupervisor | null
  /** Newest first; the external entry (if any) last. */
  history: HistoryItem[]
  currentCase: { id: string; path: Path; currentStage: StageId } | null
  nextAssessment: 'OKRESOWA' | 'PIERWSZA'
}

export const getPerson = (personId: string, signal?: AbortSignal) =>
  apiGet<PersonProfile>(`/people/${encodeURIComponent(personId)}`, signal)
