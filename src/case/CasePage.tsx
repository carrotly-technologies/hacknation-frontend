import { FileDown, FileText, Printer } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import type { AssistantContext } from '../api/assistant'
import type { CaseDetail, StageId } from '../api/cases'
import type { CompetencyModel } from '../api/kompas'
import { useAssistant, useAssistantContext, type AssistantRequest } from '../assistant/useAssistant'
import { ErrorState, LoadingState } from '../components/QueryState'
import { BackLink, InlineAlert, PageLayout, Snackbar, Spinner, StageStepper, StatusBadge } from '../components/ui'
import { useCase, useSheetDownload } from '../lib/caseQueries'
import { caseCriteria, useModel, useSheets, type CaseCriteria } from '../lib/model'
import { personUrl } from '../lib/people'
import { scrollPageToTop } from '../lib/scrollPage'
import { useMe } from '../lib/useAuth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { canOpenStage, caseSteps, caseUrl, CASE_STATUS_LABEL, stageFromSlug, stepTarget, STAGE_SHORT, STAGE_SLUG, viewStage } from '../lib/stages'
import s from './CasePage.module.css'
import { AssessmentStage } from './stages/AssessmentStage'
import { DocumentStage } from './stages/DocumentStage'
import { FirstConditionsStage } from './stages/FirstConditionsStage'
import { IntroTalkStage, ReportStage } from './stages/FirstPrepStages'
import { AssessmentTalkStage } from './stages/AssessmentTalkStage'
import { JustificationStage } from './stages/JustificationStage'
import { ObservationStage } from './stages/ObservationStage'
import { OspAnalysisStage } from './stages/OspAnalysisStage'
import { SheetWizard } from './stages/SheetWizard'
import { StageNotOpen } from './stages/StageNotOpen'

export interface StageProps {
  detail: CaseDetail
  model: CompetencyModel
  criteria: CaseCriteria
  stage: StageId
  /** Opens the "Asystent AI" popup and asks the question there. */
  askAssistant: (request: AssistantRequest) => void
}

const STATUS_TONE = {
  W_TOKU: 'info',
  DO_ZAPOZNANIA: 'warning',
  OKRES_SPRZECIWU: 'warning',
  ZAKONCZONA: 'success',
} as const

export function CasePage() {
  const { id = '', stage: slug } = useParams()
  const q = useCase(id)
  const me = useMe()
  // HR sees every case read-only (monitoring); only the case's evaluator edits it.
  const readOnly = me.role !== 'SUPERVISOR'
  const model = useModel()
  const sheets = useSheets()
  const assistant = useAssistant()
  // The assistant (popup in AppShell) knows the case and the stage on screen; only caseId and stageId go to the API.
  useAssistantContext(assistantContext(q.data, stageFromSlug(slug)))
  // The case file scrolls with the page (header and stepper included); a new step starts at the top.
  useEffect(() => {
    scrollPageToTop()
  }, [slug])
  const titleStage = stageFromSlug(slug)
  useDocumentTitle(
    q.data && titleStage ? `${STAGE_SHORT[titleStage]} — ${q.data.person.firstName} ${q.data.person.lastName}` : null,
  )

  if (q.isPending || model.isPending || sheets.isPending) return <PageLayout><LoadingState /></PageLayout>
  if (q.isError) return <PageLayout><ErrorState error={q.error} what="teczka oceny" onRetry={() => q.refetch()} /></PageLayout>
  if (model.isError) return <PageLayout><ErrorState error={model.error} what="model kompetencji" /></PageLayout>

  const detail = q.data
  const stage = stageFromSlug(slug)
  if (!stage || !detail.stages.some((st) => st.id === stage)) return <Navigate to={caseUrl(detail.id, viewStage(detail.stages, detail.currentStage))} replace />
  // A stage shown in another stage's view (the assessment period → the sheet of step 2, the proposed sheet → step 1), e.g. an old /obserwacje link.
  const shown = viewStage(detail.stages, stage)
  if (shown !== stage) return <Navigate to={caseUrl(detail.id, shown)} replace />
  if (slug !== STAGE_SLUG[stage]) return <Navigate to={caseUrl(detail.id, stage)} replace />

  const criteria = caseCriteria(detail, sheets.data)
  const props: StageProps = { detail, model: model.data, criteria, stage, askAssistant: assistant.open }
  const name = `${detail.person.firstName} ${detail.person.lastName}`
  const sheetLabel = sheetLabelOf(detail)
  const steps = caseSteps(detail)
  const activeStep = steps.find((st) => st.stages.some((x) => x.id === stage))

  return (
    <div className={s.root}>
      <header className={s.head}>
        <div className={s.inner}>
          <div className={s.headTop}>
            {readOnly ? <BackLink to="/hr">Monitoring ocen</BackLink> : <BackLink to={personUrl(detail.person.id)} />}
            <div className={s.actions}>
              <Link className="btn" to={`/teczka/${detail.id}/arkusz`}>
                <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
                Podgląd arkusza
              </Link>
              <SheetPdfButton detail={detail} />
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
        </div>
      </header>

      <div className={s.body}>
        <section className={`case-work ${s.work}`} aria-label={`Etap: ${STAGE_SHORT[stage]}`}>
          <div className={`${s.inner} ${s.workInner}`}>
            {readOnly && (
              <InlineAlert tone="info" title="Podgląd tylko do odczytu">
                Teczkę prowadzi oceniający ({detail.evaluator.firstName} {detail.evaluator.lastName}). Jako HR możesz przeglądać etapy i pobrać arkusz, ale nie zmieniasz oceny.
              </InlineAlert>
            )}
            {/* A disabled fieldset turns off every field and button of the stage for HR at once. */}
            <fieldset disabled={readOnly} className={s.workFieldset}>
              {canOpenStage(detail, stage) ? <StageWorkspace {...props} /> : <StageNotOpen detail={detail} stage={stage} />}
            </fieldset>
          </div>
        </section>
      </div>
    </div>
  )
}

const sheetLabelOf = (detail: CaseDetail) =>
  detail.path === 'FIRST' ? 'Arkusz pierwszej oceny' : detail.sheetId ? `Arkusz ${detail.sheetId}` : 'Arkusz nieustalony'

/** What the assistant gets on this screen: the case and the stage; the label is only shown in the popup. */
function assistantContext(detail: CaseDetail | undefined, stage: StageId | null | undefined): AssistantContext {
  if (!detail || !stage || !detail.stages.some((st) => st.id === stage)) return {}
  const name = `${detail.person.firstName} ${detail.person.lastName}`
  return { caseId: detail.id, stageId: stage, label: `${STAGE_SHORT[stage]} · ${name} · ${sheetLabelOf(detail)}` }
}

function StageWorkspace(p: StageProps) {
  switch (p.stage) {
    // Step 1 „Analiza stanowiska”: the proposed sheet is its „Wynik analizy” section (SHEET_PROPOSAL redirects here).
    case 'OSP_ANALYSIS':
    case 'SHEET_PROPOSAL':
      return <OspAnalysisStage {...p} stage="OSP_ANALYSIS" />
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
