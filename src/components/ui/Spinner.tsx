import { cx } from './cx'
import s from './Spinner.module.css'

type Props = {
  size?: 'small' | 'large'
  /** Read by screen readers; omit when the surrounding text already says what is loading. */
  label?: string
  className?: string
}

export function Spinner({ size = 'small', label, className }: Props) {
  return (
    <span role={label ? 'status' : undefined} className={cx(s.root, size === 'large' && s.large, className)}>
      {label && <span className="visually-hidden">{label}</span>}
    </span>
  )
}
