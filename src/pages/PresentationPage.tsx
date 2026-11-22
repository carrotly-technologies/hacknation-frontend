import { ChevronLeft, ChevronRight, FileSearch, Gauge, Maximize, Minimize, Sparkles, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { BrandMark } from '../components/BrandMark'
import s from './PresentationPage.module.css'
import { Laptop, Panel, Phone } from './presentation/Devices'
import { ArchitectureIllustration, ChaosIllustration, FoldersIllustration, RoadmapIllustration } from './presentation/Illustrations'

/**
 * Public /prezentacja (no sign-in, outside the app shell): the project deck, at most 10 slides (task description,
 * pt. 4). Slides are drawn on a fixed 1920×1080 canvas scaled to the window (1080×1920 on a phone held upright),
 * so sizes inside are canvas pixels. ←/→, space, PageUp/PageDown and swipe change the slide, the slide number sits in
 * the URL (#3), F toggles full screen. Printing gives one slide per page (`npm run presentation:pdf`).
 * Screenshots are of the demo seed only (fictional people): scripts/capture-presentation-screens.mjs.
 */

/** Address shown on the last slide: the team's public demo (README, "Deploy"). */
const DEMO_URL = 'hacknation.rabbithole.carrotly.tech'

/** Screenshots of the demo seed in public/prezentacja (scripts/capture-presentation-screens.mjs). */
const shot = (name: string) => `${import.meta.env.BASE_URL}prezentacja/${name}.png`

/** Staggered entrance: the n-th element of a slide starts a little later (PresentationPage.module.css). */
const enter = (n: number, className = '') => ({ className: `${s.enter} ${className}`, style: { '--i': n } as CSSProperties })

/** Polish typesetting: a one-letter word (i, w, z, o, a, u) never ends a line. */
const tie = (text: ReactNode) => (typeof text === 'string' ? text.replace(/(^|\s)([aiouwzAIOUWZ])\s/g, '$1$2\u00a0') : text)

function Copy({ eyebrow, title, lede, level = 2 }: { eyebrow: string; title: ReactNode; lede?: ReactNode; level?: 1 | 2 }) {
  const H = level === 1 ? 'h1' : 'h2'
  return (
    <div className={s.copy}>
      <p {...enter(0, s.eyebrow)}>{eyebrow}</p>
      <H {...enter(1, s.headline)}>{tie(title)}</H>
      {lede && <p {...enter(2, s.lede)}>{tie(lede)}</p>}
    </div>
  )
}

type Slide = { title: string; layout?: 'split' | 'center' | 'stack'; body: ReactNode }

const SLIDES: Slide[] = [
  {
    title: 'Siedem ocen, jeden przełożony',
    layout: 'stack',
    body: (
      <>
        <Copy
          level={1}
          eyebrow="Kompas kompetencji"
          title={
            <>
              7 ocen. 14 kompetencji.
              <br />
              Jeden przełożony.
            </>
          }
          lede="Karolina Wiśniewska, naczelniczka wydziału, ocenia cały zespół. Zobacz, jak pomaga jej Kompas."
        />
        <div {...enter(3, s.art)}>
          <FoldersIllustration />
        </div>
        <p className={s.footnote}>Osoby i dane w prezentacji są fikcyjne (dane demonstracyjne).</p>
      </>
    ),
  },
  {
    title: 'Problem',
    body: (
      <>
        <Copy
          eyebrow="Problem"
          title="Arkusze, przepisy, terminy. Każde osobno."
          lede="Który arkusz? Jakie kryteria? Do kiedy rozmowa? Odpowiedzi są rozrzucone po ustawie, rozporządzeniach i poradnikach."
        />
        <div {...enter(3, s.art)}>
          <ChaosIllustration />
        </div>
      </>
    ),
  },
  {
    title: 'Poznaj Kompas kompetencji',
    body: (
      <>
        <Copy
          eyebrow="Poznaj"
          title={
            <>
              <BrandMark className={s.inlineMark} /> Kompas kompetencji.
            </>
          }
          lede="Wszystkie oceny zespołu w jednym miejscu. Widać etap każdej teczki i najbliższy termin z przepisów."
        />
        <div {...enter(3, s.art)}>
          <Laptop src={shot('zespol')} alt="Ekran „Mój zespół”: siedem teczek ocen z etapem i najbliższym terminem" />
        </div>
      </>
    ),
  },
  {
    title: 'Analiza stanowiska',
    body: (
      <>
        <Copy
          eyebrow="Krok 1 z 6 · Analiza stanowiska"
          title="Opis stanowiska podpowiada, co oceniać."
          lede="Kompas pokazuje zadania i kompetencje z opisu stanowiska i proponuje arkusz oceny. Przełożony to zatwierdza."
        />
        <div {...enter(3, s.art)}>
          <Laptop src={shot('analiza-osp')} alt="Etap „Analiza stanowiska” w teczce: opis stanowiska i zadania pracownika" />
        </div>
      </>
    ),
  },
  {
    title: 'Sugestia i decyzja przełożonego',
    body: (
      <>
        <Copy
          eyebrow="Krok 3 z 6 · Formularz oceny kompetencji"
          title="Kompas sugeruje. Decyduje przełożony."
          lede="Z ocen wskaźników zachowań system liczy sugerowany poziom. Ostateczną ocenę zawsze wybiera przełożony."
        />
        <div {...enter(3, s.art)}>
          <Panel
            className={s.panelWide}
            src={shot('sugestia')}
            width={2016}
            height={1308}
            alt="Sugestia systemu: 7 pkt, powyżej oczekiwań, ze średniej wskaźników. Pod nią „Twoja decyzja”: wybór poziomu należy do przełożonego"
          >
            <span className={`${s.callout} ${s.calloutSuggest}`}>
              <Gauge size={30} aria-hidden="true" /> Sugestia systemu
            </span>
            <span className={`${s.callout} ${s.calloutDecide}`}>
              <UserCheck size={30} aria-hidden="true" /> Decyzja przełożonego
            </span>
          </Panel>
        </div>
      </>
    ),
  },
  {
    title: 'Asystent AI ze źródłami',
    body: (
      <>
        <Copy
          eyebrow="Asystent AI"
          title="Pytasz o przepis. Dostajesz źródło."
          lede="Odpowiedzi z ustawy, rozporządzeń i poradników, z linkiem do strony. Gdy czegoś tam nie ma, asystent mówi to wprost."
        />
        <div {...enter(3, s.art)}>
          <Panel
            className={s.panelTall}
            src={shot('asystent')}
            width={800}
            height={1120}
            alt="Okno „Asystent AI”: pytanie o termin sprzeciwu i odpowiedź z cytatami i numerami źródeł"
          />
        </div>
      </>
    ),
  },
  {
    title: 'Podpis, link dla ocenianego, PDF i DOCX',
    body: (
      <>
        <Copy
          eyebrow="Krok 6 z 6 · Ocena końcowa"
          title="Podpis, link, gotowe."
          lede="Oceniany czyta arkusz na telefonie i potwierdza zapoznanie, bez zakładania konta. Arkusz pobierzesz jako PDF lub DOCX."
        />
        <div {...enter(3, `${s.art} ${s.duo}`)}>
          <Laptop src={shot('dokument')} alt="Etap „Ocena końcowa”: przyciski Pobierz PDF, Pobierz DOCX i Drukuj" />
          <Phone className={s.duoPhone} src={shot('zapoznanie')} alt="Strona dla ocenianego na telefonie: arkusz tylko do odczytu i pouczenie o sprzeciwie" />
        </div>
      </>
    ),
  },
  {
    title: 'Gdzie jest AI',
    body: (
      <>
        <Copy eyebrow="Gdzie jest AI" title="Podpowiada. Nie decyduje." lede="Nic nie zatwierdza się samo." />
        <div {...enter(3, `${s.art} ${s.aiMap}`)}>
          <ul className={s.aiList}>
            <li>
              <FileSearch size={44} aria-hidden="true" />
              <span>Opis stanowiska → propozycja arkusza</span>
              <em>reguły</em>
            </li>
            <li>
              <Gauge size={44} aria-hidden="true" />
              <span>Wskaźniki → sugerowany poziom</span>
              <em>reguły</em>
            </li>
            <li>
              <Sparkles size={44} aria-hidden="true" />
              <span>Przepisy → odpowiedź ze źródłem</span>
              <em>AI</em>
            </li>
          </ul>
          <div className={s.aiArrow} aria-hidden="true" />
          <div className={s.aiHuman}>
            <UserCheck size={72} aria-hidden="true" />
            <strong>Przełożony decyduje</strong>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Architektura',
    body: (
      <>
        <Copy
          eyebrow="Architektura"
          title="Wdrożysz w każdym urzędzie."
          lede="Otwarte licencje, obrazy Docker, żadnych płatnych usług. Działa też bez bazy danych i bez internetu."
        />
        <div {...enter(3, s.art)}>
          <ArchitectureIllustration />
        </div>
      </>
    ),
  },
  {
    title: 'Co dalej',
    layout: 'stack',
    body: (
      <>
        <Copy eyebrow="Co dalej" title="Prototyp gotowy do rozwoju." />
        <div {...enter(3, s.art)}>
          <RoadmapIllustration />
        </div>
        <p {...enter(4, s.end)}>
          <BrandMark className={s.endMark} />
          <span>{DEMO_URL}</span>
        </p>
      </>
    ),
  },
]

const W = 1920
const H = 1080

/** Slide index from `#N` (1-based); anything else is the first slide. */
function readHash(): number {
  const n = Number.parseInt(window.location.hash.slice(1), 10)
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), SLIDES.length) - 1 : 0
}

export function PresentationPage() {
  const [index, setIndex] = useState(readHash)
  const [box, setBox] = useState({ w: W, h: H })
  const [fullscreen, setFullscreen] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const last = SLIDES.length - 1

  const go = useCallback((i: number) => setIndex(Math.min(Math.max(i, 0), last)), [last])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  // Title, and one slide per landscape page when printing (only while the deck is open: the sheet prints on A4).
  useEffect(() => {
    const prev = document.title
    document.title = 'Prezentacja — Kompas Kompetencji'
    // A constructed stylesheet, not a <style> element: the Content-Security-Policy (nginx.conf) blocks inline styles.
    const page = new CSSStyleSheet()
    page.replaceSync(`@page { size: ${W}px ${H}px; margin: 0; }`)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, page]
    return () => {
      document.title = prev
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== page)
    }
  }, [])

  // The URL keeps the slide number, so a refresh stays on the same slide.
  useEffect(() => {
    const hash = `#${index + 1}`
    if (window.location.hash !== hash) window.history.replaceState(window.history.state, '', hash)
  }, [index])

  useEffect(() => {
    const onHash = () => setIndex(readHash())
    const onFullscreen = () => setFullscreen(document.fullscreenElement != null)
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const t = e.target as HTMLElement | null
      // Space and Enter on a focused control press that control.
      if ((e.key === ' ' || e.key === 'Enter') && t?.closest('button, a')) return
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          setIndex((i) => Math.min(i + 1, last))
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          setIndex((i) => Math.max(i - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          setIndex(0)
          break
        case 'End':
          e.preventDefault()
          setIndex(last)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [last, toggleFullscreen])

  // The canvas is scaled to the room left by the controls.
  useLayoutEffect(() => {
    const el = viewport.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const portrait = box.h > box.w && box.w < 1000
  const cw = portrait ? H : W
  const ch = portrait ? W : H
  const scale = Math.max(0.1, Math.min(box.w / cw, box.h / ch))

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1))
  }

  return (
    <main className={`${s.root} ${fullscreen ? s.isFullscreen : ''}`} aria-roledescription="prezentacja" aria-label="Kompas kompetencji: prezentacja projektu">
      <div
        ref={viewport}
        className={s.viewport}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <div className={s.fit} style={{ width: cw * scale, height: ch * scale }}>
          <div className={`${s.stage} ${portrait ? s.portrait : ''}`} style={{ width: cw, height: ch, transform: `scale(${scale})` }}>
            {SLIDES.map((slide, i) => (
              <section
                key={slide.title}
                className={`${s.slide} ${s[slide.layout ?? 'split']} ${i === index ? s.active : ''}`}
                aria-roledescription="slajd"
                aria-label={`${i + 1} z ${SLIDES.length}: ${slide.title}`}
                aria-hidden={i !== index}
                inert={i !== index}
              >
                {slide.body}
                <span className={s.pageNo} aria-hidden="true">
                  {i + 1}
                </span>
              </section>
            ))}
          </div>
        </div>
      </div>

      <nav className={s.controls} aria-label="Slajdy">
        <button type="button" className={s.navBtn} onClick={() => go(index - 1)} disabled={index === 0} aria-label="Poprzedni slajd">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <ol className={s.dots}>
          {SLIDES.map((slide, i) => (
            <li key={slide.title}>
              <button
                type="button"
                className={s.dot}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Slajd ${i + 1}: ${slide.title}`}
                title={slide.title}
                onClick={() => go(i)}
              />
            </li>
          ))}
        </ol>
        <button type="button" className={s.navBtn} onClick={() => go(index + 1)} disabled={index === last} aria-label="Następny slajd">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
        <span className={s.counter} aria-live="polite">
          {index + 1} / {SLIDES.length}
        </span>
        <button
          type="button"
          className={s.navBtn}
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Wyjdź z pełnego ekranu (F)' : 'Pełny ekran (F)'}
          title={fullscreen ? 'Wyjdź z pełnego ekranu (F)' : 'Pełny ekran (F)'}
        >
          {fullscreen ? <Minimize size={20} aria-hidden="true" /> : <Maximize size={20} aria-hidden="true" />}
        </button>
      </nav>
    </main>
  )
}
