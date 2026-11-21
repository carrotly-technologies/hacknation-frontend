import { apiGet, apiPatch, apiPost } from './client'
import type { EvaluateResponse, SheetId } from './kompas'

// Types follow notatki/api-kontrakt-v2.md.

export type Path = 'PERIODIC' | 'FIRST'
export type StageId =
  | 'OSP_ANALYSIS'
  | 'SHEET_PROPOSAL'
  | 'OPENING_TALK'
  | 'OBSERVATION'
  | 'ASSESSMENT'
  | 'ASSESSMENT_TALK'
  | 'JUSTIFICATION'
  | 'DOCUMENT'
  | 'INTRO_TALK'
  | 'REPORT'
  | 'FIRST_ASSESSMENT'
  | 'FIRST_CONDITIONS'
  | 'FIRST_DOCUMENT'
export type StageStatus = 'DONE' | 'CURRENT' | 'UPCOMING' | 'LOCKED'
export type DeadlineState = 'OK' | 'SOON' | 'OVERDUE' | 'NONE'
export type CaseStatus = 'W_TOKU' | 'DO_ZAPOZNANIA' | 'OKRES_SPRZECIWU' | 'ZAKONCZONA'
export type Points = 1 | 3 | 5 | 7 | 9

export interface Person {
  id: string
  firstName: string
  lastName: string
  position: string
  unit: string
  employment: 'URZEDNIK' | 'PRACOWNIK'
  hiredOn: string
}

export interface Deadline {
  date: string | null
  daysLeft: number | null
  state: DeadlineState
  label: string
  legalBasis: string
}

export interface StageInfo {
  id: StageId
  name: string
  status: StageStatus
  deadline: Deadline | null
  completedOn: string | null
  legalBasis: string
}

export interface CaseSummary {
  id: string
  person: Person
  path: Path
  sheetId: SheetId | null
  cycleLabel: string
  currentStage: StageId
  stages: StageInfo[]
  nextDeadline: Deadline | null
  status: CaseStatus
}

export interface Observation {
  id: string
  date: string
  criterionId: string
  indicatorId: string | null
  kind: 'STRENGTH' | 'DEVELOPMENT'
  situation: string
  action: string
  result: string
}

export interface OspDoc {
  id: string
  title: string
  purpose: string
  subordinates: string
  mainTasks: string[]
  softCompetencies: string[]
  otherRequirements: string[]
  source: string
}

export interface PartI {
  additionalCriteria: string[]
  assessmentDue: string | null
  topics: { duties: string; criteria: string; expectations: string; goals: string }
  expectations: Record<string, string>
  confirmedByEvaluatorOn: string | null
  acknowledgedByEmployeeOn: string | null
}

export type ExamPassed = 'YES' | 'NO' | 'NOT_APPLICABLE'

export interface FirstConditions {
  examPassed: ExamPassed | null
  reportSubmittedOn: string | null
  reportDue: string | null
}

/** "Dane dotyczące poprzedniej oceny okresowej urzędnika służby cywilnej"; `level` as the sheet writes it. */
export interface PreviousAssessment {
  result: 'POSITIVE' | 'NEGATIVE' | null
  level: string | null
  date: string | null
}

/** Answer to "Czy do oceny okresowej dołączono wniosek o przyznanie kolejnego stopnia służbowego?". */
export type PromotionAttached = 'YES' | 'NO' | 'NOT_APPLICABLE'

/** The answer above and part III of the sheet; part III fields are kept only while `attached` is YES. */
export interface PromotionRequest {
  attached: PromotionAttached | null
  appointedYear: number | null
  currentGrade: string | null
  gradeGrantedOn: string | null
  requestedGrade: string | null
  motivation: string
}

export interface FormalCheckItem {
  id: string
  ok: boolean
  message: string
  legalBasis: string | null
}

/** One topic of the assessment talk (§10 pkt 1–3 rozp. PRM z 4.04.2016), sent by the API. */
export interface AssessmentTalkTopic {
  id: string
  /** Short wording for the checklist. */
  label: string
  /** The point of §10 word for word. */
  quote: string
  legalBasis: string
}

export interface CaseDetail extends CaseSummary {
  evaluator: { firstName: string; lastName: string; position: string; unit: string }
  officeName: string
  osp: OspDoc | null
  ospAnalysis: {
    suggestedSheet: { sheetId: SheetId; reason: string; legalBasis: string } | null
    additionalCandidates: { criterionId: string; reason: string; ospQuote: string }[]
  } | null
  partI: PartI
  observations: Observation[]
  ratings: Record<string, Record<string, Points | null>>
  decisions: Record<string, number>
  deviationNotes: Record<string, string>
  justification: string
  iprz: string
  previousAssessment: PreviousAssessment | null
  promotionRequest: PromotionRequest
  firstConditions: FirstConditions | null
  /** Date of the assessment talk (RECORD_ASSESSMENT_TALK); null until recorded. */
  assessmentTalkOn: string | null
  /** What the assessment talk covers (§10); empty for the first assessment. */
  assessmentTalkTopics: AssessmentTalkTopic[]
  evaluation: EvaluateResponse | null
  formalCheck: FormalCheckItem[]
  signedByEvaluatorOn: string | null
  /** First handover to the assessed person (SEND_FOR_ACK). */
  sentForAckOn?: string | null
  /** "/zapoznanie/{token}" for the case's evaluator until the assessed person confirms; a frontend path. */
  ackLink?: string | null
  ackLinkExpiresOn?: string | null
  acknowledgedOn: string | null
  objectionDeadline: Deadline | null
  history: { date: string; text: string }[]
  /** Legal actions right now (backend extension of the v2 contract). */
  availableActions?: CaseAction[]
}

export interface CasePatch {
  sheetId?: SheetId
  partI?: Partial<PartI>
  ratings?: CaseDetail['ratings']
  decisions?: Record<string, number | null>
  deviationNotes?: Record<string, string | null>
  justification?: string
  iprz?: string
  /** null clears it */
  previousAssessment?: Partial<PreviousAssessment> | null
  promotionRequest?: Partial<PromotionRequest>
  firstConditions?: Partial<FirstConditions>
}

export type CaseAction =
  | 'ACCEPT_OSP_ANALYSIS'
  | 'ACCEPT_SHEET'
  | 'CONFIRM_PART_I'
  | 'EMPLOYEE_ACK_PART_I'
  | 'START_ASSESSMENT'
  | 'RECORD_ASSESSMENT_TALK'
  | 'SIGN_ASSESSMENT'
  | 'SEND_FOR_ACK'
  | 'EMPLOYEE_ACK_ASSESSMENT'
  | 'REPORT_SUBMITTED'
  | 'COMPLETE_INTRO_TALK'

export type Role = 'SUPERVISOR' | 'HR' | 'ADMIN'

/** GET /api/me: the signed-in user. */
export interface Me {
  id: string
  login: string
  name: string
  role: Role
  position: string
  unit: string
  officeName: string
}

export interface TodoItem {
  caseId: string
  stageId: StageId
  text: string
  deadline: Deadline
}

export interface TeamResponse {
  cases: CaseSummary[]
  todo: TodoItem[]
}

export type HrCase = CaseSummary & { evaluatorName: string; lastReminderOn: string | null }

export interface HrOverview {
  counters: {
    inProgress: number
    dueSoon: number
    overdue: number
    awaitingAck: number
    objectionPeriod: number
  }
  cases: HrCase[]
}

export interface ReminderResponse {
  sent: number
  log: { caseId: string; date: string; text: string }[]
}

export const getMe = (signal?: AbortSignal) => apiGet<Me>('/me', signal)
export const getTeam = (signal?: AbortSignal) => apiGet<TeamResponse>('/team', signal)
export const getCase = (id: string, signal?: AbortSignal) =>
  apiGet<CaseDetail>(`/cases/${encodeURIComponent(id)}`, signal)
export const patchCase = (id: string, body: CasePatch) =>
  apiPatch<CaseDetail>(`/cases/${encodeURIComponent(id)}`, body)
export const addObservation = (id: string, body: Omit<Observation, 'id'>) =>
  apiPost<CaseDetail>(`/cases/${encodeURIComponent(id)}/observations`, body)
/** An action with its extra fields: `date` (RRRR-MM-DD) only for RECORD_ASSESSMENT_TALK, today when missing. */
export interface CaseActionInput {
  action: CaseAction
  date?: string
}

export const runCaseAction = (id: string, input: CaseAction | CaseActionInput) =>
  apiPost<CaseDetail>(`/cases/${encodeURIComponent(id)}/actions`, typeof input === 'string' ? { action: input } : input)
export const getOspList = (signal?: AbortSignal) => apiGet<OspDoc[]>('/osp', signal)
export const getHrOverview = (signal?: AbortSignal) => apiGet<HrOverview>('/hr/overview', signal)
export const sendReminders = (caseIds: string[]) =>
  apiPost<ReminderResponse>('/hr/reminders', { caseIds })
export const resetDemo = () => apiPost<unknown>('/demo/reset', {})
