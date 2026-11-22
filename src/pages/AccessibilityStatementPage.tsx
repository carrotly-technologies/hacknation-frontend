import type { ReactNode } from 'react'
import { BrandMark } from '../components/BrandMark'
import { BackLink, InfoList, InfoRow, InlineAlert } from '../components/ui'
import { STATEMENT } from '../lib/accessibilityStatement'
import { fmtDate } from '../lib/format'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import s from './AccessibilityStatementPage.module.css'

/**
 * Public accessibility statement (no sign-in, outside the app shell), linked from the footer of every screen and from
 * /logowanie. Sections in the order of the statement template (wzór deklaracji dostępności, art. 10 of the act of
 * 4 April 2019). The data sits in src/lib/accessibilityStatement.ts; the audit behind it in docs/wcag.md.
 */
export function AccessibilityStatementPage() {
  useDocumentTitle('Deklaracja dostępności')
  const { contact } = STATEMENT
  const appUrl = window.location.origin
  const demo = (v: ReactNode) =>
    STATEMENT.demo ? (
      <>
        {v} <span>(przykład)</span>
      </>
    ) : (
      v
    )

  return (
    <main className={s.root} id="main">
      <div className={s.inner}>
        <div className={s.top}>
          <div className={s.brand}>
            <BrandMark />
            <span>{STATEMENT.appName}</span>
          </div>
          <BackLink to="/">Przejdź do aplikacji</BackLink>
        </div>

        <header>
          <h1 className={s.h1}>Deklaracja dostępności</h1>
          <p className={s.lead}>
            {demo(STATEMENT.entity)} zobowiązuje się zapewnić dostępność cyfrową aplikacji {STATEMENT.appName} zgodnie
            z przepisami ustawy z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji
            mobilnych podmiotów publicznych. Deklaracja dostępności dotyczy aplikacji internetowej{' '}
            <a className={s.wrap} href={appUrl}>
              {STATEMENT.appName} ({appUrl})
            </a>
            .
          </p>
        </header>

        {STATEMENT.demo && (
          <InlineAlert tone="warning" title="Dane przykładowe">
            Nazwa podmiotu, dane kontaktowe i daty na tej stronie są przykładowe (wersja demonstracyjna). Urząd, który
            wdraża aplikację, zastępuje je własnymi.
          </InlineAlert>
        )}

        <Section id="daty" title="Daty publikacji i aktualizacji">
          <InfoList>
            <InfoRow label="Data publikacji aplikacji" value={demo(fmtDate(STATEMENT.publishedOn))} />
            <InfoRow label="Data ostatniej istotnej aktualizacji" value={demo(fmtDate(STATEMENT.updatedOn))} />
          </InfoList>
        </Section>

        <Section id="status" title="Status pod względem zgodności z ustawą">
          <p>
            Aplikacja jest <strong>częściowo zgodna</strong> z ustawą o dostępności cyfrowej stron internetowych
            i aplikacji mobilnych podmiotów publicznych z powodu niezgodności wymienionych poniżej. Wymagania
            sprawdzamy według standardu WCAG 2.1 na poziomie AA.
          </p>
        </Section>

        <Section id="tresci-niedostepne" title="Treści niedostępne">
          <ul className={s.list}>
            <li>
              Pliki PDF i DOCX arkusza oceny, pobierane przyciskami „Pobierz PDF” i „Pobierz DOCX”, nie mają pełnej
              struktury dostępności (znaczników nagłówków i tabel). Tę samą treść można przeczytać w aplikacji, na
              stronie „Podgląd arkusza” i na stronie zapoznania z oceną.
            </li>
            <li>
              Odpowiedzi asystenta AI powstają automatycznie. Mogą zawierać długie fragmenty przepisów; każda odpowiedź
              podaje źródło, które można otworzyć jako osobny dokument.
            </li>
            <li>
              Nie przeprowadzono jeszcze testu z czytnikiem ekranu (NVDA, VoiceOver). Do czasu jego wykonania mogą
              występować trudności, których nie wykrywają testy automatyczne.
            </li>
          </ul>
        </Section>

        <Section id="przygotowanie" title="Przygotowanie deklaracji dostępności">
          <InfoList>
            <InfoRow label="Data sporządzenia deklaracji" value={demo(fmtDate(STATEMENT.preparedOn))} />
            <InfoRow label="Data ostatniego przeglądu deklaracji" value={demo(fmtDate(STATEMENT.reviewedOn))} />
          </InfoList>
          <p>
            Deklarację sporządzono na podstawie samooceny przeprowadzonej przez podmiot publiczny: testy automatyczne
            (axe-core, kryteria WCAG 2.1 A i AA) na wszystkich głównych ekranach w motywie jasnym, ciemnym i o wysokim
            kontraście oraz przejście ścieżki oceny wyłącznie z klawiatury.
          </p>
        </Section>

        <Section id="skroty" title="Skróty klawiaturowe">
          <p>Aplikacja nie ma własnych skrótów klawiaturowych. Działają standardowe klawisze przeglądarki:</p>
          <dl className={s.keys}>
            <dt>
              <kbd>Tab</kbd>, <kbd>Shift</kbd> + <kbd>Tab</kbd>
            </dt>
            <dd>przejście do następnego i poprzedniego elementu; pierwszy element każdej strony to link „Przejdź do treści”</dd>
            <dt>
              <kbd>Enter</kbd>, <kbd>Spacja</kbd>
            </dt>
            <dd>otwarcie linku, naciśnięcie przycisku, zaznaczenie pola wyboru</dd>
            <dt>Strzałki</dt>
            <dd>wybór odpowiedzi w grupie opcji i oceny w wierszu formularza oceny kompetencji</dd>
            <dt>
              <kbd>Esc</kbd>
            </dt>
            <dd>zamknięcie okna dialogowego, menu i okna asystenta AI</dd>
          </dl>
          <p>
            W ustawieniach (ikona koła zębatego) można powiększyć tekst do 150%, włączyć motyw ciemny i wysoki kontrast.
          </p>
        </Section>

        <Section id="kontakt" title="Informacje zwrotne i dane kontaktowe">
          <p>
            Jeśli zauważysz problem z dostępnością aplikacji albo potrzebujesz informacji w innej formie, napisz lub
            zadzwoń. Tą samą drogą można złożyć wniosek o udostępnienie informacji niedostępnej oraz żądanie
            zapewnienia dostępności.
          </p>
          <InfoList>
            <InfoRow label="Osoba kontaktowa" value={demo(contact.person)} />
            <InfoRow
              label="E-mail"
              value={demo(
                <a className={s.wrap} href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>,
              )}
            />
            <InfoRow label="Telefon" value={demo(<a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a>)} />
          </InfoList>
        </Section>

        <Section id="procedura" title="Procedura wnioskowo-skargowa">
          <p>
            Każdy ma prawo wystąpić z żądaniem zapewnienia dostępności cyfrowej aplikacji lub jej elementu. Można też
            zażądać udostępnienia informacji w alternatywny sposób, na przykład przez odczytanie niedostępnego cyfrowo
            dokumentu.
          </p>
          <p>
            Żądanie powinno zawierać dane osoby, która je zgłasza, wskazanie, o którą aplikację lub jej element chodzi,
            oraz sposób kontaktu. Jeśli potrzebujesz informacji w alternatywny sposób, napisz też, jaka forma jest dla
            Ciebie dogodna.
          </p>
          <p>
            Podmiot publiczny realizuje żądanie niezwłocznie, nie później niż w ciągu 7 dni od dnia jego złożenia. Jeśli
            dotrzymanie tego terminu nie jest możliwe, niezwłocznie informuje, kiedy realizacja będzie możliwa; ten
            termin nie może być dłuższy niż 2 miesiące od dnia złożenia żądania. Jeśli zapewnienie dostępności cyfrowej
            nie jest możliwe, podmiot może zaproponować alternatywny sposób dostępu do informacji.
          </p>
          <p>
            Jeśli podmiot odmówi realizacji żądania zapewnienia dostępności lub alternatywnego sposobu dostępu do
            informacji, możesz złożyć skargę na brak zapewnienia dostępności cyfrowej (dane kontaktowe powyżej).
          </p>
          <p>
            Po wyczerpaniu tej procedury możesz złożyć wniosek do{' '}
            <a href={STATEMENT.rpoUrl} target="_blank" rel="noreferrer">
              Rzecznika Praw Obywatelskich (otwiera się w nowej karcie)
            </a>
            .
          </p>
          <p>Podstawa prawna: art. 18–20 {STATEMENT.act}.</p>
        </Section>

        <Section id="architektura" title="Dostępność architektoniczna">
          <p>
            Aplikacja działa w przeglądarce i nie wymaga wizyty w urzędzie. Informacje o dostępności architektonicznej
            siedziby, w tym o tłumaczu polskiego języka migowego, publikuje urząd, który wdraża aplikację, w deklaracji
            dostępności swojej strony internetowej.
          </p>
        </Section>
      </div>
    </main>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={s.card} aria-labelledby={id}>
      <h2 className={s.h2} id={id}>
        {title}
      </h2>
      {children}
    </section>
  )
}
