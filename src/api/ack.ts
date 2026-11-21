import { apiGet, apiPost } from './client'
import type { CaseDetail, Deadline, PartI, Person, StageInfo } from './cases'
import type { ScaleLevel, Sheet } from './kompas'

// Public routes for the assessed person (no sign-in): GET/POST /api/ack/:token (backend README).

/** What the read-only sheet prints; no ids, observations, indicator ratings or history. */
export interface AckSheetData
  extends Pick<
    CaseDetail,
    | 'path'
    | 'sheetId'
    | 'officeName'
    | 'evaluator'
    | 'decisions'
    | 'evaluation'
    | 'justification'
    | 'iprz'
    | 'previousAssessment'
    | 'promotionRequest'
    | 'firstConditions'
    | 'assessmentTalkOn'
    | 'signedByEvaluatorOn'
  > {
  person: Omit<Person, 'id'>
  stages: Pick<StageInfo, 'id' | 'completedOn'>[]
  partI: Pick<PartI, 'additionalCriteria' | 'assessmentDue' | 'confirmedByEvaluatorOn' | 'acknowledgedByEmployeeOn'>
  acknowledgedOn: null
}

/** Before the confirmation. */
export interface AckPending {
  acknowledgedOn: null
  expiresOn: string
  case: AckSheetData
  sheet: Sheet | null
  scale: ScaleLevel[]
  competencies: { id: string; name: string }[]
}

/** After the confirmation (GET again, and the POST response). */
export interface AckDone {
  acknowledgedOn: string
  /** Only for a periodic assessment: the objection term (art. 83 ust. 1 ustawy). */
  objectionDeadline: Deadline | null
}

export type AckResponse = AckPending | AckDone

export const getAck = (token: string, signal?: AbortSignal) =>
  apiGet<AckResponse>(`/ack/${encodeURIComponent(token)}`, signal)
export const confirmAck = (token: string) => apiPost<AckDone>(`/ack/${encodeURIComponent(token)}`, { confirmed: true })
