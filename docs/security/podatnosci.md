# Podatności – hacknation-frontend

Rejestr podatności w zależnościach i w obrazie Docker frontendu. Źródło: workflow
[`security`](../../.github/workflows/security.yml) (Trivy `fs` i `image`), uruchamiany przy każdym
pushu na `main`, przy każdym PR i raz w tygodniu. Wyniki są w zakładce
**Security → Code scanning** (kategorie `trivy-fs` i `trivy-image`) oraz jako artefakty
`trivy-fs.sarif` / `trivy-image.sarif` z każdego runu. Mapowanie na wymagania CRA i NIS2 (wspólne
dla obu repo) jest w backendzie:
[`docs/security/cra-nis2.md`](https://github.com/carrotly-technologies/hacknation-backend/blob/main/docs/security/cra-nis2.md).

## Zasada

- Podatność **HIGH/CRITICAL z dostępną poprawką** blokuje merge (krok „Trivy gate”, `--ignore-unfixed --exit-code 1`).
  Naprawiamy ją aktualizacją zależności albo obrazu bazowego, zanim zmiana trafi na `main`.
- Podatność **bez poprawki** albo o niższej wadze nie blokuje builda. Wpisujemy ją do tabeli niżej
  z oceną wpływu i decyzją, a Dependabot i cotygodniowy skan pilnują, kiedy pojawi się poprawka.

## Naprawione przy wdrożeniu skanu (22.11.2026)

| Gdzie | Pakiet / reguła | CVE | Waga | Poprawka |
|---|---|---|---|---|
| obraz (`nginx:1.27-alpine`, Alpine 3.21) | m.in. `libcrypto3`/`libssl3`, `curl`, `brotli-libs`, `c-ares` | 70 podatności, m.in. CVE-2026-111497, CVE-2026-31789, CVE-2025-15467 | 3× CRITICAL, 67× HIGH | obraz bazowy podniesiony do `nginx:1.30-alpine` (gałąź stable, Alpine 3.24) |
| obraz (Alpine 3.24) | `libxml2` 2.13.9-r2 | CVE-2026-86144 | HIGH | `apk upgrade --no-cache` w warstwie runtime (poprawki Alpine wydane po obrazie bazowym) |
| `Dockerfile` | DS-0002 (kontener działa jako root) | – | HIGH (misconfig) | nginx działa jako użytkownik `nginx` (`USER nginx`, pid w `/tmp`). Port 80 zostaje, bo Docker pozwala procesom bez roota otwierać niskie porty w kontenerze |

## Otwarte podatności (bez poprawki)

Stan na 22.11.2026 (Trivy 0.76, wszystkie wagi, także bez poprawki): **brak** w `package-lock.json`
i w obrazie.

| Pakiet | CVE | Waga | Wpływ na aplikację | Decyzja | Data przeglądu |
|---|---|---|---|---|---|
| – | – | – | – | – | – |

Nową pozycję dodajemy, gdy skan pokaże podatność bez poprawki: wpływ ocenia się względem tego,
czy podatny kod jest osiągalny w aplikacji (np. paczka tylko deweloperska, bo do przeglądarki
trafia tylko zbudowany `dist/`), a decyzja to „akceptujemy do czasu poprawki”, „obchodzimy (jak)”
albo „usuwamy zależność”. Wyjątek w skanie (`.trivyignore`) dodajemy tylko razem z wpisem w tej tabeli.
