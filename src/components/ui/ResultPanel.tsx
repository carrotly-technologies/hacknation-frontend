import { CircleCheck, CircleX, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from './cx'
import s from './ResultPanel.module.css'

type Props = {
  result: 'POSITIVE' | 'NEGATIVE' | null
  /** The result can still change: neutral style and "Wstępnie: …". */
  provisional?: boolean
  /** One line under the heading, e.g. "Ocena łączna 5,8 · na poziomie oczekiwań". */
  summary?: ReactNode
  /** Why the result is what it is. */
  reason?: ReactNode
  /** What is still missing for a final result (shown while provisional or without a result). */
  missing?: ReactNode
  className?: string
}

/**
 * The assessment result as a full-width panel: green with a check for a positive result, red with a cross for a
 * negative one, neutral with "Wstępnie: …" while it can still change. Readable without colour (heading + icon).
 */
export function ResultPanel({ result, provisional, summary, reason, missing, className }: Props) {
  const word = result === 'POSITIVE' ? 'pozytywna' : 'negatywna'
  const tone = !result || provisional ? 'neutral' : result === 'POSITIVE' ? 'positive' : 'negative'
  const Icon = tone === 'positive' ? CircleCheck : tone === 'negative' ? CircleX : Info
  const heading = !result ? 'Wynik pojawi się po uzupełnieniu ocen' : provisional ? `Wstępnie: ocena ${word}` : `Ocena ${word}`
  return (
    <div role="region" aria-label="Wynik oceny" className={cx(s.panel, s[tone], className)}>
      <Icon className={s.icon} size={28} aria-hidden="true" />
      <div className={s.body}>
        <p className={s.heading}>{heading}</p>
        {summary && <p className={s.summary}>{summary}</p>}
        {(provisional || !result) && missing && <p className={s.text}>{missing}</p>}
        {reason && <p className={s.text}>{reason}</p>}
      </div>
    </div>
  )
}
