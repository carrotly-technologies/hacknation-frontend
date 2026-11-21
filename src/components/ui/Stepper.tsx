import type { ReactNode } from 'react'
import s from './Overlay.module.css'

type Props = {
  current: number
  total: number
  /** Word before the numbers: "Krok 2 z 3" (default) or e.g. "Część 2 z 3". */
  unit?: string
  /** Name of the current step, shown after the counter ("Część 2 z 3: Ocena"). */
  name?: ReactNode
  /** Hide the "Część 2 z 3: Ocena" line visually but keep it for screen readers (the bar stays). */
  hideText?: boolean
}

/** "Krok X z Y" with a progress bar, above the question of a multi-step form. */
export function Stepper({ current, total, unit = 'Krok', name, hideText = false }: Props) {
  const pct = Math.round((Math.min(current, total) / total) * 100)
  return (
    <div className={s.stepper}>
      <p className={hideText ? 'visually-hidden' : s.stepperText}>
        {unit} {current} z {total}
        {name && <>: {name}</>}
      </p>
      <div className={s.track} aria-hidden="true">
        <div className={s.bar} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
