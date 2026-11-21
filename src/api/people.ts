import { apiGet, apiPatch } from './client'
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

/** The job description (OSP) parts shown on the profile. */
export interface PersonOsp {
  title: string
  purpose: string
  mainTasks: string[]
}

export interface PersonProfile {
  person: Person
  supervisor: PersonSupervisor | null
  /** From the current case, else the latest; null when it has no OSP. */
  osp: PersonOsp | null
  /** Newest first; the external entry (if any) last. */
  history: HistoryItem[]
  currentCase: { id: string; path: Path; currentStage: StageId } | null
  nextAssessment: 'OKRESOWA' | 'PIERWSZA'
}

export const getPerson = (personId: string, signal?: AbortSignal) =>
  apiGet<PersonProfile>(`/people/${encodeURIComponent(personId)}`, signal)

/** Body of PATCH /api/people/:personId: all fields required, `hiredOn` not after today. */
export type UpdatePerson = Pick<Person, 'position' | 'unit' | 'employment' | 'hiredOn'>

export const updatePerson = (personId: string, data: UpdatePerson) =>
  apiPatch<PersonProfile>(`/people/${encodeURIComponent(personId)}`, data)
