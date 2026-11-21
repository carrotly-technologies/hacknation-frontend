import { FileText, MessageSquareText, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import type { CaseDetail, StageId } from '../api/cases'
import { AssistantPanel } from '../assistant/AssistantPanel'
import { ErrorState, LoadingState } from '../components/QueryState'
import { useCase } from '../lib/caseQueries'
import { useFeatures } from '../lib/features'
import { caseCriteria, useModel, useSheets, type CaseCriteria } from '../lib/model'
import { canOpenStage, caseUrl, CASE_STATUS_LABEL, stageFromSlug, STAGE_SHORT } from '../lib/stages'
import type { CompetencyModel } from '../api/kompas'
import { StageRail } from './StageRail'
import { AssessmentStage } from './stages/AssessmentStage'
import { DocumentStage } from './stages/DocumentStage'
import { FirstConditionsStage } from './stages/FirstConditionsStage'
import { IntroTalkStage, ReportStage } from './stages/FirstPrepStages'
import { JustificationStage } from './stages/JustificationStage'
import { ObservationStage } from './stages/ObservationStage'
import { OpeningTalkStage } from './stages/OpeningTalkStage'
import { OspAnalysisStage } from './stages/OspAnalysisStage'
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

export function CasePage() {
  const { id = '', stage: slug } = useParams()
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
  if (!stage || !detail.stages.some((s) => s.id === stage)) return <Navigate to={caseUrl(detail.id, detail.currentStage)} replace />

  const criteria = caseCriteria(detail, sheets.data)
  const props: StageProps = { detail, model: model.data, criteria, stage }
  const name = `${detail.person.firstName} ${detail.person.lastName}`
  const sheetLabel = detail.path === 'FIRST' ? 'Arkusz pierwszej oceny' : detail.sheetId ? `Arkusz ${detail.sheetId}` : 'Arkusz nieustalony'
  const metaText = `${detail.person.position} · ${detail.path === 'FIRST' ? 'Pierwsza ocena w służbie cywilnej' : detail.cycleLabel} · ${sheetLabel}`
  const statusTone = detail.status === 'OKRES_SPRZECIWU' || detail.status === 'DO_ZAPOZNANIA' ? 'tag--accent' : detail.status === 'ZAKONCZONA' ? 'tag--ok' : ''

  return (
    <div className={`case ${assistantOpen ? 'case--assistant' : ''}`}>
      <header className="case-head">
        <div className="case-head__id">
          <nav className="crumbs" aria-label="Ścieżka">
            <Link to="/zespol">Mój zespół</Link>
            <span aria-hidden="true">/</span>
            <span>Teczka oceny</span>
          </nav>
          <div className="case-head__title">
            <h1 className="h-page">{name}</h1>
            <span className="case-head__meta" title={metaText}>
              {metaText}
            </span>
            <span className={`tag ${statusTone}`}>{CASE_STATUS_LABEL[detail.status]}</span>
          </div>
        </div>
        <div className="case-head__actions">
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
      </header>

      <div className="case-body">
        <StageRail detail={detail} active={stage} model={model.data} criteria={criteria} />
        <section ref={workRef} className="case-work" aria-label={`Etap: ${STAGE_SHORT[stage]}`}>
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

function StageWorkspace(p: StageProps) {
  switch (p.stage) {
    case 'OSP_ANALYSIS':
      return <OspAnalysisStage {...p} />
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
