# AGENTS.md

React + TypeScript + Vite frontend of **Kompas Kompetencji**; the API lives in [hacknation-backend](https://github.com/carrotly-technologies/hacknation-backend). App structure, routes and env vars: `README.md`. API routes: the table in the backend `README.md`. Design tokens: `src/styles/tokens.css`.

## Wymagania wdrożeniowe (zadanie „Kompas Kompetencji”)

Pełna lista sześciu wymagań z opisu zadania wraz z regułami dla backendu jest w `AGENTS.md` w hacknation-backend (`docs/zadanie/opis-zadania-kompas-kompetencji.pdf`, rozdz. 5). Obowiązują przy każdej zmianie. Zmiana, która łamie którąś z poniższych reguł, wymaga uzasadnienia w opisie PR.

Rozwiązanie powinno być:

1. **Neutralne technologicznie**: możliwe do uruchomienia w różnych środowiskach IT, niezależnie od oprogramowania urzędu, i niewymagające płatnych licencji.
   - Zależności tylko open source na licencjach permisywnych (MIT, Apache-2.0, BSD, ISC); fonty i ikony również (Open Sans przez `@fontsource`, `lucide-react`).
   - Działa w każdej aktualnej przeglądarce (Chrome, Edge, Firefox, Safari), bez wtyczek i bez API dostępnych tylko w jednej przeglądarce.
   - Build to statyczne pliki (`dist/`) serwowane przez dowolny serwer HTTP; obraz Docker z nginx (`Dockerfile`, `nginx.conf`) to tylko jedna z opcji.
2. **Łatwe do wdrożenia w każdym urzędzie**: proste w uruchomieniu, gotowe po krótkiej konfiguracji, niewymagające szkolenia.
   - Jedyna wymagana konfiguracja to adres API (`VITE_API_URL`). Każda nowa zmienna → `.env.example` + tabela w `README.md`.
   - UI po polsku, prostym językiem; każdy ekran da się zrozumieć bez instrukcji. Komunikaty błędów mówią, co zrobić dalej.
   - Dostępność WCAG 2.1 AA (wymóg ustawy o dostępności cyfrowej): obsługa klawiaturą, widoczny focus, kontrast ≥ 4.5:1, etykiety pól.
3. **Przygotowane do pracy w różnych urzędach**: w małych i dużych jednostkach, bardziej i mniej scyfryzowanych.
   - Żadnych nazw ani danych konkretnego urzędu w kodzie. Wszystko, co zależy od jednostki, przychodzi z API.
   - Listy i tabele mają działać zarówno dla 3, jak i dla 300 pracowników (filtrowanie, wyszukiwanie, brak ładowania wszystkiego naraz tam, gdzie API pozwala).
   - Wymagane co najmniej działanie w przeglądarce desktopowej; układ responsywny.
4. **Możliwe do łatwej aktualizacji**: szybkie i bezpieczne wprowadzanie poprawek i nowych funkcji.
   - Kod podzielony według ekranów i etapów (`src/pages`, `src/case/stages`, `src/components`); poprawka jednego etapu nie wymaga zmian w innych.
   - Komunikacja z API tylko przez `src/api/*`; zmiana kontraktu = zmiana w jednym miejscu.
   - `npm run build` i `npm run lint` muszą przechodzić przed merge.
5. **Zgodne z przepisami**: ustawa o służbie cywilnej i ochrona danych osobowych.
   - Minimalizacja danych: w `localStorage` trzymamy tylko preferencje UI (dziś `kompas.assistant`) i id wybranego konta demo (`kompas.userId`), nigdy danych osobowych ani treści ocen. Bez narzędzi analitycznych i trackerów zewnętrznych.
   - Dane pracowników pokazujemy tylko roli, która ma do nich prawo (przełożony: własny zespół, HR: monitoring).
   - AI jest doradcze: sugestia systemu jest wyraźnie oznaczona jako sugestia, a ostateczny poziom zawsze wybiera przełożony. UI nigdy nie zatwierdza oceny automatycznie.
   - Odpowiedzi asystenta pokazują źródło. Brak odpowiedzi w bazie wiedzy jest komunikowany wprost.
6. **Elastyczne na zmiany przepisów**: aktualizacja modułów opartych na regulacjach bez przebudowy systemu.
   - Reguły prawne (terminy, skale, progi, kryteria, warunki oceny) liczy backend (`*.rules.ts`), a frontend je wyświetla. Nie dodawaj nowych stałych prawnych we frontendzie.
   - Istniejące duplikaty do usunięcia przy okazji zmian w tych plikach: `src/lib/scale.ts` (`PERIODIC_SCALE`), fallback skali w `src/lib/model.ts`, `scaleCols` w `src/sheet/SheetDocument.tsx`. Zamiast nich bierz skalę z danych API.
   - Teksty z przepisów (np. odwołania do §) najlepiej z API lub bazy wiedzy; jeśli muszą być w UI, trzymaj je w jednym miejscu, z podanym źródłem.
