import type { StageInfo } from '../api/cases'

/** Mini process track: one dot per stage, current one ringed. */
export function StageDots({ stages }: { stages: StageInfo[] }) {
  return (
    <span className="stage-dots" aria-hidden="true" title={stages.map((s) => s.name).join(' → ')}>
      {stages.map((s, i) => (
        <span key={s.id} className="stage-dots__item">
          {i > 0 && <span className={`stage-dots__line ${s.status === 'DONE' || s.status === 'CURRENT' ? 'is-on' : ''}`} />}
          <span className={`stage-dots__dot stage-dots__dot--${s.status.toLowerCase()}`} title={s.name} />
        </span>
      ))}
    </span>
  )
}
