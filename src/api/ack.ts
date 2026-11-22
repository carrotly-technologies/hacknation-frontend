import { apiGet, apiPost } from './client'
import type { CaseDetail, Deadline, PartI, Person, StageInfo } from './cases'
import type { ScaleLevel, Sheet } from './kompas'

// Public routes for the assessed person (no sign-in): GET/POST /api/ack/:token and POST /api/ack/:token/objection (backend README).

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

/** The assessed person's objection, filed once through the link (backend `Objection`). */
export interface Objection {
  text: string
  submittedOn: string
}

/**
 * After the confirmation (GET again, and the response of both POSTs). The link keeps working after the objection
 * term too, then with `objectionOpen: false`.
 */
export interface AckDone {
  acknowledgedOn: string
  /** Only for a periodic assessment: the objection term (art. 83 ust. 1 ustawy). */
  objectionDeadline: Deadline | null
  objection: Objection | null
  /** True while an objection can still be filed (periodic, none yet, within the term). */
  objectionOpen: boolean
}

/** Length limit of the objection text, as validated by POST /api/ack/:token/objection (a product limit, not a legal one). */
export const OBJECTION_MAX_LENGTH = 4000

export type AckResponse = AckPending | AckDone

export const getAck = (token: string, signal?: AbortSignal) =>
  apiGet<AckResponse>(`/ack/${encodeURIComponent(token)}`, signal)
export const confirmAck = (token: string) => apiPost<AckDone>(`/ack/${encodeURIComponent(token)}`, { confirmed: true })
export const submitObjection = (token: string, text: string) =>
  apiPost<AckDone>(`/ack/${encodeURIComponent(token)}/objection`, { text, confirmed: true })
