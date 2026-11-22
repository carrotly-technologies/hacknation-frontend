// DEV ONLY: in-memory mock of the v2 "teczki ocen" API (notatki/api-kontrakt-v2.md).
// Loaded by dev-mock-api.ts when the dev server runs with MOCK_API=1. Never bundled.
// Demo data is fictional; "today" is DEMO_TODAY (default 2026-11-21).

type StageId =
  | 'OSP_ANALYSIS' | 'OPENING_TALK' | 'OBSERVATION' | 'ASSESSMENT' | 'JUSTIFICATION' | 'DOCUMENT'
  | 'INTRO_TALK' | 'REPORT' | 'FIRST_ASSESSMENT' | 'FIRST_CONDITIONS' | 'FIRST_DOCUMENT'
type SheetId = 'A' | 'B' | 'C' | 'FIRST'
type Json = Record<string, unknown>

export interface MockSheet {
  id: string
  kind: string
  scale: number[]
  mandatoryCriteria: string[]
}

interface Rec {
  id: string
  mine: boolean
  evaluatorName: string
  person: {
    id: string; firstName: string; lastName: string; position: string; unit: string
    employment: 'URZEDNIK' | 'PRACOWNIK'; hiredOn: string
  }
  path: 'PERIODIC' | 'FIRST'
  sheetId: SheetId | null
  cycleLabel: string
  stage: StageId
  done: Partial<Record<StageId, string>>
  cycleStart: string
  afterNegative: boolean
  ospId: string | null
  partI: {
    additionalCriteria: string[]; assessmentDue: string | null
    topics: { duties: string; criteria: string; expectations: string; goals: string }
    expectations: Record<string, string>
    confirmedByEvaluatorOn: string | null; acknowledgedByEmployeeOn: string | null
  }
  observations: Json[]
  ratings: Record<string, Record<string, number | null>>
  decisions: Record<string, number>
  deviationNotes: Record<string, string>
  justification: string
  iprz: string
  firstConditions: { examPassed: string | null; reportSubmittedOn: string | null; reportDue: string | null } | null
  signedOn: string | null
  sentForAckOn: string | null
  acknowledgedOn: string | null
  history: { date: string; text: string }[]
  lastReminderOn: string | null
}

const OFFICE = 'Ministerstwo Cyfryzacji'
const UNIT = 'Departament Cyberbezpieczeństwa, Wydział Zarządzania Kryzysowego, Spraw Obronnych i Cyberbezpieczeństwa'
const R16 = 'rozp. PRM z 4.04.2016'
const R15 = 'rozp. PRM z 23.07.2015'
const USC = 'ustawy o służbie cywilnej'

const PERIODIC_STAGES: [StageId, string, string][] = [
  ['OSP_ANALYSIS', 'Analiza opisu stanowiska', `§2 ust. 2, §3, §5 ust. 2 ${R16}`],
  ['OPENING_TALK', 'Rozmowa rozpoczynająca · cz. I', `§5–§7 ${R16}`],
  ['OBSERVATION', 'Okres oceny · obserwacje', `art. 81 ust. 1 ${USC}`],
  ['ASSESSMENT', 'Rozmowa oceniająca i ocena · cz. II', `§10, §11 ust. 1 ${R16}`],
  ['JUSTIFICATION', 'Uzasadnienie i IPRZ', `§11 ust. 3–4 ${R16}; art. 108 ${USC}`],
  ['DOCUMENT', 'Dokument i zapoznanie', `§12 ${R16}; art. 83 ${USC}`],
]
const FIRST_STAGES: [StageId, string, string][] = [
  ['INTRO_TALK', 'Rozmowa wstępna', `§3 ${R15}`],
  ['REPORT', 'Sprawozdanie pracownika', `§4, §6 ${R15}`],
  ['FIRST_ASSESSMENT', 'Rozmowa oceniająca i ocena', `§7–§9 ${R15}`],
  ['FIRST_CONDITIONS', 'Warunki i wynik', `§10 ${R15}`],
  ['FIRST_DOCUMENT', 'Dokument i zapoznanie', `§11 ${R15}`],
]

const FIRST_ELEMENTS = ['rzetelnosc', 'wykorzystywanie_wiedzy', 'organizacja_pracy', 'komunikacja', 'wspolpraca']

// ---------- dates ----------
const TODAY = process.env.DEMO_TODAY ?? '2026-11-21'
const toD = (s: string) => new Date(`${s}T00:00:00Z`)
const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (s: string, n: number) => {
  const d = toD(s)
  d.setUTCDate(d.getUTCDate() + n)
  return iso(d)
}
const addMonths = (s: string, n: number) => {
  const d = toD(s)
  d.setUTCMonth(d.getUTCMonth() + n)
  return iso(d)
}
const diffDays = (a: string, b: string) => Math.round((toD(a).getTime() - toD(b).getTime()) / 86400000)

function deadline(date: string | null, label: string, legalBasis: string) {
  if (!date) return { date: null, daysLeft: null, state: 'NONE', label, legalBasis }
  const daysLeft = diffDays(date, TODAY)
  const state = daysLeft < 0 ? 'OVERDUE' : daysLeft <= 14 ? 'SOON' : 'OK'
  return { date, daysLeft, state, label, legalBasis }
}

// ---------- OSP ----------
const OSPS = [
  {
    id: 'osp-dc-wzksoic-6',
    title: 'Starszy specjalista — Departament Cyberbezpieczeństwa, Wydział Zarządzania Kryzysowego, Spraw Obronnych i Cyberbezpieczeństwa',
    purpose:
      'Prowadzenie spraw dotyczących zarządzania kryzysowego w cyberprzestrzeni pozostających w zakresie ministra właściwego ds. informatyzacji.',
    subordinates: 'brak podległych pracowników',
    mainTasks: [
      'Bierze udział w opracowaniu i aktualizacji dokumentacji w zakresie zarządzania kryzysowego (np. Krajowego planu reagowania na incydenty i sytuacje kryzysowe w cyberbezpieczeństwie na dużą skalę).',
      'Bierze udział w realizacji zadań z obszaru zarządzania kryzysowego wynikających z członkostwa Polski w NATO, UE i ONZ w celu zapewnienia stałej gotowości do reagowania na zagrożenia płynące z cyberprzestrzeni.',
      'Współpracuje z zespołami CSIRT i organami właściwymi do spraw cyberbezpieczeństwa w celu wzmocnienia krajowego systemu cyberbezpieczeństwa.',
      'Dokonuje oceny obiektów oraz procesów pod kątem infrastruktury krytycznej w celu prowadzenia wykazu obiektów IK będących we właściwości Ministra Cyfryzacji.',
    ],
    softCompetencies: ['organizacja_pracy', 'wspolpraca', 'myslenie_analityczne', 'wykorzystywanie_wiedzy'],
    otherRequirements: ['Znajomość języka angielskiego na poziomie B2', 'Znajomość przepisów o krajowym systemie cyberbezpieczeństwa'],
    source: 'OSP DC WZKSOiC 6 starszy specjalista.docx',
  },
  {
    id: 'osp-dsi-wwi-5',
    title: 'Radca — Departament Rozwoju i Bezpieczeństwa Sztucznej Inteligencji, Wydział Wspierania Innowacyjności',
    purpose:
      'Zapewnienie wsparcia merytorycznego w zakresie rozwoju innowacyjnych rozwiązań opartych na sztucznej inteligencji poprzez rozwijanie mechanizmów wspierających zgodność z przepisami prawa oraz identyfikowanie barier dla rozwoju innowacyjności.',
    subordinates: 'brak podległych pracowników',
    mainTasks: [
      'Analizuje i dokonuje oceny prawa krajowego, prawa UE, orzecznictwa oraz praktyki stosowania prawa w obszarze sztucznej inteligencji i przygotowuje propozycje zmian systemowych.',
      'Prowadzi sprawy dotyczące opinii indywidualnych oraz wyjaśnień dotyczących stosowania przepisów z zakresu sztucznej inteligencji.',
      'Przygotowuje projekty informacji zawierające pogląd Komisji w sprawach sztucznej inteligencji.',
    ],
    softCompetencies: ['organizacja_pracy', 'wykorzystywanie_wiedzy', 'wspolpraca'],
    otherRequirements: ['Wykształcenie wyższe prawnicze'],
    source: 'OSP DSI WWI 5 radca.docx',
  },
  {
    id: 'osp-dwm-wkam-1',
    title: 'Naczelnik wydziału — Departament Współpracy Międzynarodowej, Wydział Koordynacji Aktywności Międzynarodowych',
    purpose:
      'Zapewnienie organizacji aktywności członków kierownictwa MC na arenie międzynarodowej oraz koordynacja obsługi spraw budżetowo-finansowych Departamentu.',
    subordinates: 'bezpośrednio kieruje lub koordynuje pracę od 5 do 9 pracowników',
    mainTasks: [
      'Koordynuje pracę zespołu poprzez planowanie, organizowanie oraz nadzorowanie realizacji zadań zgodnie z wyznaczonymi celami.',
      'Nadzoruje oraz bierze udział w przygotowaniu i organizacji zagranicznych wizyt członków kierownictwa MC.',
      'Koordynuje obsługę spraw finansowo-budżetowych departamentu, w tym udzielanie i rozliczanie dotacji.',
    ],
    softCompetencies: ['zarzadzanie_ludzmi', 'podejmowanie_decyzji', 'wykorzystywanie_wiedzy', 'organizacja_pracy', 'wspolpraca'],
    otherRequirements: ['Doświadczenie w kierowaniu zespołem'],
    source: 'OSP DWM WKAM 1 naczelnik wydziału.docx',
  },
]

// ---------- seed ----------
const emptyPartI = (): Rec['partI'] => ({
  additionalCriteria: [],
  assessmentDue: null,
  topics: { duties: '', criteria: '', expectations: '', goals: '' },
  expectations: {},
  confirmedByEvaluatorOn: null,
  acknowledgedByEmployeeOn: null,
})

let obsSeq = 100
const obs = (date: string, criterionId: string, indicatorId: string | null, kind: string, situation: string, action: string, result: string) => ({
  id: `o${++obsSeq}`, date, criterionId, indicatorId, kind, situation, action, result,
})

function base(p: Partial<Rec> & Pick<Rec, 'id' | 'person' | 'path' | 'stage' | 'cycleStart'>): Rec {
  return {
    mine: true,
    evaluatorName: 'Karolina Wiśniewska',
    sheetId: null,
    cycleLabel: p.path === 'FIRST' ? 'Pierwsza ocena' : 'Ocena okresowa',
    done: {},
    afterNegative: false,
    ospId: null,
    partI: emptyPartI(),
    observations: [],
    ratings: {},
    decisions: {},
    deviationNotes: {},
    justification: '',
    iprz: '',
    firstConditions: null,
    signedOn: null,
    sentForAckOn: null,
    acknowledgedOn: null,
    history: [],
    lastReminderOn: null,
    ...p,
  }
}

const person = (id: string, firstName: string, lastName: string, position: string, employment: 'URZEDNIK' | 'PRACOWNIK', hiredOn: string, unit = UNIT) =>
  ({ id, firstName, lastName, position, unit, employment, hiredOn })

function seed(): Rec[] {
  obsSeq = 100
  return [
    base({
      id: 'anna-nowak',
      person: person('p1', 'Anna', 'Nowak', 'główny specjalista', 'URZEDNIK', '2019-03-01'),
      path: 'PERIODIC', sheetId: 'C', cycleLabel: 'Ocena okresowa 2024–2026', stage: 'ASSESSMENT',
      cycleStart: '2024-11-04', ospId: 'osp-dc-wzksoic-6',
      done: { OSP_ANALYSIS: '2024-11-20', OPENING_TALK: '2024-12-03', OBSERVATION: '2026-11-20' },
      partI: {
        additionalCriteria: ['myslenie_analityczne'],
        assessmentDue: '2026-12-02',
        topics: {
          duties: 'Omówiono zadania 1–3 z OSP, w tym udział w aktualizacji krajowego planu reagowania.',
          criteria: 'Kryteria obowiązkowe arkusza C oraz myślenie analityczne (analizy incydentów).',
          expectations: 'Samodzielne prowadzenie analiz poincydentalnych, terminowe wkłady do dokumentacji NATO/UE.',
          goals: 'Przygotowanie procedury wymiany informacji z zespołami CSIRT do końca 2025 r.',
        },
        expectations: {},
        confirmedByEvaluatorOn: '2024-12-02',
        acknowledgedByEmployeeOn: '2024-12-03',
      },
      observations: [
        obs('2025-02-11', 'rzetelnosc', 'rzetelnosc.1', 'STRENGTH',
          'Aktualizacja załącznika do krajowego planu reagowania na incydenty.',
          'Przed przekazaniem sprawdziła zgodność z nowelizacją ustawy o KSC i poprawiła odwołania w 4 procedurach.',
          'Dokument przyjęty przez dyrektora bez uwag.'),
        obs('2025-04-08', 'komunikacja', 'komunikacja.3', 'STRENGTH',
          'Notatka dla kierownictwa po ćwiczeniu Cyber-EXE.',
          'Przygotowała 2-stronicowe podsumowanie z rekomendacjami w języku zrozumiałym dla osób spoza IT.',
          'Notatka trafiła bez zmian do Ministra; rekomendacje 2 i 3 wdrożono.'),
        obs('2025-05-20', 'wspolpraca', 'wspolpraca.2', 'DEVELOPMENT',
          'Przygotowanie wkładu do ćwiczenia NATO CMX.',
          'Nie przekazała informacji o zmianie scenariusza zespołowi CSIRT GOV.',
          'CSIRT dowiedział się o zmianie dzień przed ćwiczeniem; konieczna była pilna korekta.'),
        obs('2025-07-14', 'organizacja_pracy', 'organizacja_pracy.2', 'STRENGTH',
          'Równoległe zadania: raport do ENISA i kontrola podmiotu krytycznego.',
          'Ustaliła priorytety z naczelnikiem i rozpisała harmonogram z kamieniami pośrednimi.',
          'Oba zadania zakończone w terminie.'),
        obs('2025-09-30', 'myslenie_analityczne', 'myslenie_analityczne.2', 'STRENGTH',
          'Analiza serii incydentów w sektorze energii.',
          'Powiązała trzy pozornie niezależne zgłoszenia z tą samą podatnością dostawcy.',
          'Wydano wspólny komunikat dla operatorów; uniknięto kolejnych incydentów.'),
        obs('2026-01-22', 'wykorzystywanie_wiedzy', 'wykorzystywanie_wiedzy.2', 'STRENGTH',
          'Nowa dyrektywa NIS2.',
          'Z własnej inicjatywy ukończyła szkolenie i przygotowała dla wydziału zestawienie zmian.',
          'Zespół korzysta z zestawienia przy opiniowaniu projektów.'),
        obs('2026-04-15', 'komunikacja', 'komunikacja.1', 'DEVELOPMENT',
          'Spotkanie z przedstawicielami operatorów usług kluczowych.',
          'Przerywała rozmówcom i wracała do własnej tezy, zanim wyjaśniono ich zastrzeżenia.',
          'Spotkanie wymagało drugiej tury; operatorzy zgłosili uwagi pisemnie.'),
        obs('2026-09-03', 'wspolpraca', 'wspolpraca.6', 'STRENGTH',
          'Wdrożenie nowej osoby w wydziale.',
          'Przygotowała krótki przewodnik po procedurach i przez 2 tygodnie odpowiadała na pytania.',
          'Nowy pracownik samodzielnie prowadził sprawy po miesiącu.'),
      ],
      history: [
        { date: '2024-11-20', text: 'Zatwierdzono analizę OSP: arkusz C, kryterium dodatkowe: myślenie analityczne.' },
        { date: '2024-12-02', text: 'Oceniający zatwierdził część I.' },
        { date: '2024-12-03', text: 'Oceniana potwierdziła zapoznanie z kryteriami i terminem oceny.' },
      ],
    }),
    base({
      id: 'piotr-wojcik',
      person: person('p2', 'Piotr', 'Wójcik', 'starszy specjalista', 'PRACOWNIK', '2021-06-01'),
      path: 'PERIODIC', sheetId: null, cycleLabel: 'Ocena okresowa 2026–2028', stage: 'OSP_ANALYSIS',
      cycleStart: '2026-11-12', ospId: 'osp-dc-wzksoic-6',
      history: [{ date: '2026-11-12', text: 'Sporządzono poprzednią ocenę okresową (pozytywna). Rozpoczęto nowy cykl.' }],
    }),
    base({
      id: 'tomasz-kaminski',
      person: person('p3', 'Tomasz', 'Kamiński', 'kierownik zespołu ds. reagowania', 'URZEDNIK', '2016-02-01'),
      path: 'PERIODIC', sheetId: 'B', cycleLabel: 'Ocena okresowa 2025–2027', stage: 'OBSERVATION',
      cycleStart: '2025-09-10', ospId: 'osp-dwm-wkam-1',
      done: { OSP_ANALYSIS: '2025-09-24', OPENING_TALK: '2025-10-02' },
      partI: {
        ...emptyPartI(),
        additionalCriteria: ['wykorzystywanie_wiedzy'],
        assessmentDue: '2027-10-01',
        confirmedByEvaluatorOn: '2025-10-01',
        acknowledgedByEmployeeOn: '2025-10-02',
      },
      observations: [
        obs('2026-03-12', 'zarzadzanie_ludzmi', 'zarzadzanie_ludzmi.4', 'STRENGTH',
          'Kwartalne rozmowy z członkami zespołu.', 'Przeprowadził rozmowy z konkretną informacją zwrotną.', 'Dwie osoby zgłosiły się do szkoleń.'),
      ],
    }),
    base({
      id: 'magdalena-wisniewska',
      person: person('p4', 'Magdalena', 'Wiśniewska', 'referent', 'PRACOWNIK', '2026-03-16'),
      path: 'FIRST', sheetId: 'FIRST', cycleLabel: 'Pierwsza ocena', stage: 'REPORT',
      cycleStart: '2026-03-16', ospId: null,
      done: { INTRO_TALK: '2026-04-02' },
      firstConditions: { examPassed: null, reportSubmittedOn: null, reportDue: '2026-11-30' },
      history: [
        { date: '2026-03-16', text: 'Nawiązanie stosunku pracy (umowa na 12 miesięcy).' },
        { date: '2026-04-02', text: 'Przeprowadzono rozmowę wstępną; wyznaczono termin sprawozdania do 30.11.2026.' },
      ],
    }),
    base({
      id: 'krzysztof-mazur',
      person: person('p5', 'Krzysztof', 'Mazur', 'specjalista', 'PRACOWNIK', '2020-10-01'),
      path: 'PERIODIC', sheetId: 'C', cycleLabel: 'Ponowna ocena po ocenie negatywnej', stage: 'OPENING_TALK',
      cycleStart: '2026-11-18', afterNegative: true, ospId: 'osp-dsi-wwi-5',
      done: { OSP_ANALYSIS: '2026-11-19' },
      partI: emptyPartI(),
      history: [
        { date: '2026-11-18', text: 'Sporządzono ocenę okresową negatywną. Ponowna ocena po 6 miesiącach od zapoznania (art. 81 ust. 9 ustawy).' },
        { date: '2026-11-19', text: 'Oceniany zapoznał się z oceną. Analiza OSP: arkusz C, bez kryteriów dodatkowych.' },
      ],
    }),
    base({
      id: 'ewa-zajac',
      person: person('p6', 'Ewa', 'Zając', 'radca', 'URZEDNIK', '2015-05-04'),
      path: 'PERIODIC', sheetId: 'C', cycleLabel: 'Ocena okresowa 2024–2026', stage: 'DOCUMENT',
      cycleStart: '2024-11-10', ospId: 'osp-dsi-wwi-5',
      done: { OSP_ANALYSIS: '2024-11-25', OPENING_TALK: '2024-12-02', OBSERVATION: '2026-11-10', ASSESSMENT: '2026-11-12', JUSTIFICATION: '2026-11-13' },
      partI: { ...emptyPartI(), additionalCriteria: ['orientacja_na_klienta'], assessmentDue: '2026-11-28', confirmedByEvaluatorOn: '2024-12-01', acknowledgedByEmployeeOn: '2024-12-02' },
      decisions: { wykorzystywanie_wiedzy: 7, rzetelnosc: 7, organizacja_pracy: 5, wspolpraca: 7, komunikacja: 5, orientacja_na_klienta: 7 },
      justification: 'Oceniana wykonuje obowiązki na poziomie powyżej oczekiwań. Opinie prawne dotyczące AI Act przygotowywała terminowo i z pogłębioną analizą orzecznictwa.',
      iprz: 'Szkolenie z wystąpień publicznych (I kw. 2027); udział w grupie roboczej Komisji ds. AI jako ekspert prowadzący.',
      signedOn: '2026-11-13', sentForAckOn: '2026-11-13', acknowledgedOn: '2026-11-19',
      history: [
        { date: '2026-11-12', text: 'Przeprowadzono rozmowę oceniającą.' },
        { date: '2026-11-13', text: 'Oceniający podpisał ocenę i przekazał do zapoznania.' },
        { date: '2026-11-19', text: 'Oceniana zapoznała się z oceną. Biegnie termin na sprzeciw (art. 83 ust. 1 ustawy).' },
      ],
    }),
    // ---- other units (HR view only) ----
    base({
      id: 'jan-krawczyk', mine: false, evaluatorName: 'Marek Zieliński',
      person: person('p7', 'Jan', 'Krawczyk', 'inspektor', 'PRACOWNIK', '2018-01-02', 'Departament Współpracy Międzynarodowej, Wydział Koordynacji Aktywności Międzynarodowych'),
      path: 'PERIODIC', sheetId: 'C', cycleLabel: 'Ocena okresowa 2024–2026', stage: 'ASSESSMENT',
      cycleStart: '2024-11-01', done: { OSP_ANALYSIS: '2024-11-10', OPENING_TALK: '2024-11-18', OBSERVATION: '2026-11-05' },
      partI: { ...emptyPartI(), assessmentDue: '2026-11-17', confirmedByEvaluatorOn: '2024-11-17', acknowledgedByEmployeeOn: '2024-11-18' },
      lastReminderOn: '2026-11-10',
    }),
    base({
      id: 'zofia-pawlak', mine: false, evaluatorName: 'Marek Zieliński',
      person: person('p8', 'Zofia', 'Pawlak', 'główny specjalista', 'URZEDNIK', '2012-09-01', 'Departament Współpracy Międzynarodowej, Wydział Koordynacji Aktywności Międzynarodowych'),
      path: 'PERIODIC', sheetId: 'C', cycleLabel: 'Ocena okresowa 2026–2028', stage: 'OPENING_TALK',
      cycleStart: '2026-10-20', done: { OSP_ANALYSIS: '2026-10-28' }, partI: { ...emptyPartI() },
    }),
    base({
      id: 'adam-michalski', mine: false, evaluatorName: 'Beata Sikora',
      person: person('p9', 'Adam', 'Michalski', 'specjalista', 'PRACOWNIK', '2026-02-02', 'Departament Rozwoju i Bezpieczeństwa Sztucznej Inteligencji, Wydział Wspierania Innowacyjności'),
      path: 'FIRST', sheetId: 'FIRST', stage: 'FIRST_ASSESSMENT', cycleStart: '2026-02-02',
      done: { INTRO_TALK: '2026-02-20', REPORT: '2026-11-03' },
      firstConditions: { examPassed: 'YES', reportSubmittedOn: '2026-11-03', reportDue: '2026-11-06' },
    }),
    base({
      id: 'karolina-dudek', mine: false, evaluatorName: 'Beata Sikora',
      person: person('p10', 'Karolina', 'Dudek', 'radca', 'URZEDNIK', '2014-04-01', 'Departament Rozwoju i Bezpieczeństwa Sztucznej Inteligencji, Wydział Wspierania Innowacyjności'),
      path: 'PERIODIC', sheetId: 'C', cycleLabel: 'Ocena okresowa 2024–2026', stage: 'DOCUMENT',
      cycleStart: '2024-11-15', done: { OSP_ANALYSIS: '2024-11-20', OPENING_TALK: '2024-12-01', OBSERVATION: '2026-11-15', ASSESSMENT: '2026-11-18', JUSTIFICATION: '2026-11-19' },
      partI: { ...emptyPartI(), assessmentDue: '2026-11-30', confirmedByEvaluatorOn: '2024-11-30', acknowledgedByEmployeeOn: '2024-12-01' },
      decisions: { wykorzystywanie_wiedzy: 5, rzetelnosc: 5, organizacja_pracy: 5, wspolpraca: 7, komunikacja: 5 },
      iprz: 'Szkolenie z zarządzania projektami.',
      signedOn: '2026-11-19', sentForAckOn: '2026-11-19',
    }),
  ]
}

// ---------- engine ----------
export function createV2(model: { competencies: { id: string; name: string; indicators: { id: string }[] }[] }, sheets: MockSheet[], scaleLabels: Map<number, string>) {
  let store = seed()
  const ospById = (id: string | null) => OSPS.find((o) => o.id === id) ?? null
  const compName = (id: string) => {
    const n = model.competencies.find((c) => c.id === id)?.name ?? id
    return n.charAt(0) + n.slice(1).toLowerCase()
  }

  const stageDefs = (r: Rec) => (r.path === 'FIRST' ? FIRST_STAGES : PERIODIC_STAGES)
  const criteriaOf = (r: Rec) => {
    if (r.path === 'FIRST') return FIRST_ELEMENTS
    const sheet = sheets.find((s) => s.id === r.sheetId)
    return [...(sheet?.mandatoryCriteria ?? []), ...r.partI.additionalCriteria]
  }
  const openingDue = (r: Rec) => addDays(r.cycleStart, r.afterNegative ? 7 : 30)
  const openingBasis = (r: Rec) => (r.afterNegative ? `§7 pkt 2 ${R16}` : `§7 pkt 1 ${R16}`)
  const objectionDue = (r: Rec) => (r.acknowledgedOn ? addDays(r.acknowledgedOn, 7) : null)

  function stageDeadline(r: Rec, id: StageId) {
    switch (id) {
      case 'OSP_ANALYSIS': return deadline(openingDue(r), 'Przygotuj przed rozmową rozpoczynającą — do', openingBasis(r))
      case 'OPENING_TALK': return deadline(openingDue(r), 'Rozmowa rozpoczynająca do', openingBasis(r))
      case 'OBSERVATION': return deadline(r.partI.assessmentDue, 'Okres oceny do', `art. 81 ust. 1 ${USC}`)
      case 'ASSESSMENT':
      case 'JUSTIFICATION': return deadline(r.partI.assessmentDue, 'Ocena na piśmie do', `§5 ust. 3 ${R16}`)
      case 'DOCUMENT':
        if (r.acknowledgedOn) return deadline(objectionDue(r), 'Termin na sprzeciw do', `art. 83 ust. 1 ${USC}`)
        return deadline(null, 'Zapoznanie z oceną niezwłocznie', `§12 ${R16}`)
      case 'INTRO_TALK': return deadline(addDays(r.person.hiredOn, 21), 'Rozmowa wstępna do', `§3 ${R15}`)
      case 'REPORT': return deadline(r.firstConditions?.reportDue ?? null, 'Sprawozdanie do', `§4 ust. 1 ${R15}`)
      case 'FIRST_ASSESSMENT':
      case 'FIRST_CONDITIONS': return deadline(addMonths(r.person.hiredOn, 11), 'Pierwsza ocena najpóźniej do', `art. 38 ust. 1 ${USC}`)
      case 'FIRST_DOCUMENT': return deadline(null, 'Zapoznanie z oceną niezwłocznie', `§11 ${R15}`)
    }
  }

  function status(r: Rec) {
    if (r.acknowledgedOn) {
      if (r.path === 'FIRST') return 'ZAKONCZONA'
      const od = objectionDue(r)
      return od && od >= TODAY ? 'OKRES_SPRZECIWU' : 'ZAKONCZONA'
    }
    if (r.sentForAckOn) return 'DO_ZAPOZNANIA'
    return 'W_TOKU'
  }

  function summary(r: Rec) {
    const defs = stageDefs(r)
    const cur = defs.findIndex(([id]) => id === r.stage)
    const finished = status(r) === 'ZAKONCZONA'
    const stages = defs.map(([id, name, legalBasis], i) => ({
      id, name, legalBasis,
      status: i < cur || (finished && i === cur) ? 'DONE' : i === cur ? 'CURRENT' : i === cur + 1 ? 'UPCOMING' : 'LOCKED',
      deadline: i >= cur ? stageDeadline(r, id) : null,
      completedOn: r.done[id] ?? (finished && i === cur ? r.acknowledgedOn : null),
    }))
    return {
      id: r.id, person: r.person, path: r.path, sheetId: r.sheetId, cycleLabel: r.cycleLabel,
      currentStage: r.stage, stages, nextDeadline: finished ? null : stageDeadline(r, r.stage), status: status(r),
    }
  }

  function evaluation(r: Rec) {
    const crit = criteriaOf(r)
    if (!crit.length || crit.some((c) => r.decisions[c] == null)) return null
    const pts = crit.map((c) => r.decisions[c])
    const average = pts.reduce((a, b) => a + b, 0) / pts.length
    const fmt = average.toFixed(2).replace('.', ',')
    const reasons: string[] = []
    if (r.path === 'PERIODIC') {
      const bands = [
        { max: 2, label: 'Znacznie poniżej oczekiwań', range: '1–2' },
        { max: 4, label: 'Poniżej oczekiwań', range: '>2–4' },
        { max: 6, label: 'Na poziomie oczekiwań', range: '>4–6' },
        { max: 8, label: 'Powyżej oczekiwań', range: '>6–8' },
        { max: 9, label: 'Znacznie powyżej oczekiwań', range: '>8–9' },
      ]
      const b = bands.find((x) => average <= x.max) ?? bands[4]
      const hasOne = pts.includes(1)
      reasons.push(`Średnia arytmetyczna ${pts.length} ocen cząstkowych wynosi ${fmt} pkt, co odpowiada poziomowi „${b.label}” (przedział ${b.range} pkt; §11 ust. 1 pkt 2 ${R16}).`)
      reasons.push(average > 4 ? `Średnia przekracza 4 pkt (§11 ust. 1 pkt 3 ${R16}).` : `Średnia nie przekracza 4 pkt (§11 ust. 1 pkt 3 ${R16}).`)
      reasons.push(hasOne ? `Co najmniej jedna ocena cząstkowa wynosi 1 pkt — ocena jest negatywna niezależnie od średniej (§11 ust. 1 pkt 4 ${R16}).` : `Żadna ocena cząstkowa nie wynosi 1 pkt (§11 ust. 1 pkt 4 ${R16}).`)
      return { average, averageDisplay: fmt, level: { label: b.label, range: b.range }, result: average > 4 && !hasOne ? 'POSITIVE' : 'NEGATIVE', reasons }
    }
    const fc = r.firstConditions
    if (!fc?.examPassed) return null
    const onTime = !!fc.reportSubmittedOn && (!fc.reportDue || fc.reportSubmittedOn <= fc.reportDue)
    const threes = pts.filter((p) => p === 3).length
    const positive = average >= 5 && threes <= 1 && fc.examPassed !== 'NO' && onTime
    reasons.push(`Ocena łączna (średnia) wynosi ${fmt} pkt — ${average >= 5 ? 'co najmniej' : 'mniej niż'} 5 pkt (§10 ust. 1 pkt 4 ${R15}).`)
    reasons.push(`Liczba ocen 3 pkt: ${threes} (dopuszczalna najwyżej jedna; §10 ust. 1 pkt 3 ${R15}).`)
    reasons.push(fc.examPassed === 'NO' ? `Egzamin kończący służbę przygotowawczą nie został zaliczony (§10 ust. 1 pkt 1 ${R15}).` : `Warunek egzaminu spełniony (${fc.examPassed === 'YES' ? 'zaliczony' : 'nie dotyczy'}).`)
    reasons.push(onTime ? `Sprawozdanie złożone w wyznaczonym terminie (§10 ust. 1 pkt 2 ${R15}).` : `Sprawozdanie nie zostało złożone w wyznaczonym terminie (§10 ust. 1 pkt 2 ${R15}).`)
    return { average, averageDisplay: fmt, level: null, result: positive ? 'POSITIVE' : 'NEGATIVE', reasons }
  }

  function formalCheck(r: Rec) {
    const crit = criteriaOf(r)
    const decided = crit.filter((c) => r.decisions[c] != null).length
    const ev = evaluation(r)
    const neg = ev?.result === 'NEGATIVE'
    const items: { id: string; ok: boolean; message: string; legalBasis: string | null }[] = []
    items.push({ id: 'all_rated', ok: decided === crit.length && crit.length > 0, message: `Wszystkie kryteria mają ocenę cząstkową (${decided} z ${crit.length}).`, legalBasis: r.path === 'FIRST' ? `§9 ${R15}` : `§11 ust. 1 pkt 1 ${R16}` })
    if (r.path === 'FIRST') {
      items.push({ id: 'exam', ok: !!r.firstConditions?.examPassed, message: 'Wskazano wynik egzaminu ze służby przygotowawczej (TAK / NIE / NIE DOTYCZY).', legalBasis: `§10 ust. 1 pkt 1 ${R15}` })
    }
    items.push({
      id: 'justification', ok: !neg || r.justification.trim().length > 0,
      message: neg ? (r.justification.trim() ? 'Uzasadnienie oceny negatywnej jest wpisane.' : 'Brak uzasadnienia — przy ocenie negatywnej jest obowiązkowe.') : 'Uzasadnienie: obowiązkowe tylko przy ocenie negatywnej.',
      legalBasis: r.path === 'FIRST' ? `§10 ust. 4 ${R15}` : `§11 ust. 3 ${R16}`,
    })
    if (r.path === 'PERIODIC') {
      items.push({ id: 'iprz', ok: r.iprz.trim().length > 0, message: r.iprz.trim() ? 'Wnioski dotyczące IPRZ są wpisane.' : 'Brak wniosków dotyczących IPRZ — są wymagane zawsze.', legalBasis: `§11 ust. 1 pkt 5 ${R16}; art. 108 ${USC}` })
      items.push({ id: 'criteria_match', ok: !!r.partI.confirmedByEvaluatorOn, message: 'Kryteria w części II są zgodne z kryteriami ustalonymi w części I.', legalBasis: `§5 ust. 3 ${R16}` })
      items.push({ id: 'catalog', ok: true, message: 'Nazwy kryteriów pochodzą z katalogu (zał. nr 1 do rozporządzenia).', legalBasis: `zał. nr 1 ${R16}` })
      const labels = [...scaleLabels.values()].map((l) => l.toLowerCase())
      const text = r.justification.toLowerCase()
      const mentioned = labels.filter((l) => text.includes(l)).sort((a, b) => b.length - a.length)[0]
      const computed = ev?.level?.label.toLowerCase()
      const ok = !mentioned || !computed || mentioned === computed || computed.includes(mentioned)
      items.push({ id: 'level_text', ok, message: ok ? 'Poziom opisany w uzasadnieniu jest zgodny z wyliczonym.' : `W uzasadnieniu wpisano poziom „${mentioned}”, a wyliczony to „${computed}”.`, legalBasis: `§11 ust. 1 pkt 2 ${R16}` })
    } else {
      items.push({ id: 'dev_only_positive', ok: !neg || r.iprz.trim().length === 0, message: 'Wnioski dotyczące rozwoju zawodowego wpisuje się tylko przy ocenie pozytywnej.', legalBasis: `§10 ust. 6 ${R15}` })
    }
    return items
  }

  function detail(r: Rec) {
    const osp = ospById(r.ospId)
    const candidates = osp
      ? osp.softCompetencies
          .filter((c) => !(sheets.find((s) => s.id === (r.sheetId ?? suggestSheet(osp)))?.mandatoryCriteria ?? []).includes(c))
          .map((c) => ({ criterionId: c, reason: `Kompetencja „${compName(c)}” jest wymieniona w OSP, a nie jest obowiązkowa dla arkusza.`, ospQuote: `Inne kompetencje, wiedza lub umiejętności: ${compName(c).toLowerCase()}` }))
      : []
    const suggested = osp ? suggestSheet(osp) : null
    const od = objectionDue(r)
    return {
      ...summary(r),
      evaluator: { firstName: 'Karolina', lastName: 'Wiśniewska', position: 'naczelnik wydziału', unit: UNIT },
      officeName: OFFICE,
      osp,
      ospAnalysis: r.path === 'PERIODIC' && osp
        ? {
            suggestedSheet: suggested ? {
              sheetId: suggested,
              reason: suggested === 'B'
                ? `Liczba podległych: „${osp.subordinates}” → stanowisko polega na bezpośrednim kierowaniu pracownikami.`
                : `Liczba podległych: „${osp.subordinates}” → stanowisko bez bezpośredniego kierowania pracownikami.`,
              legalBasis: suggested === 'B' ? `§3 ust. 3 ${R16}` : `§3 ust. 4 ${R16}`,
            } : null,
            additionalCandidates: candidates,
          }
        : null,
      partI: r.partI,
      observations: r.observations,
      ratings: r.ratings,
      decisions: r.decisions,
      deviationNotes: r.deviationNotes,
      justification: r.justification,
      iprz: r.iprz,
      firstConditions: r.firstConditions,
      evaluation: evaluation(r),
      formalCheck: formalCheck(r),
      signedByEvaluatorOn: r.signedOn,
      acknowledgedOn: r.acknowledgedOn,
      objectionDeadline: r.path === 'PERIODIC' && od ? deadline(od, 'Termin na sprzeciw do', `art. 83 ust. 1 ${USC}`) : null,
      history: r.history,
      availableActions: availableActions(r),
    }
  }

  function availableActions(r: Rec): string[] {
    const a: string[] = []
    if (r.stage === 'OSP_ANALYSIS') a.push('ACCEPT_OSP_ANALYSIS')
    if (r.stage === 'OPENING_TALK') a.push(r.partI.confirmedByEvaluatorOn ? 'EMPLOYEE_ACK_PART_I' : 'CONFIRM_PART_I')
    if (r.stage === 'OBSERVATION') a.push('START_ASSESSMENT')
    if (r.stage === 'INTRO_TALK') a.push('COMPLETE_INTRO_TALK')
    if (r.stage === 'REPORT') {
      a.push('REPORT_SUBMITTED')
      if (r.firstConditions?.reportDue && r.firstConditions.reportDue < TODAY) a.push('START_ASSESSMENT')
    }
    if (['ASSESSMENT', 'JUSTIFICATION', 'FIRST_ASSESSMENT', 'FIRST_CONDITIONS'].includes(r.stage) && !r.signedOn) a.push('SIGN_ASSESSMENT')
    if (r.signedOn && !r.sentForAckOn) a.push('SEND_FOR_ACK')
    if (r.sentForAckOn && !r.acknowledgedOn) a.push('EMPLOYEE_ACK_ASSESSMENT')
    return a
  }

  function suggestSheet(osp: { subordinates: string }): SheetId {
    return /kieruje|podlegają/.test(osp.subordinates) && !/^brak/.test(osp.subordinates) ? 'B' : 'C'
  }

  function todo(r: Rec) {
    const name = `${r.person.firstName} ${r.person.lastName}`
    const verbs: Partial<Record<StageId, string>> = {
      OSP_ANALYSIS: 'Przeanalizuj opis stanowiska i dobierz kryteria',
      OPENING_TALK: 'Przeprowadź rozmowę rozpoczynającą',
      OBSERVATION: 'Przygotuj rozmowę oceniającą',
      ASSESSMENT: 'Sporządź ocenę na piśmie',
      JUSTIFICATION: 'Uzupełnij uzasadnienie i IPRZ',
      DOCUMENT: r.acknowledgedOn ? 'Biegnie termin na sprzeciw' : 'Przekaż ocenę do zapoznania',
      INTRO_TALK: 'Przeprowadź rozmowę wstępną',
      REPORT: 'Odbierz sprawozdanie pracownika',
      FIRST_ASSESSMENT: 'Sporządź pierwszą ocenę',
      FIRST_CONDITIONS: 'Uzupełnij warunki pierwszej oceny',
      FIRST_DOCUMENT: 'Przekaż pierwszą ocenę do zapoznania',
    }
    const d = stageDeadline(r, r.stage)
    if (!d.date || status(r) === 'ZAKONCZONA') return null
    if (r.stage === 'OBSERVATION' && (d.daysLeft ?? 999) > 30) return null
    return { caseId: r.id, stageId: r.stage, text: `${verbs[r.stage]} — ${name}`, deadline: d }
  }

  const find = (id: string) => store.find((r) => r.id === id)
  const conflict = (message: string) => ({ status: 409, body: { message, error: 'Conflict', statusCode: 409 } })
  const ok = (body: unknown) => ({ status: 200, body })

  function patch(r: Rec, b: Json) {
    const signed = !!r.signedOn
    if (signed && ['ratings', 'decisions', 'justification', 'iprz', 'deviationNotes', 'firstConditions'].some((k) => k in b))
      return conflict('Ocena została już podpisana przez oceniającego. Zmiana jest możliwa tylko w trybie korekty przez administratora.')
    if ('sheetId' in b) {
      if (r.partI.confirmedByEvaluatorOn) return conflict('Arkusz jest ustalony w zatwierdzonej części I.')
      r.sheetId = b.sheetId as SheetId
    }
    if (b.partI) {
      const p = b.partI as Partial<Rec['partI']>
      if (r.partI.confirmedByEvaluatorOn && ('additionalCriteria' in p || 'assessmentDue' in p || 'expectations' in p))
        return conflict('Część I jest zatwierdzona — kryteria i termin są zablokowane (§5 ust. 3 rozp. 2016).')
      if (p.additionalCriteria) {
        const mand = sheets.find((s) => s.id === r.sheetId)?.mandatoryCriteria ?? []
        if (p.additionalCriteria.length > 3) return conflict('Można wybrać najwyżej 3 kryteria dodatkowe (§5 ust. 2 rozp. 2016).')
        if (p.additionalCriteria.some((c) => mand.includes(c))) return conflict('Kryterium obowiązkowe nie może być wybrane jako dodatkowe.')
      }
      r.partI = { ...r.partI, ...p, topics: { ...r.partI.topics, ...(p.topics ?? {}) } }
    }
    if (b.ratings)
      for (const [c, ind] of Object.entries(b.ratings as Rec['ratings'])) r.ratings[c] = { ...r.ratings[c], ...ind }
    if (b.decisions) {
      const scale = r.path === 'FIRST' ? [3, 5, 7] : [1, 3, 5, 7, 9]
      const d = b.decisions as Record<string, number>
      if (Object.values(d).some((v) => v != null && !scale.includes(v))) return conflict('Punkty spoza skali arkusza.')
      r.decisions = { ...r.decisions, ...d }
      for (const [k, v] of Object.entries(r.decisions)) if (v == null) delete r.decisions[k]
    }
    if (b.deviationNotes) {
      r.deviationNotes = { ...r.deviationNotes, ...(b.deviationNotes as Record<string, string>) }
      for (const [k, v] of Object.entries(r.deviationNotes)) if (v == null) delete r.deviationNotes[k]
    }
    if (typeof b.justification === 'string') r.justification = b.justification
    if (typeof b.iprz === 'string') r.iprz = b.iprz
    if (b.firstConditions && r.firstConditions) r.firstConditions = { ...r.firstConditions, ...(b.firstConditions as Json) } as Rec['firstConditions']
    // auto-advance once every criterion has a decision
    const allDecided = criteriaOf(r).every((c) => r.decisions[c] != null)
    if (allDecided && r.stage === 'ASSESSMENT') { r.done.ASSESSMENT = TODAY; r.stage = 'JUSTIFICATION' }
    if (allDecided && r.stage === 'FIRST_ASSESSMENT') { r.done.FIRST_ASSESSMENT = TODAY; r.stage = 'FIRST_CONDITIONS' }
    if (!allDecided && r.stage === 'JUSTIFICATION') { delete r.done.ASSESSMENT; r.stage = 'ASSESSMENT' }
    if (!allDecided && r.stage === 'FIRST_CONDITIONS') { delete r.done.FIRST_ASSESSMENT; r.stage = 'FIRST_ASSESSMENT' }
    return ok(detail(r))
  }

  function action(r: Rec, a: string) {
    const advance = (from: StageId, to: StageId, text: string) => {
      r.done[from] = TODAY
      r.stage = to
      r.history.push({ date: TODAY, text })
    }
    const illegal = () => conflict(`Akcja ${a} nie jest dozwolona na etapie „${stageDefs(r).find(([id]) => id === r.stage)?.[1]}”.`)
    switch (a) {
      case 'ACCEPT_OSP_ANALYSIS': {
        if (r.stage !== 'OSP_ANALYSIS') return illegal()
        const osp = ospById(r.ospId)
        if (!r.sheetId && osp) r.sheetId = suggestSheet(osp)
        advance('OSP_ANALYSIS', 'OPENING_TALK', `Zatwierdzono analizę OSP: arkusz ${r.sheetId}.`)
        return ok(detail(r))
      }
      case 'CONFIRM_PART_I':
        if (r.stage !== 'OPENING_TALK') return illegal()
        r.partI.confirmedByEvaluatorOn = TODAY
        if (!r.partI.assessmentDue) r.partI.assessmentDue = addMonths(TODAY, r.afterNegative ? 6 : 24)
        r.history.push({ date: TODAY, text: 'Oceniający zatwierdził część I.' })
        return ok(detail(r))
      case 'EMPLOYEE_ACK_PART_I':
        if (r.stage !== 'OPENING_TALK' || !r.partI.confirmedByEvaluatorOn) return conflict('Najpierw oceniający musi zatwierdzić część I.')
        r.partI.acknowledgedByEmployeeOn = TODAY
        advance('OPENING_TALK', 'OBSERVATION', 'Oceniany potwierdził zapoznanie z kryteriami i terminem oceny. Rozpoczął się okres oceny.')
        return ok(detail(r))
      case 'START_ASSESSMENT':
        if (r.stage !== 'OBSERVATION') return illegal()
        advance('OBSERVATION', 'ASSESSMENT', 'Rozpoczęto rozmowę oceniającą i sporządzanie oceny.')
        return ok(detail(r))
      case 'SIGN_ASSESSMENT': {
        if (!['ASSESSMENT', 'JUSTIFICATION', 'FIRST_ASSESSMENT', 'FIRST_CONDITIONS'].includes(r.stage)) return illegal()
        const errors = formalCheck(r).filter((i) => !i.ok)
        if (errors.length) return conflict(`Nie można zatwierdzić oceny: ${errors.map((e) => e.message).join(' ')}`)
        r.signedOn = TODAY
        r.done[r.stage] = TODAY
        if (r.path === 'FIRST') advance('FIRST_CONDITIONS', 'FIRST_DOCUMENT', 'Przełożony podpisał pierwszą ocenę.')
        else advance('JUSTIFICATION', 'DOCUMENT', 'Oceniający podpisał ocenę.')
        return ok(detail(r))
      }
      case 'SEND_FOR_ACK':
        if (!r.signedOn) return conflict('Ocena nie jest jeszcze podpisana.')
        r.sentForAckOn = TODAY
        r.history.push({ date: TODAY, text: 'Przekazano ocenę do zapoznania.' })
        return ok(detail(r))
      case 'EMPLOYEE_ACK_ASSESSMENT': {
        if (!r.sentForAckOn) return conflict('Ocena nie została przekazana do zapoznania.')
        r.acknowledgedOn = TODAY
        r.done[r.stage] = TODAY
        if (r.path === 'PERIODIC') {
          const neg = evaluation(r)?.result === 'NEGATIVE'
          r.history.push({ date: TODAY, text: `Oceniany zapoznał się z oceną. Termin na sprzeciw: ${addDays(TODAY, 7)} (art. 83 ust. 1 ustawy).` })
          r.history.push({ date: TODAY, text: `Nowy cykl: rozmowa rozpoczynająca do ${addDays(TODAY, neg ? 7 : 30)} (§7 pkt ${neg ? 2 : 1} rozp. 2016).` })
        } else {
          r.history.push({ date: TODAY, text: 'Oceniany zapoznał się z pierwszą oceną. Oryginał do akt osobowych (§11 rozp. 2015).' })
        }
        return ok(detail(r))
      }
      case 'REPORT_SUBMITTED':
        if (r.stage !== 'REPORT' || !r.firstConditions) return illegal()
        r.firstConditions.reportSubmittedOn = TODAY
        advance('REPORT', 'FIRST_ASSESSMENT', 'Pracownik złożył sprawozdanie.')
        return ok(detail(r))
      case 'COMPLETE_INTRO_TALK':
        if (r.stage !== 'INTRO_TALK') return illegal()
        if (r.firstConditions && !r.firstConditions.reportDue) r.firstConditions.reportDue = addMonths(r.person.hiredOn, 8)
        advance('INTRO_TALK', 'REPORT', 'Przeprowadzono rozmowę wstępną.')
        return ok(detail(r))
      default:
        return { status: 400, body: { message: `Nieznana akcja: ${a}` } }
    }
  }

  type MockUser = { id: string; login: string; name: string; firstName: string; lastName: string; role: 'SUPERVISOR' | 'HR' | 'ADMIN'; position: string; unit: string }
  const MOCK_USERS: MockUser[] = [
    { id: 'u-kowalczyk', login: 'k.wisniewska', name: 'Karolina Wiśniewska', firstName: 'Karolina', lastName: 'Wiśniewska', role: 'SUPERVISOR', position: 'naczelnik wydziału', unit: UNIT },
    { id: 'u-lis', login: 'a.cieslak-dyjecinska', name: 'Agata Cieślak-Dyjecińska', firstName: 'Agata', lastName: 'Cieślak-Dyjecińska', role: 'HR', position: 'Specjalistka ds. kadr', unit: 'Biuro Dyrektora Generalnego' },
    { id: 'u-admin', login: 'admin', name: 'Marek Zając', firstName: 'Marek', lastName: 'Zając', role: 'ADMIN', position: 'Administrator systemu', unit: 'Biuro Informatyki' },
  ]
  let mockUserId = MOCK_USERS[0].id

  /** Returns null when the route is not a v2 route. */
  return function handle(method: string, url: string, body: Json): { status: number; body: unknown } | null {
    const path = url.split('?')[0]
    // Auth is not enforced in the mock: any password works, the login picks the role.
    if (method === 'POST' && path === '/api/auth/login') {
      const login = String((body as { login?: unknown }).login ?? '')
      const user = MOCK_USERS.find((u) => u.login === login) ?? MOCK_USERS[0]
      mockUserId = user.id
      return ok({ accessToken: `mock-${user.id}`, tokenType: 'Bearer', expiresIn: 28800, user })
    }
    if (method === 'POST' && path === '/api/auth/logout') return { status: 204, body: undefined }
    if (method === 'GET' && path === '/api/me') {
      const u = MOCK_USERS.find((x) => x.id === mockUserId) ?? MOCK_USERS[0]
      return ok({ id: u.id, login: u.login, name: u.name, role: u.role, position: u.position, unit: u.unit, officeName: OFFICE })
    }
    if (method === 'GET' && path === '/api/admin/users') return ok(MOCK_USERS)
    if (method === 'PATCH' && path.startsWith('/api/admin/users/')) {
      const u = MOCK_USERS.find((x) => x.id === path.split('/').pop())
      if (!u) return { status: 404, body: { statusCode: 404, message: 'Nie ma użytkownika' } }
      u.role = String((body as { role?: unknown }).role) as MockUser['role']
      return ok(u)
    }
    // Event log (hacknation-backend#70): a fixed sample, no filters; verify always passes.
    if (method === 'GET' && path === '/api/admin/audit/actions') {
      return ok([
        { action: 'LOGIN', label: 'Logowanie' },
        { action: 'LOGIN_FAILED', label: 'Nieudane logowanie' },
        { action: 'CASE_PATCH', label: 'Zmiana danych w ocenie' },
        { action: 'CASE_ACTION:SEND_FOR_ACK', label: 'Akcja w ocenie: Przekaż do zapoznania' },
      ])
    }
    if (method === 'GET' && path === '/api/admin/audit/verify') return ok({ ok: true, count: 3 })
    if (method === 'GET' && path === '/api/admin/audit') {
      const entry = (seq: number, actorId: string | null, action: string, actionLabel: string, resourceType: string, resourceId: string | null, changedFields: string[], result: string) => {
        const u = MOCK_USERS.find((x) => x.id === actorId)
        return {
          id: `mock-audit-${seq}`, seq, at: `2026-11-21T0${seq + 7}:15:00.000Z`, actorId, actorName: u?.name ?? null, actorRole: u?.role ?? null,
          action, actionLabel, resourceType, resourceTypeLabel: resourceType === 'CASE' ? 'Ocena' : 'Konto użytkownika', resourceId,
          changedFields, ip: '127.0.0.1', result, prevHash: '0'.repeat(64), hash: '0'.repeat(64),
        }
      }
      const items = [
        entry(3, MOCK_USERS[0].id, 'CASE_PATCH', 'Zmiana danych w ocenie', 'CASE', 'c-001', ['ratings'], 'OK'),
        entry(2, null, 'LOGIN_FAILED', 'Nieudane logowanie', 'USER', null, [], 'DENIED'),
        entry(1, 'u-admin', 'LOGIN', 'Logowanie', 'USER', 'u-admin', [], 'OK'),
      ]
      return ok({ items, total: items.length, page: 1, pageSize: 50 })
    }
    if (method === 'GET' && path === '/api/team') {
      const mine = store.filter((r) => r.mine)
      const todos = mine.map(todo).filter((t) => t !== null).sort((a, b) => (a.deadline.date ?? '').localeCompare(b.deadline.date ?? ''))
      return ok({ cases: mine.map(summary), todo: todos })
    }
    if (method === 'GET' && path === '/api/osp') return ok(OSPS)
    if (method === 'GET' && path === '/api/hr/overview') {
      const cases = store.map((r) => ({ ...summary(r), evaluatorName: r.evaluatorName, lastReminderOn: r.lastReminderOn }))
      const counters = {
        inProgress: cases.filter((c) => c.status === 'W_TOKU').length,
        dueSoon: cases.filter((c) => c.nextDeadline?.state === 'SOON').length,
        overdue: cases.filter((c) => c.nextDeadline?.state === 'OVERDUE').length,
        awaitingAck: cases.filter((c) => c.status === 'DO_ZAPOZNANIA').length,
        objectionPeriod: cases.filter((c) => c.status === 'OKRES_SPRZECIWU').length,
      }
      return ok({ counters, cases })
    }
    if (method === 'POST' && path === '/api/hr/reminders') {
      const ids = (body.caseIds as string[]) ?? []
      const log = ids.flatMap((id) => {
        const r = find(id)
        if (!r) return []
        r.lastReminderOn = TODAY
        const text = `Wysłano przypomnienie do: ${r.evaluatorName} — ${r.person.firstName} ${r.person.lastName}, ${stageDefs(r).find(([s]) => s === r.stage)?.[1]}.`
        r.history.push({ date: TODAY, text: 'Kadry wysłały przypomnienie o terminie.' })
        return [{ caseId: id, date: TODAY, text }]
      })
      return ok({ sent: log.length, log })
    }
    if (method === 'POST' && path === '/api/demo/reset') {
      store = seed()
      return ok({ ok: true })
    }
    const m = path.match(/^\/api\/cases\/([^/]+)(\/observations|\/actions)?$/)
    if (m) {
      const r = find(decodeURIComponent(m[1]))
      if (!r) return { status: 404, body: { message: 'Nie znaleziono teczki oceny.' } }
      if (method === 'GET' && !m[2]) return ok(detail(r))
      if (method === 'PATCH' && !m[2]) return patch(r, body)
      if (method === 'POST' && m[2] === '/observations') {
        r.observations.push({ id: `o${++obsSeq}`, ...body })
        r.observations.sort((a, b) => String(a.date).localeCompare(String(b.date)))
        return ok(detail(r))
      }
      if (method === 'POST' && m[2] === '/actions') return action(r, String(body.action))
    }
    return null
  }
}
