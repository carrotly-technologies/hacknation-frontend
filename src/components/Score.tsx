import { SCALE_LABELS, scoreClass } from '../lib/scale'

/** Points chip in the shared 1–9 palette. */
export function ScoreChip({ points, withLabel = false, size = 'md' }: { points: number | null | undefined; withLabel?: boolean; size?: 'sm' | 'md' }) {
  if (points === null || points === undefined)
    return <span className={`score-chip score-chip--${size} score--none`} title="nieocenione">—</span>
  return (
    <span className={`score-chip score-chip--${size} ${scoreClass(points)}`} title={`${points} pkt · ${SCALE_LABELS[points]}`}>
      <span className="score-chip__num num">{points}</span>
      {withLabel && <span className="score-chip__label">{SCALE_LABELS[points]}</span>}
    </span>
  )
}
