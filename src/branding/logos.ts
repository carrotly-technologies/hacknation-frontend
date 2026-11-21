// The 15 logo proposals for /logo. Ids must match LOGO_IDS in the backend (src/branding/logos.ts there).
// SVGs in ./logos: `<id>.svg` (light), `-ciemne` (dark), and for the logos with a name in them the mark alone
// (`-znak`, `-znak-ciemne`). They are inlined into the DOM (Vite `?raw`), never loaded through <img> or CSS,
// so their text is set in the page's own Open Sans (@fontsource) instead of a fallback font.

const files = import.meta.glob<string>('./logos/*.svg', { query: '?raw', import: 'default', eager: true })

export interface LogoProposal {
  id: string
  n: number
  name: string
  /** Proposals outside the gov.pl palette and style of the design system, labelled "(poza stylem)". */
  outOfStyle: boolean
  idea: string
}

export interface Logo extends LogoProposal {
  /** Markup ready to inline: no fixed size (CSS sets the height), hidden from screen readers. */
  light: string
  dark: string
  mark: string
  markDark: string
  /** Original mark file, for the favicon. */
  markFile: string
  /** The SVG has the product name in it (not the mark alone). */
  hasName: boolean
  /** The name is next to the mark (one row, fits the top bar), not under it. */
  wide: boolean
}

// prettier-ignore
const PROPOSALS: LogoProposal[] = [
  { id: '01-igla-w-kole', n: 1, name: 'Igła w kole', outOfStyle: false,
    idea: 'Najprostsze rozwinięcie obecnej favicony: pierścień i dwukolorowa igła wskazująca północny wschód, czyli „do przodu i w górę”. Napis w jednej linii, Open Sans SemiBold w kolorze akcentu, tak jak dziś w górnym pasku.' },
  { id: '02-kafel-z-igla', n: 2, name: 'Kafel z igłą', outOfStyle: false,
    idea: 'Sam znak w formie zaokrąglonego kafla w kolorze #0052A5 z białą igłą. Działa jak ikona aplikacji i favicona, a obok niego zostaje zwykły tekstowy napis z paska.' },
  { id: '03-roza-wiatrow', n: 3, name: 'Róża wiatrów', outOfStyle: false,
    idea: 'Klasyczna czteroramienna róża wiatrów, każde ramię podzielone na ciemną i jasną połowę. Układ pionowy: znak nad wyśrodkowanym napisem, np. na ekran logowania.' },
  { id: '04-k-ze-strzalka', n: 4, name: 'K ze strzałką', outOfStyle: false,
    idea: 'Monogram „K”, którego górne ramię jest strzałką kierunku: litera marki i ruch do przodu w jednym kształcie. Napis w dwóch liniach: „Kompas” pogrubiony, „kompetencji” regularny.' },
  { id: '05-skala-1-9', n: 5, name: 'Skala 1–9', outOfStyle: false,
    idea: 'Tarcza z pięcioma segmentami (oceny 1–3–5–7–9 z aplikacji) i wskazówką ustawioną na „7”. Kompas i ocena kompetencji w jednym znaku.' },
  { id: '06-kroki-rozwoju', n: 6, name: 'Kroki rozwoju', outOfStyle: false,
    idea: 'Dwa jasne kroki i strzałka po przekątnej w górę: ścieżka rozwoju od miejsca, w którym jest pracownik, do kolejnego poziomu. Sam znak, bardzo lekki.' },
  { id: '07-macierz-kompetencji', n: 7, name: 'Macierz kompetencji', outOfStyle: false,
    idea: 'Siatka 3×3 jak macierz kompetencji, w której przekątna jest wyróżniona i kończy się grotem: z mapy umiejętności wyłania się kierunek. W wersji jednokolorowej jasne kropki zamieniają się w obrysy.' },
  { id: '08-otwarty-krag', n: 8, name: 'Otwarty krąg', outOfStyle: false,
    idea: 'Pierścień kompasu z przerwą, przez którą wychodzi strzałka: wyjście poza obecne kompetencje. Znak jednokolorowy, napis w dwóch liniach w kolorze tekstu.' },
  { id: '09-tarcza-z-igla', n: 9, name: 'Tarcza z igłą', outOfStyle: false,
    idea: 'Obrys tarczy (usługa publiczna, zaufanie) z pionową igłą kompasu w środku. Układ pionowy z napisem pod znakiem.' },
  { id: '10-plakietka-z-roza', n: 10, name: 'Plakietka z różą', outOfStyle: false,
    idea: 'Pełne koło w kolorze akcentu z wyciętą smukłą różą wiatrów. Najmocniejsza z propozycji w małych rozmiarach, dobra na faviconę i awatar w powiadomieniach.' },
  { id: '11-pinezka-kierunku', n: 11, name: 'Pinezka kierunku', outOfStyle: false,
    idea: 'Pinezka mapy z igłą kompasu: „tu jesteś na mapie kompetencji, tam możesz dojść”. Sam znak.' },
  { id: '12-gwiazda-polarna', n: 12, name: 'Gwiazda polarna', outOfStyle: true,
    idea: 'Ośmioramienna gwiazda polarna w granacie z bursztynowymi ramionami pośrednimi, napis wersalikami z rozstrzeleniem. Cieplejszy, bardziej „markowy” kierunek niż paleta gov.pl.' },
  { id: '13-heksagon-umiejetnosci', n: 13, name: 'Heksagon umiejętności', outOfStyle: true,
    idea: 'Sześciokąt jak pojedynczy węzeł na mapie umiejętności, z igłą w środku, w odcieniach morskiej zieleni. Odchodzi od niebieskiego, żeby odróżnić produkt od reszty systemu.' },
  { id: '14-czlowiek-kierunek', n: 14, name: 'Człowiek-kierunek', outOfStyle: true,
    idea: 'Głowa i ciało w kształcie grotu wskazującego północ: człowiek jest kompasem. Granat z koralowym akcentem, bardziej ludzki i mniej urzędowy.' },
  { id: '15-kompas-typograficzny', n: 15, name: 'Kompas typograficzny', outOfStyle: true,
    idea: 'Logo oparte na samym napisie: w „kompas” litera „o” jest kompasem, pod spodem „kompetencji” z rozstrzeleniem. Wariant znaku to „ko” z tym samym kompasem.' },
]

function file(name: string): string {
  const svg = files[`./logos/${name}.svg`]
  if (!svg) throw new Error(`Brak pliku logo ${name}.svg`)
  return svg
}

/** Inline use: the CSS box sets the size, the wrapper carries the accessible name. */
function forInline(svg: string): string {
  return svg.replace(/<svg([^>]*)>/, (_, attrs: string) => {
    const kept = attrs.replace(/\s(width|height|role|aria-label)="[^"]*"/g, '')
    return `<svg${kept} aria-hidden="true" focusable="false">`
  })
}

/** Height of the viewBox: 64-70 when the name is next to the mark, over 90 when it is under it (03, 09, 12). */
function boxHeight(svg: string): number {
  return Number(/viewBox="[^"]*?\s([\d.]+)"/.exec(svg)?.[1] ?? 64)
}

export const LOGOS: readonly Logo[] = PROPOSALS.map((p) => {
  const light = file(p.id)
  const hasName = `./logos/${p.id}-znak.svg` in files
  const mark = hasName ? file(`${p.id}-znak`) : light
  return {
    ...p,
    light: forInline(light),
    dark: forInline(file(`${p.id}-ciemne`)),
    mark: forInline(mark),
    markDark: forInline(hasName ? file(`${p.id}-znak-ciemne`) : file(`${p.id}-ciemne`)),
    markFile: mark,
    hasName,
    wide: hasName && boxHeight(light) < 80,
  }
})

export function findLogo(id: string | null | undefined): Logo | null {
  return LOGOS.find((l) => l.id === id) ?? null
}
