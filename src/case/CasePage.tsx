import { FileDown, FileText, MessageSquareText, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import type { CaseDetail, StageId } from '../api/cases'
import type { CompetencyModel } from '../api/kompas'
import { AssistantPanel, type AssistantRequest } from '../assistant/AssistantPanel'
import { ErrorState, LoadingState } from '../components/QueryState'
import { BackLink, Snackbar, Spinner, StageStepper, StatusBadge } from '../components/ui'
import { useCase, useSheetDownload } from '../lib/caseQueries'
import { useFeatures } from '../lib/features'
import { caseCriteria, useModel, useSheets, type CaseCriteria } from '../lib/model'
import { canOpenStage, caseSteps, caseUrl, CASE_STATUS_LABEL, stageFromSlug, stepTarget, STAGE_SHORT, STAGE_SLUG, viewStage } from '../lib/stages'
import { HOME_BY_ROLE, useMe } from '../lib/useAuth'
import s from './CasePage.module.css'
import { AssessmentStage } from './stages/AssessmentStage'
import { DocumentStage } from './stages/DocumentStage'
import { FirstConditionsStage } from './stages/FirstConditionsStage'
import { IntroTalkStage, ReportStage } from './stages/FirstPrepStages'
import { AssessmentTalkStage } from './stages/AssessmentTalkStage'
import { JustificationStage } from './stages/JustificationStage'
import { ObservationStage } from './stages/ObservationStage'
import { OspAnalysisStage } from './stages/OspAnalysisStage'
import { SheetProposalStage } from './stages/SheetProposalStage'
import { SheetWizard } from './stages/SheetWizard'
import { StageNotOpen } from './stages/StageNotOpen'

export interface StageProps {
  detail: CaseDetail
  model: CompetencyModel
  criteria: CaseCriteria
  stage: StageId
  /** Opens the assistant panel and asks a question there; missing when the assistant is turned off (FEATURE_ASSISTANT). */
  askAssistant?: (request: Omit<AssistantRequest, 'id'>) => void
}

function readAssistantPref(): boolean {
  try {
    const v = localStorage.getItem('kompas.assistant')
    if (v !== null) return v === '1'
  } catch {
    // ignore
  }
  return window.innerWidth >= 1500
}

const STATUS_TONE = {
  W_TOKU: 'info',
  DO_ZAPOZNANIA: 'warning',
  OKRES_SPRZECIWU: 'warning',
  ZAKONCZONA: 'success',
} as const

export function CasePage() {
  const { id = '', stage: slug } = useParams()
  const me = useMe()
  const q = useCase(id)
  const model = useModel()
  const sheets = useSheets()
  const features = useFeatures()
  const [assistantPref, setAssistantOpen] = useState(readAssistantPref)
  const assistantOpen = features.assistant && assistantPref
  const [assistantRequest, setAssistantRequest] = useState<AssistantRequest | null>(null)
  const workRef = useRef<HTMLElement>(null)
  useEffect(() => {
    workRef.current?.scrollTo({ top: 0 })
  }, [slug])

  const toggleAssistant = () => {
    setAssistantOpen((v) => {
      try {
        localStorage.setItem('kompas.assistant', v ? '0' : '1')
      } catch {
        // ignore
      }
      return !v
    })
  }

  if (q.isPending || model.isPending || sheets.isPending) return <div className="page"><LoadingState /></div>
  if (q.isError) return <div className="page"><ErrorState error={q.error} what="teczka oceny" onRetry={() => q.refetch()} /></div>
  if (model.isError) return <div className="page"><ErrorState error={model.error} what="model kompetencji" /></div>

  const detail = q.data
  const stage = stageFromSlug(slug)
  if (!stage || !detail.stages.some((st) => st.id === stage)) return <Navigate to={caseUrl(detail.id, viewStage(detail.stages, detail.currentStage))} replace />
  // A stage shown in another stage's view (the assessment period → the sheet of step 3), e.g. an old /obserwacje link.
  const shown = viewStage(detail.stages, stage)
  if (shown !== stage) return <Navigate to={caseUrl(detail.id, shown)} replace />
  if (slug !== STAGE_SLUG[stage]) return <Navigate to={caseUrl(detail.id, stage)} replace />

  const criteria = caseCriteria(detail, sheets.data)
  const askAssistant = features.assistant
    ? (req: Omit<AssistantRequest, 'id'>) => {
        if (!assistantPref) toggleAssistant()
        setAssistantRequest((prev) => ({ ...req, id: (prev?.id ?? 0) + 1 }))
      }
    : undefined
  const props: StageProps = { detail, model: model.data, criteria, stage, askAssistant }
  const name = `${detail.person.firstName} ${detail.person.lastName}`
  const sheetLabel = detail.path === 'FIRST' ? 'Arkusz pierwszej oceny' : detail.sheetId ? `Arkusz ${detail.sheetId}` : 'Arkusz nieustalony'
  const steps = caseSteps(detail)
  const activeStep = steps.find((st) => st.stages.some((x) => x.id === stage))

  return (
    <div className={`${s.root} ${assistantOpen ? s.withAssistant : ''}`}>
      <header className={s.head}>
        <div className={s.headTop}>
          <BackLink to={HOME_BY_ROLE[me.role]} />
          <div className={s.actions}>
            <Link className="btn" to={`/teczka/${detail.id}/arkusz`}>
              <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
              Podgląd arkusza
            </Link>
            <SheetPdfButton detail={detail} />
            {features.assistant && (
              <button type="button" className={`btn ${assistantOpen ? 'btn--pressed' : ''}`} aria-pressed={assistantOpen} onClick={toggleAssistant}>
                <MessageSquareText size={15} strokeWidth={1.75} aria-hidden="true" />
                Asystent
              </button>
            )}
          </div>
        </div>
        <div className={s.person}>
          <h1 className={s.name}>{name}</h1>
          <StatusBadge tone={STATUS_TONE[detail.status]}>{CASE_STATUS_LABEL[detail.status]}</StatusBadge>
        </div>
        <p className={s.position}>
          {detail.person.position}
          <span className={s.cycle}> · {detail.path === 'FIRST' ? 'Pierwsza ocena w służbie cywilnej' : detail.cycleLabel} · {sheetLabel}</span>
        </p>
        <div className={s.stepper}>
          <StageStepper
            label={detail.path === 'FIRST' ? 'Etapy pierwszej oceny' : 'Etapy oceny okresowej'}
            activeKey={activeStep?.key}
            steps={steps.map((st) => ({ key: st.key, label: st.label, status: st.status, to: caseUrl(detail.id, stepTarget(st)) }))}
          />
        </div>
      </header>

      <div className={s.body}>
        <section ref={workRef} className={`case-work ${s.work}`} aria-label={`Etap: ${STAGE_SHORT[stage]}`}>
          {canOpenStage(detail, stage) ? <StageWorkspace {...props} /> : <StageNotOpen detail={detail} stage={stage} />}
        </section>
        {assistantOpen && (
          <AssistantPanel
            context={{
              caseId: detail.id,
              stageId: stage,
              label: `${STAGE_SHORT[stage]} · ${name} · ${sheetLabel}`,
            }}
            onClose={toggleAssistant}
            request={assistantRequest}
          />
        )}
      </div>
    </div>
  )
}

function StageWorkspace(p: StageProps) {
  switch (p.stage) {
    case 'OSP_ANALYSIS':
      return <OspAnalysisStage {...p} />
    case 'SHEET_PROPOSAL':
      return <SheetProposalStage {...p} />
    case 'OPENING_TALK':
      return <SheetWizard {...p} />
    case 'OBSERVATION':
      return <ObservationStage {...p} />
    case 'ASSESSMENT':
    case 'FIRST_ASSESSMENT':
      return <AssessmentStage {...p} />
    case 'ASSESSMENT_TALK':
      return <AssessmentTalkStage {...p} />
    case 'JUSTIFICATION':
      return <JustificationStage {...p} />
    case 'FIRST_CONDITIONS':
      return <FirstConditionsStage {...p} />
    case 'DOCUMENT':
    case 'FIRST_DOCUMENT':
      return <DocumentStage {...p} />
    case 'INTRO_TALK':
      return <IntroTalkStage {...p} />
    case 'REPORT':
      return <ReportStage {...p} />
  }
}

/**
 * "Pobierz PDF" in the case header: the filled periodic sheet generated by the API. The first assessment has no
 * file yet, so there the button opens the print view (save as PDF from the print dialog).
 */
function SheetPdfButton({ detail }: { detail: CaseDetail }) {
  const { download, pending, error, reset } = useSheetDownload(detail.id)
  if (detail.path === 'FIRST') {
    return (
      <Link className="btn" to={`/teczka/${detail.id}/arkusz?druk=1`}>
        <Printer size={15} strokeWidth={1.75} aria-hidden="true" />
        Drukuj arkusz
      </Link>
    )
  }
  return (
    <>
      <button type="button" className="btn" disabled={pending !== undefined} aria-busy={pending !== undefined || undefined} onClick={() => download('pdf')}>
        {pending ? <Spinner label="Trwa przygotowanie pliku PDF" /> : <FileDown size={15} strokeWidth={1.75} aria-hidden="true" />}
        Pobierz PDF
      </button>
      <Snackbar open={!!error} message={`Nie udało się pobrać arkusza. ${error?.message ?? ''}`} onClose={reset} duration={0} />
    </>
  )
}
