import type { CaseAction, CaseDetail, Path, StageId, StageInfo } from '../api/cases'

/** URL slugs for /teczka/:id/:stage. */
export const STAGE_SLUG: Record<StageId, string> = {
  OSP_ANALYSIS: 'analiza-osp',
  SHEET_PROPOSAL: 'proponowany-formularz',
  OPENING_TALK: 'rozmowa-rozpoczynajaca',
  OBSERVATION: 'obserwacje',
  ASSESSMENT: 'formularz-kompetencji',
  JUSTIFICATION: 'uzasadnienie',
  DOCUMENT: 'dokument',
  INTRO_TALK: 'rozmowa-wstepna',
  REPORT: 'sprawozdanie',
  FIRST_ASSESSMENT: 'ocena-pierwsza',
  FIRST_CONDITIONS: 'warunki',
  FIRST_DOCUMENT: 'dokument-pierwsza',
}

/** Old slugs still accepted in links; CasePage redirects them to the current slug. */
const LEGACY_SLUG: Record<string, StageId> = {
  'wstepny-formularz': 'SHEET_PROPOSAL',
  ocena: 'ASSESSMENT',
}

export function stageFromSlug(slug: string | undefined): StageId | null {
  if (!slug) return null
  const hit = (Object.entries(STAGE_SLUG) as [StageId, string][]).find(([, s]) => s === slug)
  return hit ? hit[0] : (LEGACY_SLUG[slug] ?? null)
}

export const caseUrl = (id: string, stage?: StageId) =>
  stage ? `/teczka/${id}/${STAGE_SLUG[stage]}` : `/teczka/${id}`

/** Short names used in compact places (team table, HR table, context chip). */
export const STAGE_SHORT: Record<StageId, string> = {
  OSP_ANALYSIS: 'Analiza OSP',
  SHEET_PROPOSAL: 'Proponowany formularz',
  OPENING_TALK: 'Rozmowa rozpoczynająca',
  OBSERVATION: 'Okres oceny',
  ASSESSMENT: 'Formularz oceny kompetencji',
  JUSTIFICATION: 'Uzasadnienie i IPRZ',
  DOCUMENT: 'Dokument',
  INTRO_TALK: 'Rozmowa wstępna',
  REPORT: 'Sprawozdanie',
  FIRST_ASSESSMENT: 'Ocena',
  FIRST_CONDITIONS: 'Warunki',
  FIRST_DOCUMENT: 'Dokument',
}

/** Stage headings the UI names differently than the API (the backend label is kept for the legal record). */
const STAGE_TITLE: Partial<Record<StageId, string>> = {
  SHEET_PROPOSAL: 'Proponowany formularz',
  ASSESSMENT: 'Formularz oceny kompetencji',
}

export const stageTitle = (info: Pick<StageInfo, 'id' | 'name'>) => STAGE_TITLE[info.id] ?? info.name

export function pathLabel(path: Path, sheetId: string | null): string {
  if (path === 'FIRST') return 'Pierwsza ocena'
  return sheetId ? `Okresowa · arkusz ${sheetId}` : 'Okresowa · arkusz do ustalenia'
}

export const CASE_STATUS_LABEL = {
  W_TOKU: 'W toku',
  DO_ZAPOZNANIA: 'Do zapoznania',
  OKRES_SPRZECIWU: 'Okres sprzeciwu',
  ZAKONCZONA: 'Zakończona',
} as const

const EVAL_GROUP: StageId[][] = [
  ['ASSESSMENT', 'JUSTIFICATION'],
  ['FIRST_ASSESSMENT', 'FIRST_CONDITIONS'],
]

/** A stage can be worked on when done/current, or when it shares the evaluation step with the current one. */
export function canOpenStage(detail: CaseDetail, stage: StageId): boolean {
  const info = detail.stages.find((s) => s.id === stage)
  if (!info) return false
  if (info.status === 'DONE' || info.status === 'CURRENT') return true
  return EVAL_GROUP.some((g) => g.includes(stage) && g.includes(detail.currentStage))
}


/** Uses the backend's `availableActions` when present; otherwise assumes the action may be legal. */
export function allows(detail: CaseDetail, action: CaseAction): boolean {
  return detail.availableActions ? detail.availableActions.includes(action) : true
}

export type StepStatus = 'done' | 'current' | 'todo'

/** One step of the horizontal stage stepper: a group of backend stages under one name. */
export interface CaseStep {
  key: string
  label: string
  stages: StageInfo[]
  status: StepStatus
}

/**
 * The six steps of the periodic assessment as the design names them, each grouping one or more backend
 * stages (the process itself and its legal rules stay in the backend). Stages missing from the case are
 * skipped and stages not listed here get a step of their own, so the stepper follows whatever the API sends.
 */
const PERIODIC_STEPS: { key: string; label: string; stages: StageId[] }[] = [
  { key: 'analiza', label: 'Analiza opisu stanowiska', stages: ['OSP_ANALYSIS'] },
  { key: 'proponowany', label: 'Proponowany formularz', stages: ['SHEET_PROPOSAL'] },
  { key: 'formularz', label: 'Formularz oceny', stages: ['OPENING_TALK', 'OBSERVATION'] },
  { key: 'kompetencje', label: 'Formularz oceny kompetencji', stages: ['ASSESSMENT'] },
  { key: 'weryfikacja', label: 'Weryfikacja formularza', stages: ['JUSTIFICATION'] },
  { key: 'koncowa', label: 'Ocena końcowa', stages: ['DOCUMENT'] },
]

function stepStatus(stages: StageInfo[]): StepStatus {
  if (stages.every((s) => s.status === 'DONE')) return 'done'
  if (stages.some((s) => s.status === 'CURRENT' || s.status === 'DONE')) return 'current'
  return 'todo'
}

export function caseSteps(detail: Pick<CaseDetail, 'path' | 'stages'>): CaseStep[] {
  const byId = new Map(detail.stages.map((s) => [s.id, s]))
  const groups = detail.path === 'PERIODIC' ? PERIODIC_STEPS : []
  const steps: CaseStep[] = []
  const used = new Set<StageId>()
  for (const g of groups) {
    const stages = g.stages.map((id) => byId.get(id)).filter((s): s is StageInfo => !!s)
    if (stages.length === 0) continue
    stages.forEach((s) => used.add(s.id))
    steps.push({ key: g.key, label: g.label, stages, status: stepStatus(stages) })
  }
  // Anything not grouped above (the first-assessment path, a stage added later) keeps its own step, in API order.
  detail.stages.forEach((s, i) => {
    if (used.has(s.id)) return
    const step: CaseStep = { key: s.id, label: STAGE_SHORT[s.id] ?? s.name, stages: [s], status: stepStatus([s]) }
    const before = detail.stages.slice(0, i).map((x) => x.id)
    const at = steps.findIndex((st) => st.stages.every((x) => !before.includes(x.id)))
    if (at === -1) steps.push(step)
    else steps.splice(at, 0, step)
  })
  return steps
}

/** Where a step's link leads: its current stage, else its last finished one, else its first. */
export function stepTarget(step: CaseStep): StageId {
  const current = step.stages.find((s) => s.status === 'CURRENT')
  if (current) return current.id
  const done = step.stages.filter((s) => s.status === 'DONE')
  return (step.status === 'done' ? step.stages[0] : done.at(-1) ?? step.stages[0]).id
}
