import { Link } from 'react-router'
import type { CaseDetail, StageId } from '../../api/cases'
import { caseUrl, stageTitle } from '../../lib/stages'
import { StageHeader } from './common'

const WHAT: Partial<Record<StageId, string>> = {
  SHEET_PROPOSAL: 'Przejrzysz formularz zaproponowany na podstawie opisu stanowiska i zaakceptujesz go albo wprowadzisz zmiany (arkusz, kryteria dodatkowe).',
  OPENING_TALK: 'Omówisz z ocenianym obowiązki z opisu stanowiska, kryteria, oczekiwania i ewentualne cele. Zatwierdzenie części I blokuje kryteria i ustala termin oceny.',
  OBSERVATION: 'Przez cały okres oceny zapisujesz obserwacje: sytuacja, działanie, rezultat. Pojawią się one w rubryce przy właściwych wskaźnikach.',
  ASSESSMENT: 'Ocenisz wskaźniki behawioralne każdego kryterium. System zaproponuje poziom, a decyzję o ocenie cząstkowej podejmiesz Ty.',
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
  return (
    <div className="stage">
      <StageHeader title={stageTitle(info)} />
      <div className="stage-pad">
        <div className="notice notice--info" style={{ maxWidth: 640 }}>
          <div>
            <p>
              <strong>Ten etap jeszcze się nie rozpoczął.</strong> Najpierw trzeba zakończyć etap „{stageTitle(current)}”.
            </p>
            {WHAT[stage] && <p style={{ marginTop: 6 }}>{WHAT[stage]}</p>}
          </div>
        </div>
        <Link className="btn btn--primary" style={{ marginTop: 16 }} to={caseUrl(detail.id, detail.currentStage)}>
          Przejdź do bieżącego etapu
        </Link>
      </div>
    </div>
  )
}
