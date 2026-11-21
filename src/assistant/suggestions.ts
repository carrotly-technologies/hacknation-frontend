import type { AssistantMode } from '../api/assistant'
import type { StageId } from '../api/cases'

type Bank = Partial<Record<StageId | 'GENERAL', string[]>>

const FORMAL: Bank = {
  GENERAL: [
    'Kiedy przeprowadza się rozmowę rozpoczynającą?',
    'Czym różni się pierwsza ocena od oceny okresowej?',
    'Ile dni ma oceniany na sprzeciw i do kogo go składa?',
  ],
  OSP_ANALYSIS: [
    'Kiedy stosuje się arkusz B, a kiedy C?',
    'Ile kryteriów dodatkowych mogę wybrać i na jakiej podstawie?',
    'Czy mogę nie wybrać żadnego kryterium dodatkowego?',
  ],
  OPENING_TALK: [
    'Jakie zagadnienia muszę omówić na rozmowie rozpoczynającej?',
    'Jak ustalić termin sporządzenia oceny?',
    'Od kiedy liczy się okres podlegania ocenie?',
  ],
  OBSERVATION: [
    'Co zrobić, gdy pracownik jest długo nieobecny w okresie oceny?',
    'Czy zmiana oceniającego wpływa na termin oceny?',
    'Kiedy powinna odbyć się rozmowa oceniająca?',
  ],
  ASSESSMENT: [
    'Czy jedna ocena 1 pkt oznacza ocenę negatywną?',
    'Co jeśli średnia wynosi dokładnie 4,00?',
    'Jak traktować wskaźnik, którego nie miałem okazji zaobserwować?',
  ],
  ASSESSMENT_TALK: [
    'Co omawia się na rozmowie oceniającej?',
    'Kiedy przeprowadza się rozmowę oceniającą?',
    'Czy po rozmowie oceniającej mogę zmienić oceny cząstkowe?',
  ],
  JUSTIFICATION: [
    'Kiedy uzasadnienie oceny jest obowiązkowe?',
    'Co powinny zawierać wnioski do IPRZ?',
    'Kto zatwierdza indywidualny program rozwoju zawodowego?',
  ],
  DOCUMENT: [
    'Co się dzieje po złożeniu sprzeciwu?',
    'Kiedy zaczyna się kolejny cykl oceny?',
    'Gdzie trafia oryginał arkusza?',
  ],
  INTRO_TALK: [
    'W jakim terminie przeprowadzam rozmowę wstępną?',
    'Jak wyznaczyć termin sprawozdania?',
  ],
  REPORT: [
    'Co, jeśli pracownik nie złoży sprawozdania w terminie?',
    'Czy mogę przedłużyć termin sprawozdania?',
  ],
  FIRST_ASSESSMENT: [
    'Jakie warunki musi spełnić pozytywna pierwsza ocena?',
    'Ile ocen 3 pkt dopuszcza pierwsza ocena?',
  ],
  FIRST_CONDITIONS: [
    'Kiedy egzamin ze służby przygotowawczej „nie dotyczy”?',
    'Czy przy negatywnej pierwszej ocenie wpisuję wnioski rozwojowe?',
  ],
}

const CONVERSATION: Bank = {
  GENERAL: [
    'Jak przygotować się do rozmowy oceniającej?',
    'Jak przekazać trudną informację zwrotną?',
  ],
  OSP_ANALYSIS: ['Jak wyjaśnić pracownikowi wybór kryteriów dodatkowych?'],
  OPENING_TALK: [
    'Zaproponuj pytania otwierające rozmowę rozpoczynającą.',
    'Jak sformułować mierzalne oczekiwania dla kryterium Komunikacja?',
    'Jak ustalić cele na okres oceny?',
  ],
  OBSERVATION: [
    'Jak zapisywać obserwacje, żeby były obiektywne?',
    'Jak udzielać bieżącej informacji zwrotnej?',
  ],
  ASSESSMENT: [
    'Zaproponuj pytania do rozmowy o kryterium Współpraca.',
    'Jak omówić obszar do rozwoju bez demotywowania?',
    'Pomóż uporządkować argumenty do tej oceny.',
  ],
  ASSESSMENT_TALK: [
    'Przygotuj pytania do rozmowy oceniającej.',
    'Jakie kwestie wymagają omówienia na tej rozmowie?',
    'Pomóż uporządkować argumenty uzasadniające ocenę.',
  ],
  JUSTIFICATION: [
    'Pomóż napisać szkic uzasadnienia na podstawie moich decyzji.',
    'Zaproponuj działania rozwojowe dla najsłabszego kryterium.',
  ],
  DOCUMENT: ['Jak rozmawiać z pracownikiem, który nie zgadza się z oceną?'],
  REPORT: ['O co zapytać pracownika na podstawie sprawozdania?'],
  FIRST_ASSESSMENT: ['Jak omówić pierwszą ocenę z nowym pracownikiem?'],
}

export function suggestedQuestions(mode: AssistantMode, stage: StageId | undefined): string[] {
  const bank = mode === 'FORMAL' ? FORMAL : CONVERSATION
  return (stage && bank[stage]) || bank.GENERAL || []
}
