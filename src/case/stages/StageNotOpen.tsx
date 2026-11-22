import { Link } from 'react-router'
import type { CaseDetail, StageId } from '../../api/cases'
import { InlineAlert } from '../../components/ui'
import { caseUrl, stageTitle, viewStage } from '../../lib/stages'
import { StageHeader } from './common'

const WHAT: Partial<Record<StageId, string>> = {
  OSP_ANALYSIS: 'Przeprowadzisz analizę opisu stanowiska. System wybierze arkusz B albo C i przygotuje szkic formularza, który zaakceptujesz albo poprawisz (arkusz, kryteria dodatkowe).',
  SHEET_PROPOSAL: 'Przeprowadzisz analizę opisu stanowiska. System wybierze arkusz B albo C i przygotuje szkic formularza, który zaakceptujesz albo poprawisz (arkusz, kryteria dodatkowe).',
  OPENING_TALK: 'Omówisz z ocenianym obowiązki z opisu stanowiska, kryteria, oczekiwania i ewentualne cele. Zatwierdzenie części I blokuje kryteria i ustala termin oceny.',
  OBSERVATION: 'Przez cały okres oceny zapisujesz obserwacje: sytuacja, działanie, rezultat. Pojawią się one w rubryce przy właściwych wskaźnikach.',
  ASSESSMENT: 'W formularzu oceny kompetencji ocenisz wskaźniki behawioralne każdego kryterium. System zaproponuje poziom, a decyzję o ocenie cząstkowej podejmiesz Ty.',
  ASSESSMENT_TALK: 'Przygotujesz się do rozmowy oceniającej na podstawie wypełnionego formularza, omówisz z ocenianym tematy z §10 i odnotujesz datę rozmowy.',
  JUSTIFICATION: 'Po rozmowie oceniającej poprawisz formularze, wpiszesz uzasadnienie (obowiązkowe przy ocenie negatywnej) i wnioski do IPRZ, a po kontroli formalnej podpiszesz ocenę.',
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
        <Link className="btn btn--primary" to={caseUrl(detail.id, viewStage(detail.stages, detail.currentStage))}>
          Przejdź do bieżącego etapu
        </Link>
      </div>
    </div>
  )
}
