import { FileText, MessageSquareText, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import type { CaseDetail, StageId } from '../api/cases'
import type { CompetencyModel } from '../api/kompas'
import { AssistantPanel } from '../assistant/AssistantPanel'
import { ErrorState, LoadingState } from '../components/QueryState'
import { BackLink, StageStepper, StatusBadge } from '../components/ui'
import { useCase } from '../lib/caseQueries'
import { useFeatures } from '../lib/features'
import { caseCriteria, useModel, useSheets, type CaseCriteria } from '../lib/model'
import { canOpenStage, caseSteps, caseUrl, CASE_STATUS_LABEL, stageFromSlug, stepTarget, STAGE_SHORT, type CaseStep } from '../lib/stages'
import { HOME_BY_ROLE, useMe } from '../lib/useAuth'
import s from './CasePage.module.css'
import { CaseSidebar } from './CaseSidebar'
import { AssessmentStage } from './stages/AssessmentStage'
import { DocumentStage } from './stages/DocumentStage'
import { FirstConditionsStage } from './stages/FirstConditionsStage'
import { IntroTalkStage, ReportStage } from './stages/FirstPrepStages'
import { JustificationStage } from './stages/JustificationStage'
import { ObservationStage } from './stages/ObservationStage'
import { OpeningTalkStage } from './stages/OpeningTalkStage'
import { OspAnalysisStage } from './stages/OspAnalysisStage'
import { SheetProposalStage } from './stages/SheetProposalStage'
import { StageNotOpen } from './stages/StageNotOpen'

export interface StageProps {
  detail: CaseDetail
  model: CompetencyModel
  criteria: CaseCriteria
  stage: StageId
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
  if (!stage || !detail.stages.some((st) => st.id === stage)) return <Navigate to={caseUrl(detail.id, detail.currentStage)} replace />

  const criteria = caseCriteria(detail, sheets.data)
  const props: StageProps = { detail, model: model.data, criteria, stage }
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
            <Link className="btn" to={`/teczka/${detail.id}/arkusz?druk=1`}>
              <Printer size={15} strokeWidth={1.75} aria-hidden="true" />
              Pobierz PDF
            </Link>
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
          {activeStep && activeStep.stages.length > 1 && <SubSteps detail={detail} step={activeStep} active={stage} />}
        </div>
      </header>

      <div className={s.body}>
        <CaseSidebar detail={detail} active={stage} model={model.data} criteria={criteria} />
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
          />
        )}
      </div>
    </div>
  )
}

/** The backend stages inside one stepper step ("Formularz oceny" = part I + the assessment period). */
function SubSteps({ detail, step, active }: { detail: CaseDetail; step: CaseStep; active: StageId }) {
  return (
    <nav className={s.sub} aria-label={`Części etapu: ${step.label}`}>
      <ul className={s.subList}>
        {step.stages.map((st) => (
          <li key={st.id}>
            <Link
              to={caseUrl(detail.id, st.id)}
              className={`${s.subLink} ${st.id === active ? s.subActive : ''}`}
              aria-current={st.id === active ? 'page' : undefined}
            >
              {STAGE_SHORT[st.id]}
              <span className={s.subState}>{st.status === 'DONE' ? 'zakończono' : st.status === 'CURRENT' ? 'w toku' : 'nierozpoczęty'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function StageWorkspace(p: StageProps) {
  switch (p.stage) {
    case 'OSP_ANALYSIS':
      return <OspAnalysisStage {...p} />
    case 'SHEET_PROPOSAL':
      return <SheetProposalStage {...p} />
    case 'OPENING_TALK':
      return <OpeningTalkStage {...p} />
    case 'OBSERVATION':
      return <ObservationStage {...p} />
    case 'ASSESSMENT':
    case 'FIRST_ASSESSMENT':
      return <AssessmentStage {...p} />
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
