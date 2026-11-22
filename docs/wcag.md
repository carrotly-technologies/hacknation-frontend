# WCAG 2.1 AA: stan zgodności

Samoocena aplikacji **Kompas Kompetencji** (frontend) według WCAG 2.1 na poziomie AA, wymaganego przez ustawę
z 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych.
Wynik tej listy jest podstawą deklaracji dostępności (`/deklaracja-dostepnosci`, dane w
`src/lib/accessibilityStatement.ts`). Stan na 22.11.2026 (hacknation-frontend#162).

## Jak sprawdzamy

| Sposób | Co | Gdzie |
|---|---|---|
| **axe** | `npm run test:a11y`: axe-core z tagami `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, 0 naruszeń na każdym ekranie w motywie jasnym, ciemnym, wysokiego kontrastu (jasnym i ciemnym) | `e2e/a11y.spec.ts` |
| **klawiatura** | test Playwright: logowanie → zespół → profil → teczka → każdy etap i każda część formularza → rozmowa → weryfikacja (IPRZ, okno podpisu: pułapka focusu, Esc, powrót focusu) → podpis → link dla ocenianego → potwierdzenie zapoznania; tylko klawisze; każdy element z focusem ma widoczny wskaźnik | `e2e/keyboard.spec.ts` |
| **ręcznie** | przegląd kodu i ekranów (powiększenie 150% / 375 px, ustawienia, motywy) | ten dokument |
| **czytnik** | test z NVDA / VoiceOver według scenariusza niżej; **jeszcze niewykonany** | ten dokument |

Ekrany w teście axe: `/logowanie`, `/deklaracja-dostepnosci`, `/zapoznanie/:token`, `/zespol`, profil pracownika,
teczka: każdy etap ze `src/case/stages/` (ścieżka okresowa i pierwsza ocena, etap otwarty, zakończony i jeszcze
nieotwarty), „Formularz oceny” części I–III, „Formularz oceny kompetencji”, podgląd arkusza, teczka tylko do odczytu
(HR), `/baza-wiedzy`, `/ustawienia`, `/hr`, `/admin/uzytkownicy`, `/admin/dziennik`; w teście klawiatury także otwarte okno podpisu
i okno asystenta AI.

Statusy: **spełnione**, **n.d.** (nie dotyczy: w aplikacji nie ma takich treści), **wyjątek** (znana niezgodność,
wpisana w deklaracji jako treść niedostępna).

## Kryteria sukcesu (A i AA)

### 1. Postrzegalność

| Kryterium | Poziom | Status | Jak sprawdzone / uwagi |
|---|---|---|---|
| 1.1.1 Treść nietekstowa | A | spełnione | axe (`image-alt`, `svg-img-alt`, `button-name`); ikony `lucide-react` mają `aria-hidden`, przyciski z samą ikoną mają `aria-label` („Ustawienia”, „Zamknij”, „Asystent AI”) |
| 1.2.1–1.2.5 Multimedia | A/AA | n.d. | brak nagrań audio i wideo |
| 1.3.1 Informacje i relacje | A | spełnione | axe (`label`, `list`, `th-has-data-cells`, `aria-*`); pola przez `Field`/`Fieldset` (label, hint, błąd w `aria-describedby`), grupy radio w `fieldset` + `legend`, tabele z nagłówkami |
| 1.3.2 Zrozumiała kolejność | A | spełnione | test klawiatury: kolejność Tab zgodna z kolejnością na ekranie |
| 1.3.3 Właściwości zmysłowe | A | spełnione | ręcznie: instrukcje odwołują się do nazw („Popraw”, „Podpisz ocenę”), nie do kształtu ani położenia |
| 1.3.4 Orientacja | AA | spełnione | ręcznie: brak blokady orientacji; prezentacja ma osobny układ pionowy |
| 1.3.5 Określenie pożądanej wartości | AA | spełnione | axe (`autocomplete-valid`); logowanie `autocomplete="username"` / `current-password` |
| 1.4.1 Użycie koloru | A | spełnione | ręcznie: statusy mają tekst i ikonę (`StatusBadge`, `ResultPanel`, ✓ w stepperze), linki podkreślone w treści |
| 1.4.2 Kontrola odtwarzania dźwięku | A | n.d. | brak dźwięku |
| 1.4.3 Kontrast (minimum) | AA | spełnione | axe `color-contrast` w 4 motywach; tokeny `src/styles/tokens.css` (tekst ≥ 4.5:1, wysoki kontrast ≥ 7:1) |
| 1.4.4 Zmiana rozmiaru tekstu | AA | spełnione | `/ustawienia` 100/125/150%, tekst i wysokości w `rem`; ręcznie przy 150% |
| 1.4.5 Obrazy tekstu | AA | spełnione | ręcznie: tekst jest tekstem; zrzuty ekranu tylko w `/prezentacja` (materiał promocyjny, z opisem) |
| 1.4.10 Dopasowanie do ekranu | AA | spełnione | ręcznie: 375 px przy 150% bez przewijania w poziomie (tabele zamieniają się w listy, stepper w kropki) |
| 1.4.11 Kontrast elementów nietekstowych | AA | spełnione | ręcznie: `--border-input` i pierścień focusu ≥ 3:1 (DESIGN.md), także w wysokim kontraście |
| 1.4.12 Odstępy w tekście | AA | spełnione | ręcznie: brak stałych wysokości kontenerów z tekstem (`min-height` w `rem`) |
| 1.4.13 Treść spod kursora lub fokusu | AA | spełnione | ręcznie: brak własnych dymków; podpowiedzi to atrybut `title` przeglądarki lub stały tekst |

### 2. Funkcjonalność

| Kryterium | Poziom | Status | Jak sprawdzone / uwagi |
|---|---|---|---|
| 2.1.1 Klawiatura | A | spełnione | test klawiatury; axe `scrollable-region-focusable` (przewijane obszary mają `tabIndex=0`: lista źródeł, rozmowa z asystentem, podgląd arkusza) |
| 2.1.2 Brak pułapki klawiaturowej | A | spełnione | test klawiatury: z okien wychodzi się przez Esc / „Zamknij”, focus wraca na przycisk otwierający |
| 2.1.4 Jednoznakowe skróty klawiaturowe | A | spełnione | aplikacja nie ma skrótów jednoznakowych (jedyny, `F` = pełny ekran, jest w pomocniczej `/prezentacja`, poza zakresem) |
| 2.2.1 Dostosowanie czasu | A | spełnione | komunikaty `Snackbar` znikają po 6 s, ale treść jest też na ekranie lub ogłaszana; sesja 8 h (backend) |
| 2.2.2 Pauza, zatrzymanie, ukrycie | A | spełnione | brak ruchomych treści; animacje wyłączone przy `prefers-reduced-motion` |
| 2.3.1 Trzy błyski | A | spełnione | brak migających treści |
| 2.4.1 Możliwość pominięcia bloków | A | spełnione | link „Przejdź do treści” (pierwszy Tab, test klawiatury), landmarki `header`/`nav`/`main` |
| 2.4.2 Tytuł strony | A | spełnione | `useDocumentTitle` (`PageLayout`, teczka: etap i osoba, logowanie, deklaracja, arkusz, zapoznanie) |
| 2.4.3 Kolejność fokusu | A | spełnione | test klawiatury; `Dialog` oddaje focus elementowi, który go otworzył; po zmianie strony focus nie spada na początek dokumentu (`AppShell`) |
| 2.4.4 Cel linku (w kontekście) | A | spełnione | „Otwórz profil: imię nazwisko”, „Popraw: …”, „Zobacz arkusz: …” (`aria-label`) |
| 2.4.5 Wiele sposobów | AA | spełnione | menu główne, lista zespołu i profil, monitoring HR z wyszukiwaniem, stepper teczki |
| 2.4.6 Nagłówki i etykiety | AA | spełnione | axe (`empty-heading`, `label`); jeden h1 na ekran, h2 etapów, h3 sekcji |
| 2.4.7 Widoczny fokus | AA | spełnione | test klawiatury sprawdza pierścień focusu każdego elementu; `--focus-shadow`, w Windows High Contrast `outline` (`base.css`) |
| 2.5.1 Gesty wskaźnika | A | spełnione | przesunięcie w prezentacji ma też strzałki i kropki |
| 2.5.2 Rezygnacja ze wskazania | A | spełnione | akcje na `click` (zwolnienie), natywne przyciski |
| 2.5.3 Etykieta w nazwie | A | spełnione | axe (`label-content-name-mismatch` w trybie AA); nazwy dostępne zaczynają się od widocznego tekstu |
| 2.5.4 Aktywowanie ruchem | A | n.d. | brak funkcji uruchamianych ruchem urządzenia |

### 3. Zrozumiałość

| Kryterium | Poziom | Status | Jak sprawdzone / uwagi |
|---|---|---|---|
| 3.1.1 Język strony | A | spełnione | axe (`html-has-lang`, `html-lang-valid`): `<html lang="pl">` |
| 3.1.2 Język części | AA | spełnione | treści tylko po polsku |
| 3.2.1 Po otrzymaniu fokusu | A | spełnione | test klawiatury: fokus niczego nie uruchamia |
| 3.2.2 Podczas wprowadzania danych | A | spełnione | ręcznie: przełączniki w `/ustawienia` zmieniają tylko wygląd (opisane na ekranie), pola zapisują się bez zmiany kontekstu |
| 3.2.3 Spójna nawigacja | AA | spełnione | ten sam `AppShell` i `PageLayout` na każdym ekranie (DESIGN.md) |
| 3.2.4 Spójna identyfikacja | AA | spełnione | te same komponenty i nazwy akcji (`src/components/ui`) |
| 3.3.1 Identyfikacja błędu | A | spełnione | `ErrorSummary` (focus, linki do pól) + komunikat przy polu, `aria-invalid` |
| 3.3.2 Etykiety lub instrukcje | A | spełnione | axe `label`; etykieta nad polem, podpowiedź pod nią, nigdy placeholder jako etykieta |
| 3.3.3 Sugestie korekty błędów | AA | spełnione | komunikaty mówią, co zrobić („Podaj login”, „Nie może być z przyszłości.”); kontrola formalna z linkami „Popraw” |
| 3.3.4 Zapobieganie błędom (prawne, finansowe) | AA | spełnione | podpis oceny i sprzeciw wymagają potwierdzenia w oknie dialogowym; przed podpisem kontrola formalna |

### 4. Solidność

| Kryterium | Poziom | Status | Jak sprawdzone / uwagi |
|---|---|---|---|
| 4.1.1 Poprawność kodu | A | spełnione | axe (`duplicate-id-aria`), React generuje poprawny DOM |
| 4.1.2 Nazwa, rola, wartość | A | spełnione | axe (`aria-*`, `button-name`, `link-name`); natywne kontrolki, `aria-expanded` w menu, `aria-current="step"` w stepperach, `aria-pressed` w filtrach, natywny `<dialog>` z `aria-labelledby` |
| 4.1.3 Komunikaty o stanie | AA | spełnione | `Snackbar` w regionie `role="status"`, błędy `role="alert"`, odpowiedzi asystenta w `role="log"` |

## Wyjątki (treści niedostępne w deklaracji)

- **Pliki PDF / DOCX arkusza** generowane przez API (`GET /api/cases/:id/sheet.pdf|docx`) nie są oznaczone tagami
  dostępności (pdfmake). Alternatywa: podgląd arkusza w aplikacji (`/teczka/:id/arkusz`) i strona zapoznania.
- **Test z czytnikiem ekranu** nie został jeszcze wykonany (poza zakresem #162). Do czasu wykonania deklaracja podaje
  status „częściowo zgodna”.
- `/prezentacja`, `/ui`, `/wniosek-demo` to strony pomocnicze, niepodlinkowane w aplikacji; nie są objęte testem.

## Ręczny test z czytnikiem ekranu (do wykonania)

Środowisko: Windows + NVDA (aktualna wersja) w Chrome lub Firefox oraz macOS + VoiceOver w Safari. Dane demonstracyjne
(`POST /api/demo/reset`), konto przełożonego `k.wisniewska`. Każdy krok: zapisać, co czytnik odczytał, i czy było
zrozumiałe bez patrzenia na ekran.

1. **Logowanie**: tytuł karty „Logowanie — Kompas Kompetencji”; etykiety „Login”, „Hasło”; wysłanie pustego
   formularza ogłasza podsumowanie błędów, a linki w nim przenoszą do pól.
2. **Nawigacja**: lista landmarków (NVDA `D`, VoiceOver rotor) pokazuje nagłówek, „Nawigacja główna” i treść;
   „Przejdź do treści” przenosi do treści; lista nagłówków ma jeden h1.
3. **Mój zespół**: tabela czytana z nagłówkami kolumn; link „Otwórz profil: …” ma imię i nazwisko.
4. **Teczka**: stepper „Etapy oceny okresowej” czyta numer kroku, stan („zakończono”, „w toku”) i „wyświetlany”;
   po wybraniu etapu czytnik ogłasza nowy tytuł strony.
5. **Formularz oceny kompetencji**: każda ocena w macierzy czyta kryterium i wartość; strzałki zmieniają wybór;
   sugestia systemu jest oznaczona jako sugestia.
6. **Weryfikacja i podpis**: okno „Podpisać ocenę?” jest ogłaszane jako okno dialogowe z tytułem; Tab nie wychodzi
   poza okno; Esc zamyka, a fokus wraca na „Podpisz ocenę”.
7. **Ocena końcowa**: po „Wygeneruj link dla ocenianego” pole „Link dla ocenianego” jest czytane z podpowiedzią
   o ważności; „Skopiowano” jest ogłaszane (region statusu).
8. **Zapoznanie** (`/zapoznanie/:token`, bez logowania): arkusz czytany jako region „Arkusz oceny (tylko do
   odczytu)”; pole potwierdzenia i komunikat po potwierdzeniu.
9. **Asystent AI**: przycisk „Asystent AI”, okno z tytułem, nowe odpowiedzi ogłaszane w dzienniku rozmowy, Esc zamyka.
10. **Ustawienia**: zmiana motywu, rozmiaru tekstu i kontrastu ogłasza nowy stan przełącznika.
11. **Deklaracja dostępności**: dostępna z linku w stopce i na `/logowanie`, nagłówki h2 dla każdej sekcji.

Wynik testu wpisać tutaj (data, czytnik, przeglądarka, znalezione problemy), a w deklaracji zaktualizować status
i „Datę ostatniego przeglądu”.
