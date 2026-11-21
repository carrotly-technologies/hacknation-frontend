import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '../../api/client'
import type { CaseDetail, StageId } from '../../api/cases'
import { LoadingState } from '../../components/QueryState'
import { InlineAlert } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { allows, caseUrl, stageTitle, viewStage } from '../../lib/stages'
import { StageHeader } from './common'

const WHAT: Partial<Record<StageId, string>> = {
  SHEET_PROPOSAL: 'Przejrzysz formularz zaproponowany na podstawie opisu stanowiska i zaakceptujesz go albo wprowadzisz zmiany (arkusz, kryteria dodatkowe).',
  OPENING_TALK: 'Omówisz z ocenianym obowiązki z opisu stanowiska, kryteria, oczekiwania i ewentualne cele. Zatwierdzenie części I blokuje kryteria i ustala termin oceny.',
  OBSERVATION: 'Przez cały okres oceny zapisujesz obserwacje: sytuacja, działanie, rezultat. Pojawią się one w rubryce przy właściwych wskaźnikach.',
  ASSESSMENT: 'W formularzu oceny kompetencji ocenisz wskaźniki behawioralne każdego kryterium. System zaproponuje poziom, a decyzję o ocenie cząstkowej podejmiesz Ty.',
  JUSTIFICATION: 'Wpiszesz uzasadnienie (obowiązkowe przy ocenie negatywnej) i wnioski do IPRZ, a system sprawdzi kompletność formalną.',
  DOCUMENT: 'Arkusz wypełni się automatycznie. Przekażesz go do zapoznania; od dnia zapoznania biegnie 7 dni na sprzeciw.',
  REPORT: 'Pracownik składa sprawozdanie z wykonywanych zadań w wyznaczonym terminie.',
  FIRST_ASSESSMENT: 'Ocenisz 5 elementów w skali 3/5/7 pkt na podstawie wskaźników z modelu kompetencji.',
  FIRST_CONDITIONS: 'Uzupełnisz wynik egzaminu ze służby przygotowawczej i informację o sprawozdaniu.',
  FIRST_DOCUMENT: 'Arkusz pierwszej oceny wypełni się automatycznie i przekażesz go do zapoznania.',
}

export function StageNotOpen({ detail, stage }: { detail: CaseDetail; stage: StageId }) {
  const info = detail.stages.find((s) => s.id === stage)!
  const current = detail.stages.find((s) => s.id === detail.currentStage)!
  if (stage === 'ASSESSMENT' && detail.currentStage === 'OBSERVATION' && allows(detail, 'START_ASSESSMENT')) {
    return <OpenAssessmentForm detail={detail} />
  }
  return (
    <div className="stage">
      <StageHeader
        title={stageTitle(info)}
        status={
          <InlineAlert tone="info" title="Ten etap jeszcze się nie rozpoczął">
            <p>Najpierw trzeba zakończyć etap „{stageTitle(current)}”.</p>
            {WHAT[stage] && <p>{WHAT[stage]}</p>}
          </InlineAlert>
        }
      />
      <div className="stage-pad">
        <Link className="btn btn--primary" to={caseUrl(detail.id, detail.currentStage)}>
          Przejdź do bieżącego etapu
        </Link>
      </div>
    </div>
  )
}

/**
 * The assessment period has no screen of its own (step 3 shows only the official sheet). Entering step 4 during it
 * opens "Formularz oceny kompetencji" right away (START_ASSESSMENT); the case view then shows the form itself.
 */
function OpenAssessmentForm({ detail }: { detail: CaseDetail }) {
  const info = detail.stages.find((s) => s.id === 'ASSESSMENT')!
  const { mutate, error } = useCaseAction(detail.id)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    mutate('START_ASSESSMENT')
  }, [mutate])

  if (!error) return <LoadingState label="Otwieranie formularza oceny kompetencji…" />
  return (
    <div className="stage">
      <StageHeader
        title={stageTitle(info)}
        status={
          <InlineAlert tone="error" live title="Nie udało się otworzyć formularza oceny kompetencji">
            {errorMessage(error)}
          </InlineAlert>
        }
      />
      <div className="stage-pad">
        <Link className="btn btn--primary" to={caseUrl(detail.id, viewStage(detail.stages, detail.currentStage))}>
          Wróć do formularza oceny
        </Link>
      </div>
    </div>
  )
}
