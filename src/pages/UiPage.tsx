import { FileText, Inbox, LogOut, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import {
  Accordion,
  BackLink,
  Button,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  ErrorSummary,
  Field,
  FormProgress,
  InfoList,
  InfoRow,
  InlineAlert,
  RadioGroup,
  RadioMatrix,
  SearchBar,
  Select,
  Snackbar,
  Spinner,
  StageStepper,
  StatusBadge,
  Stepper,
  Switch,
  TextArea,
  TextInput,
  UserMenu,
  type ButtonVariant,
  type FormProgressStep,
  type RadioMatrixColumn,
  type RadioMatrixGroup,
  type StageStep,
} from '../components/ui'
import s from './UiPage.module.css'

/* Living catalogue of src/components/ui: every component in every variant and state.
   Hover and focus are forced with data-force so they can be seen without a mouse. */

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'text']

const STEP_LABELS = ['Analiza opisu stanowiska', 'Proponowany formularz', 'Formularz oceny', 'Formularz oceny kompetencji', 'Weryfikacja formularza', 'Ocena końcowa']

const PART_LABELS = ['Ocena okresowa', 'Cele i zadania', 'Podsumowanie i podpisy']
const COMPETENCY_LABELS = [
  'Zorientowanie na klienta',
  'Komunikacja',
  'Współpraca',
  'Zarządzanie informacją',
  'Rozwiązywanie problemów',
  'Kreatywność i innowacyjność',
  'Odporność na stres',
  'Planowanie i organizacja pracy',
]

/** Demo form progress over `labels` with `current` parts done before it; with `links` every part is a link. */
function demoParts(labels: string[], current: number, links = false): FormProgressStep[] {
  return labels.map((label, i) => ({
    key: String(i),
    label,
    state: i < current ? 'done' : i === current ? 'current' : 'todo',
    to: links ? '#postep-formularza' : undefined,
  }))
}

/** Demo stepper with `current` steps done before it (index of the current step; = length means all done). */
function demoSteps(current: number): StageStep[] {
  return STEP_LABELS.map((label, i) => ({
    key: String(i),
    label,
    status: i < current ? 'done' : i === current ? 'current' : 'todo',
    to: '#etapy',
  }))
}
/* Demo scale for RadioMatrix only. The real assessment scale (points and labels) comes from the API. */
const MATRIX_COLUMNS: RadioMatrixColumn[] = [
  { value: '1', label: 'Nigdy', sublabel: '1 z 5' },
  { value: '2', label: 'Rzadko', sublabel: '2 z 5' },
  { value: '3', label: 'Czasem', sublabel: '3 z 5' },
  { value: '4', label: 'Często', sublabel: '4 z 5' },
  { value: '5', label: 'Zawsze', sublabel: '5 z 5' },
]
const MATRIX_GROUPS: RadioMatrixGroup[] = [
  {
    heading: 'Pytania główne',
    rows: [
      { id: 'termin', label: 'Odpowiedź w terminie' },
      { id: 'jezyk', label: 'Prosty język pisma' },
    ],
  },
  { heading: 'Pytania dodatkowe', rows: [{ id: 'kontakt', label: 'Kontakt telefoniczny' }] },
]

const SECTIONS = [
  ['przyciski', 'Przyciski'],
  ['pola', 'Pola formularza'],
  ['wybor', 'Pola wyboru'],
  ['macierz', 'Macierz wyboru'],
  ['komunikaty', 'Komunikaty'],
  ['karty', 'Karty i wiersze'],
  ['nawigacja', 'Wyszukiwarka i postęp'],
  ['etapy', 'Etapy procesu i nagłówek'],
  ['okna', 'Okna i powiadomienia'],
  ['motywy', 'Tryb jasny i ciemny'],
] as const

export function UiPage() {
  const [radio, setRadio] = useState('a')
  const [select, setSelect] = useState('')
  const [checked, setChecked] = useState(true)
  const [sw, setSw] = useState(true)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<'' | 'info' | 'danger'>('')
  const [toast, setToast] = useState(false)
  const closeToast = useCallback(() => setToast(false), [])

  return (
    <div className={s.page}>
      <header className={s.head}>
        <h1 className={s.title}>Komponenty interfejsu</h1>
        <p className={s.lead}>
          Katalog elementów, z których budujemy ekrany. Kolory, odstępy i zaokrąglenia pochodzą z <code>src/styles/tokens.css</code>; tryb
          ciemny włącza się sam według ustawień systemu. Zasady: <code>docs/DESIGN.md</code>.
        </p>
        <nav aria-label="Sekcje katalogu" className={s.toc}>
          <ul>
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <Section id="przyciski" title="Przyciski" note="Główna akcja na ekranie to jeden przycisk primary. Destrukcyjne akcje są czerwone.">
        {[false, true].map((destructive) => (
          <div key={String(destructive)} className={s.block}>
            <h3 className={s.h3}>{destructive ? 'Destrukcyjne' : 'Podstawowe'}</h3>
            <div className={s.matrix}>
              <span className={s.matrixHead} aria-hidden="true" />
              {['Domyślny', 'Hover', 'Focus', 'Wyłączony', 'Ładowanie', 'Mały'].map((h) => (
                <span key={h} className={s.matrixHead} aria-hidden="true">
                  {h}
                </span>
              ))}
              {VARIANTS.map((v) => (
                <div key={v} className={s.matrixRow}>
                  <span className={s.matrixLabel}>{v}</span>
                  <Button variant={v} destructive={destructive}>
                    {destructive ? 'Usuń' : 'Dalej'}
                  </Button>
                  <Button variant={v} destructive={destructive} forceState="hover">
                    {destructive ? 'Usuń' : 'Dalej'}
                  </Button>
                  <Button variant={v} destructive={destructive} forceState="focus">
                    {destructive ? 'Usuń' : 'Dalej'}
                  </Button>
                  <Button variant={v} destructive={destructive} disabled>
                    {destructive ? 'Usuń' : 'Dalej'}
                  </Button>
                  <Button variant={v} destructive={destructive} loading>
                    {destructive ? 'Usuń' : 'Dalej'}
                  </Button>
                  <Button variant={v} destructive={destructive} size="small" icon={destructive ? <Trash2 size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}>
                    {destructive ? 'Usuń' : 'Dodaj'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section id="pola" title="Pola formularza" note="Etykieta nad polem, podpowiedź pod etykietą, błąd nad polem. Placeholder nie zastępuje etykiety.">
        <div className={s.grid2}>
          <Field label="Imię" hint="Tak jak w dowodzie osobistym">
            {(p) => <TextInput {...p} defaultValue="Anna" />}
          </Field>
          <Field label="Imię (focus)">
            {(p) => <TextInput {...p} forceState="focus" defaultValue="Anna" />}
          </Field>
          <Field label="PESEL" error="PESEL musi mieć 11 cyfr">
            {(p) => <TextInput {...p} width={20} inputMode="numeric" defaultValue="4405140" />}
          </Field>
          <Field label="Numer sprawy (wyłączone)">
            {(p) => <TextInput {...p} disabled defaultValue="DEMO-2026-0001" />}
          </Field>
          <Field label="Drugie imię" optional>
            {(p) => <TextInput {...p} />}
          </Field>
          <Field label="Województwo" hint="Lista rozwijana (natywny select)">
            {(p) => (
              <Select
                {...p}
                value={select}
                onChange={(e) => setSelect(e.target.value)}
                placeholder="Wybierz województwo"
                options={[
                  { value: 'maz', label: 'mazowieckie' },
                  { value: 'mal', label: 'małopolskie' },
                  { value: 'pom', label: 'pomorskie' },
                ]}
              />
            )}
          </Field>
          <Field label="Województwo (błąd)" error="Wybierz województwo">
            {(p) => <Select {...p} defaultValue="" placeholder="Wybierz województwo" options={[{ value: 'maz', label: 'mazowieckie' }]} />}
          </Field>
          <Field label="Województwo (wyłączone)">
            {(p) => <Select {...p} disabled defaultValue="maz" options={[{ value: 'maz', label: 'mazowieckie' }]} />}
          </Field>
        </div>
        <div className={s.grid2}>
          <Field label="Uzasadnienie" hint="Napisz kilka zdań">
            {(p) => <TextArea {...p} />}
          </Field>
          <Field label="Uzasadnienie (błąd)" error="Wpisz uzasadnienie">
            {(p) => <TextArea {...p} />}
          </Field>
        </div>
      </Section>

      <Section id="wybor" title="Pola wyboru" note="Radio: jedna odpowiedź. Checkbox: zero lub więcej. Switch: ustawienie działające od razu.">
        <div className={s.grid2}>
          <RadioGroup
            id="ui-radio"
            name="ui-radio"
            legend="Jak chcesz odebrać decyzję?"
            hint="Pole warunkowe pojawia się pod wybraną odpowiedzią"
            value={radio}
            onChange={setRadio}
            forceFocus="b"
            options={[
              {
                value: 'a',
                label: 'E-mailem',
                conditional: <Field label="Adres e-mail">{(p) => <TextInput {...p} type="email" />}</Field>,
              },
              { value: 'b', label: 'Pocztą (focus)', hint: 'List polecony' },
              { value: 'c', label: 'Osobiście (wyłączone)', disabled: true },
            ]}
          />
          <RadioGroup
            id="ui-radio-err"
            name="ui-radio-err"
            legend="Czy masz pełnomocnika?"
            error="Wybierz, czy masz pełnomocnika"
            inline
            value=""
            onChange={() => {}}
            options={[
              { value: 'tak', label: 'Tak' },
              { value: 'nie', label: 'Nie' },
            ]}
          />
          <RadioGroup
            id="ui-radio-locked"
            name="ui-radio-locked"
            legend="Formularz oceny (tylko do odczytu)"
            value="b"
            onChange={() => {}}
            options={[
              { value: 'a', label: 'Arkusz A', hint: 'Wyłączony', disabled: true },
              { value: 'b', label: 'Arkusz B', hint: 'Wyłączony, zaznaczony', disabled: true },
              { value: 'c', label: 'Arkusz C', hint: 'Wyłączony', disabled: true },
            ]}
          />
        </div>
        <div className={s.grid2}>
          <div>
            <Checkbox label="Zgadzam się na kontakt e-mailowy" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <Checkbox label="Niezaznaczony" hint="Z podpowiedzią" />
            <Checkbox label="Focus" forceState="focus" />
            <Checkbox label="Potwierdzam zapoznanie z kryteriami" hint="Bez zaznaczenia nie przejdziesz dalej" required />
            <Checkbox label="Błąd: musisz potwierdzić" invalid />
            <Checkbox label="Wyłączony" disabled />
            <Checkbox label="Wyłączony, zaznaczony" disabled defaultChecked />
          </div>
          <div className={s.stack}>
            <Switch label="Powiadomienia push" checked={sw} onChange={(e) => setSw(e.target.checked)} />
            <Switch label="Wyłączone" />
            <Switch label="Focus" forceState="focus" />
            <Switch label="Niedostępne" disabled />
            <Switch label="Niedostępne, włączone" disabled defaultChecked />
          </div>
        </div>
      </Section>

      <RadioMatrixDemo />

      <Section id="komunikaty" title="Komunikaty" note="Kolor nigdy nie jest jedyną informacją: zawsze ikona i tekst.">
        <ErrorSummaryDemo />
        <div className={s.stack}>
          <InlineAlert tone="info" title="Termin złożenia wniosku">
            Masz czas do 30 listopada.
          </InlineAlert>
          <InlineAlert tone="success" title="Zapisano zmiany" />
          <InlineAlert tone="warning" title="Zostały 3 dni">
            Po terminie wniosek trzeba złożyć ponownie.
          </InlineAlert>
          <InlineAlert tone="error" title="Nie udało się wysłać wniosku">
            Spróbuj ponownie za kilka minut.
          </InlineAlert>
        </div>
        <div className={s.row}>
          <StatusBadge>Szkic</StatusBadge>
          <StatusBadge tone="info">W toku</StatusBadge>
          <StatusBadge tone="success">Zatwierdzony</StatusBadge>
          <StatusBadge tone="warning">Zbliża się termin</StatusBadge>
          <StatusBadge tone="error">Po terminie</StatusBadge>
        </div>
        <div className={s.row}>
          <Spinner label="Ładowanie" />
          <Spinner size="large" label="Ładowanie" />
        </div>
      </Section>

      <Section id="karty" title="Karty i wiersze">
        <div className={s.grid2}>
          <Card title="Karta informacyjna">Treść karty: krótko, prostym językiem.</Card>
          <Card to="/wniosek-demo" title="Wniosek demonstracyjny" icon={<FileText size={24} aria-hidden="true" />}>
            Formularz krok po kroku
          </Card>
          <Card to="/wniosek-demo" title="Karta klikalna (hover)" forceState="hover">
            Cała karta jest linkiem
          </Card>
          <Card to="/wniosek-demo" title="Karta klikalna (focus)" forceState="focus">
            Widoczny pierścień fokusu
          </Card>
          <Card collapsible title="Karta zwijana" subtitle="Podtytuł widoczny także po zwinięciu">
            Treść widoczna po rozwinięciu. Kliknij nagłówek albo naciśnij Enter lub spację.
          </Card>
          <Card collapsible defaultOpen title="Karta zwijana (rozwinięta)">
            Domyślnie rozwinięta (<code>defaultOpen</code>).
          </Card>
          <Card collapsible title="Karta zwijana (hover)" forceState="hover">
            Treść
          </Card>
          <Card collapsible title="Karta zwijana (focus)" forceState="focus">
            Treść
          </Card>
        </div>
        <div className={s.block}>
          <InfoList>
            <InfoRow label="Imię i nazwisko" value="Anna Nowak" />
            <InfoRow label="PESEL" value="44051401359" action={<a href="#karty">Zmień</a>} />
            <InfoRow label="Status" value={<StatusBadge tone="success">Zatwierdzony</StatusBadge>} />
          </InfoList>
        </div>
        <div className={s.block}>
          <Accordion
            items={[
              { title: 'Kto może złożyć wniosek?', content: 'Każda pełnoletnia osoba z numerem PESEL.', open: true },
              { title: 'Ile to kosztuje?', content: 'Usługa jest bezpłatna.' },
            ]}
          />
        </div>
        <Card>
          <EmptyState icon={<Inbox size={28} />} title="Nie masz jeszcze spraw" action={<Button variant="secondary">Złóż wniosek</Button>}>
            Gdy złożysz wniosek, zobaczysz go tutaj.
          </EmptyState>
        </Card>
      </Section>

      <Section id="nawigacja" title="Wyszukiwarka i postęp">
        <SearchBar value={query} onChange={setQuery} label="Szukaj usługi" placeholder="Na przykład: dowód osobisty" />
        <div className={s.block}>
          <Stepper current={1} total={3} />
          <Stepper current={2} total={3} />
          <Stepper current={3} total={3} />
        </div>
      </Section>

      <Section
        id="postep-formularza"
        title="Postęp formularza"
        note="Części formularza zawsze w jednej linii: nazwy, które się nie mieszczą, są ucinane „…” (pełna nazwa w podpowiedzi), a gdy kolumna jest węższa niż ok. 6rem, widać tylko numery i ✓. Zwęź okno albo powiększ tekst w ustawieniach, żeby to zobaczyć."
      >
        <div className={s.block}>
          <h3 className={s.h3}>3 części (Formularz oceny)</h3>
          <FormProgress unit="Część" label="Części arkusza (przykład)" steps={demoParts(PART_LABELS, 1)} />
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>5 kompetencji, kroki są linkami</h3>
          <FormProgress unit="Kompetencja" label="Kompetencje (przykład: 5)" steps={demoParts(COMPETENCY_LABELS.slice(0, 5), 2, true)} />
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>8 kompetencji, kroki są linkami</h3>
          <FormProgress unit="Kompetencja" label="Kompetencje (przykład: 8)" steps={demoParts(COMPETENCY_LABELS, 5, true)} />
        </div>
      </Section>

      <Section
        id="etapy"
        title="Etapy procesu i nagłówek"
        note="Poziomy stepper etapów: ukończone ciemne z ikoną ✓, bieżący podświetlony, przyszłe z obramowaniem; pokazywany krok (w każdym stanie) ma obwódkę w kolorze akcentu, pogrubioną nazwę i aria-current=&quot;step&quot;. Poniżej 768 px zamienia się w numerowane kropki z nazwą kroku."
      >
        <div className={s.block}>
          <h3 className={s.h3}>Początek procesu</h3>
          <StageStepper label="Etapy (przykład: początek)" steps={demoSteps(0)} />
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>W toku (krok 2 z 6)</h3>
          <StageStepper label="Etapy (przykład: w toku)" steps={demoSteps(1)} />
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>Pokazywany krok inny niż bieżący</h3>
          <StageStepper label="Etapy (przykład: podgląd ukończonego)" steps={demoSteps(3)} activeKey="1" />
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>Wszystkie ukończone, bez linków</h3>
          <StageStepper label="Etapy (przykład: zakończone)" steps={demoSteps(6).map(({ to: _to, ...st }) => st)} activeKey="5" />
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>Link „Powrót” i menu użytkownika</h3>
          <div className={s.row}>
            <BackLink to="#etapy" />
            <UserMenu name="Anna Kowalska" role="Starsza księgowa" note="Przełożony · dane demonstracyjne" items={[{ label: 'Wyloguj', icon: <LogOut size={18} aria-hidden="true" />, onSelect: () => {} }]} />
          </div>
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>Menu użytkownika otwarte</h3>
          <div className={s.menuDemo}>
            <UserMenu defaultOpen name="Anna Kowalska" role="Starsza księgowa" note="Przełożony · dane demonstracyjne" items={[{ label: 'Wyloguj', icon: <LogOut size={18} aria-hidden="true" />, onSelect: () => {} }]} />
          </div>
        </div>
      </Section>

      <Section id="okna" title="Okna i powiadomienia" note="Dialog to natywny <dialog> (Esc zamyka, fokus zostaje w oknie); na telefonie wysuwa się od dołu.">
        <div className={s.row}>
          <Button variant="secondary" onClick={() => setDialog('info')}>
            Otwórz okno
          </Button>
          <Button variant="secondary" destructive onClick={() => setDialog('danger')}>
            Usuń szkic
          </Button>
          <Button variant="tertiary" onClick={() => setToast(true)}>
            Pokaż powiadomienie
          </Button>
        </div>
        <div className={s.block}>
          <Snackbar inline open message="Zapisano szkic wniosku" onClose={() => {}} duration={0} action={{ label: 'Cofnij', onClick: () => {} }} />
        </div>
        <Dialog
          open={dialog === 'info'}
          onClose={() => setDialog('')}
          title="Zapisać zmiany?"
          actions={
            <>
              <Button variant="secondary" onClick={() => setDialog('')}>
                Anuluj
              </Button>
              <Button onClick={() => setDialog('')}>Zapisz</Button>
            </>
          }
        >
          Zmiany będą widoczne od razu.
        </Dialog>
        <Dialog
          open={dialog === 'danger'}
          onClose={() => setDialog('')}
          title="Usunąć szkic wniosku?"
          actions={
            <>
              <Button variant="secondary" onClick={() => setDialog('')}>
                Nie usuwaj
              </Button>
              <Button destructive onClick={() => setDialog('')}>
                Usuń
              </Button>
            </>
          }
        >
          Tej operacji nie da się cofnąć.
        </Dialog>
        <Snackbar open={toast} message="Wysłano powiadomienie" onClose={closeToast} />
      </Section>

      <Section id="motywy" title="Tryb jasny i ciemny" note="Podgląd obu motywów obok siebie; aplikacja przełącza się sama według systemu.">
        <div className={s.themes}>
          {(['light', 'dark'] as const).map((t) => (
            <div key={t} className={`theme-${t} ${s.themeBox}`}>
              <p className={s.themeLabel}>{t === 'light' ? 'Jasny' : 'Ciemny'}</p>
              <div className={s.stack}>
                <div className={s.row}>
                  <Button size="small">Dalej</Button>
                  <Button size="small" variant="secondary">
                    Wstecz
                  </Button>
                  <Button size="small" variant="text">
                    Anuluj
                  </Button>
                </div>
                <Field label="Imię" error={t === 'dark' ? 'Wpisz imię' : undefined}>
                  {(p) => <TextInput {...p} />}
                </Field>
                <InlineAlert tone="success" title="Zapisano" />
                <div className={s.row}>
                  <StatusBadge tone="info">W toku</StatusBadge>
                  <StatusBadge tone="warning">Termin</StatusBadge>
                  <StatusBadge tone="error">Błąd</StatusBadge>
                </div>
                <Card title="Karta">Tekst drugorzędny</Card>
                <StageStepper label={`Etapy (${t === 'light' ? 'jasny' : 'ciemny'})`} steps={demoSteps(2)} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className={s.section} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={s.h2}>
        {title}
      </h2>
      {note && <p className={s.note}>{note}</p>}
      <div className={s.sectionBody}>{children}</div>
    </section>
  )
}

function ErrorSummaryDemo() {
  const [shown, setShown] = useState(false)
  return (
    <div className={s.block}>
      {shown ? (
        <ErrorSummary
          errors={[
            { id: 'ui-radio-err', message: 'Wybierz, czy masz pełnomocnika' },
            { id: 'ui-radio', message: 'Wybierz sposób odbioru decyzji' },
          ]}
        />
      ) : (
        <Button variant="secondary" size="small" onClick={() => setShown(true)}>
          Pokaż podsumowanie błędów
        </Button>
      )}
    </div>
  )
}

function RadioMatrixDemo() {
  const [value, setValue] = useState<Record<string, string>>({ termin: '4' })
  const set = (row: string, v: string) => setValue((x) => ({ ...x, [row]: v }))
  return (
    <Section
      id="macierz"
      title="Macierz wyboru"
      note="Kilka pytań z tą samą skalą (np. oceny cząstkowe). Od 768 px tabela: wiersze to pytania, kolumny to wartości, cała komórka jest klikalna. Na telefonie każde pytanie ma wartości w jednej linii, a pod nimi opis wybranej. Strzałki zmieniają wartość w wierszu."
    >
      <div className={s.block}>
        <h3 className={s.h3}>Domyślny (tabela na komputerze, wiersze na telefonie)</h3>
        <RadioMatrix id="ui-matrix" label="Jak często urząd…" rowHeader="Pytanie" columns={MATRIX_COLUMNS} groups={MATRIX_GROUPS} value={value} onChange={set} />
      </div>
      <div className={s.grid2}>
        <div className={s.block}>
          <h3 className={s.h3}>Telefon (wymuszony układ)</h3>
          <RadioMatrix id="ui-matrix-phone" label="Jak często urząd… (telefon)" columns={MATRIX_COLUMNS} groups={MATRIX_GROUPS} value={value} onChange={set} layout="stacked" />
        </div>
        <div className={s.block}>
          <h3 className={s.h3}>Błąd i tylko do odczytu</h3>
          <div className={s.stack}>
            <RadioMatrix
              id="ui-matrix-err"
              label="Jak często urząd… (błąd)"
              rowHeader="Pytanie"
              columns={MATRIX_COLUMNS}
              rows={[{ id: 'termin', label: 'Odpowiedź w terminie', error: 'Wybierz, jak często urząd odpowiada w terminie' }]}
              value={{}}
              onChange={() => {}}
            />
            <RadioMatrix
              id="ui-matrix-locked"
              label="Jak często urząd… (tylko do odczytu)"
              rowHeader="Pytanie"
              columns={MATRIX_COLUMNS}
              rows={[
                { id: 'termin', label: 'Odpowiedź w terminie' },
                { id: 'jezyk', label: 'Prosty język pisma' },
              ]}
              value={{ termin: '4', jezyk: '2' }}
              onChange={() => {}}
              readOnly
            />
          </div>
        </div>
      </div>
    </Section>
  )
}
