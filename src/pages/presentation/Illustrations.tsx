import s from '../PresentationPage.module.css'

/* Illustrations without screenshots, drawn in SVG. Every colour is a class bound to a token
   (PresentationPage.module.css), so they follow the light and dark theme. */

/** The compass needle of the logo (BrandMark, 64×64 grid), scaled into a tile at (x, y) of `size`. */
function CompassTile({ x, y, size, className }: { x: number; y: number; size: number; className?: string }) {
  const k = size / 64
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} className={className}>
      <rect width="64" height="64" rx="14" className={s.fAccent} />
      <polygon points="47.56 16.44 37.3 37.3 26.7 26.7" className={s.fOnAccent} />
      <polygon points="16.44 47.56 37.3 37.3 26.7 26.7" className={s.fOnAccent} opacity="0.55" />
    </g>
  )
}

/** One assessment folder: tab, body, a row of 7 stage dots and two text lines. */
function Folder({ front }: { front?: boolean }) {
  return (
    <g>
      <path d="M0 24 a16 16 0 0 1 16 -16 h84 l20 22 h164 a16 16 0 0 1 16 16 v190 a16 16 0 0 1 -16 16 h-268 a16 16 0 0 1 -16 -16 z" className={front ? s.folderFront : s.folder} />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={36 + i * 26} cy={92} r={8} className={i < 4 ? (front ? s.fOnAccent : s.fAccent) : front ? s.dotFrontTodo : s.dotTodo} />
      ))}
      <rect x="28" y="130" width="180" height="14" rx="7" className={front ? s.lineFront : s.line} />
      <rect x="28" y="160" width="120" height="14" rx="7" className={front ? s.lineFront : s.line} />
    </g>
  )
}

/** Slide 1: seven assessment folders fanned out, the front one with the compass. */
export function FoldersIllustration() {
  const angles = [-33, 33, -22, 22, -11, 11, 0]
  return (
    <svg className={s.svg} viewBox="20 110 860 620" role="img" aria-label="Siedem teczek ocen rozłożonych w wachlarz">
      {angles.map((a) => (
        <g key={a} transform={`rotate(${a} 450 980) translate(300 300)`}>
          <Folder front={a === 0} />
        </g>
      ))}
      <CompassTile x={392} y={140} size={116} className={s.shadowed} />
    </svg>
  )
}

/** A sheet of paper with text lines, optionally with a big glyph (§, a calendar). */
function Paper({ x, y, r, glyph }: { x: number; y: number; r: number; glyph?: '§' | 'cal' | '!' }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r} 85 110)`}>
      <rect width="170" height="220" rx="12" className={s.paper} />
      {glyph === '§' && (
        <text x="85" y="128" textAnchor="middle" className={s.glyph}>
          §
        </text>
      )}
      {glyph === 'cal' && (
        <g>
          <rect x="30" y="40" width="110" height="100" rx="10" className={s.calendar} />
          <rect x="30" y="40" width="110" height="26" rx="10" className={s.fWarn} />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={42 + (i % 3) * 32} y={76 + Math.floor(i / 3) * 20} width="20" height="12" rx="3" className={i === 7 ? s.fWarn : s.line} />
          ))}
        </g>
      )}
      {glyph === '!' && (
        <g>
          <circle cx="85" cy="90" r="40" className={s.fWarnBg} />
          <text x="85" y="112" textAnchor="middle" className={s.glyphWarn}>
            !
          </text>
        </g>
      )}
      {!glyph &&
        [40, 66, 92, 118, 144].map((ly, i) => <rect key={ly} x="24" y={ly} width={i % 2 ? 90 : 122} height="10" rx="5" className={s.line} />)}
      {glyph && [166, 186].map((ly, i) => <rect key={ly} x="24" y={ly} width={i ? 80 : 122} height="10" rx="5" className={s.line} />)}
    </g>
  )
}

/** Slide 2: scattered sheets, regulations and deadlines → one compass. */
export function ChaosIllustration() {
  return (
    <svg className={s.svg} viewBox="0 0 1000 720" role="img" aria-label="Rozrzucone arkusze, przepisy i terminy prowadzą do jednego kompasu">
      <Paper x={40} y={70} r={-14} />
      <Paper x={230} y={30} r={9} glyph="§" />
      <Paper x={60} y={330} r={8} glyph="cal" />
      <Paper x={250} y={300} r={-10} />
      <Paper x={150} y={190} r={3} glyph="!" />
      <Paper x={370} y={420} r={14} glyph="§" />
      <path d="M560 360 C 620 300, 660 300, 700 350" className={s.arrow} markerEnd="url(#chaos-arrow)" />
      <defs>
        <marker id="chaos-arrow" viewBox="0 0 12 12" refX="7" refY="6" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M1 1 L11 6 L1 11" className={s.arrowHead} />
        </marker>
      </defs>
      <CompassTile x={720} y={240} size={240} className={s.shadowed} />
    </svg>
  )
}

type Box = { x: number; y: number; w: number; h: number; title: string; lines: string[]; optional?: boolean; accent?: boolean }

function ArchBox({ b }: { b: Box }) {
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="22" className={b.accent ? s.boxAccent : b.optional ? s.boxOptional : s.box} />
      <text x={b.x + 32} y={b.y + 56} className={s.boxTitle}>
        {b.title}
      </text>
      {b.lines.map((l, i) => (
        <text key={l} x={b.x + 32} y={b.y + 100 + i * 36} className={s.boxText}>
          {l}
        </text>
      ))}
    </g>
  )
}

/** Slide 9: the two containers and the optional services. */
export function ArchitectureIllustration() {
  const boxes: Box[] = [
    { x: 50, y: 60, w: 500, h: 160, title: 'Aplikacja w przeglądarce', lines: ['React + Vite'] },
    { x: 50, y: 370, w: 500, h: 230, title: 'API', lines: ['NestJS', 'reguły z przepisów', 'baza wiedzy'], accent: true },
    { x: 640, y: 270, w: 350, h: 150, title: 'PostgreSQL', lines: ['opcjonalnie'], optional: true },
    { x: 640, y: 490, w: 350, h: 150, title: 'Model językowy', lines: ['opcjonalnie, np. Ollama'], optional: true },
  ]
  return (
    <svg className={s.svg} viewBox="0 0 1000 720" role="img" aria-label="Architektura: aplikacja w przeglądarce, API, opcjonalnie PostgreSQL i model językowy">
      <rect x="16" y="20" width="568" height="680" rx="32" className={s.dockerBand} />
      <text x="50" y="664" className={s.bandLabel}>
        Docker · Linux, Windows, macOS
      </text>
      <path d="M300 228 V 362" className={s.wire} markerEnd="url(#arch-arrow)" />
      <path d="M558 450 H 600 V 345 H 632" className={s.wireDashed} markerEnd="url(#arch-arrow)" />
      <path d="M558 530 H 600 V 565 H 632" className={s.wireDashed} markerEnd="url(#arch-arrow)" />
      <defs>
        <marker id="arch-arrow" viewBox="0 0 12 12" refX="8" refY="6" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M1 1 L11 6 L1 11" className={s.arrowHead} />
        </marker>
      </defs>
      {boxes.map((b) => (
        <ArchBox key={b.title} b={b} />
      ))}
    </svg>
  )
}

/** Slide 10: from today's prototype to the next steps. */
export function RoadmapIllustration() {
  const steps = [
    { label: 'Prototyp', sub: 'dziś', done: true },
    { label: 'EZD i kadry', sub: 'integracja przez API' },
    { label: 'Logowanie', sub: 'kontem urzędowym (SSO)' },
    { label: 'Analityka', sub: 'potrzeby szkoleniowe dla HR' },
    { label: 'Inne urzędy', sub: 'ten sam obraz Docker' },
  ]
  const x0 = 90
  const dx = 205
  return (
    <svg className={s.svg} viewBox="0 0 1000 420" role="img" aria-label="Kierunki rozwoju: integracja z EZD i systemami kadrowymi, logowanie urzędowe, analityka dla HR, inne urzędy">
      <line x1={x0} y1="120" x2={x0 + dx * (steps.length - 1)} y2="120" className={s.track} />
      <line x1={x0} y1="120" x2={x0 + dx * 0.5} y2="120" className={s.trackDone} />
      {steps.map((st, i) => (
        <g key={st.label} transform={`translate(${x0 + i * dx} 120)`}>
          <circle r={st.done ? 30 : 24} className={st.done ? s.fAccent : s.nodeTodo} />
          {st.done && <path d="M-11 1 L-3 9 L12 -8" className={s.check} />}
          <text y="92" textAnchor="middle" className={s.nodeLabel}>
            {st.label}
          </text>
          {st.sub.split(' ').reduce<string[]>((rows, w) => {
            const last = rows[rows.length - 1]
            if (last && (last + ' ' + w).length <= 14) rows[rows.length - 1] = last + ' ' + w
            else rows.push(w)
            return rows
          }, []).map((row, r) => (
            <text key={row} y={132 + r * 34} textAnchor="middle" className={s.nodeSub}>
              {row}
            </text>
          ))}
        </g>
      ))}
    </svg>
  )
}
