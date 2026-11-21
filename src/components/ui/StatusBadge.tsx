import type { ReactNode } from 'react'
import { cx } from './cx'
import s from './Feedback.module.css'

type Props = {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

/** Short status of a case or document ("W toku", "Zatwierdzony"). Colour is never the only cue: always add text. */
export function StatusBadge({ tone = 'neutral', children }: Props) {
  return (
    <span className={cx(s.badge, s[tone])}>
      <span className={s.badgeDot} aria-hidden="true" />
      {children}
    </span>
  )
}
