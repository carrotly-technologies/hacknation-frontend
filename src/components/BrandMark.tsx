import s from './BrandMark.module.css'

/** Logo #2 "Kafel z igłą" (hacknation-frontend#94): tile in the accent colour with a compass needle. Colours follow the theme. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className ? `${s.mark} ${className}` : s.mark} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" className={s.tile} />
      <polygon points="47.56 16.44 37.3 37.3 26.7 26.7" className={s.needle} />
      <polygon points="16.44 47.56 37.3 37.3 26.7 26.7" className={`${s.needle} ${s.tail}`} />
    </svg>
  )
}
