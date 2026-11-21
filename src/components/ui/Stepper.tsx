import s from './Overlay.module.css'

type Props = {
  current: number
  total: number
}

/** "Krok X z Y" with a progress bar, above the question of a multi-step form. */
export function Stepper({ current, total }: Props) {
  const pct = Math.round((Math.min(current, total) / total) * 100)
  return (
    <div className={s.stepper}>
      <p className={s.stepperText}>
        Krok {current} z {total}
      </p>
      <div className={s.track} aria-hidden="true">
        <div className={s.bar} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
