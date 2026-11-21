import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from './cx'
import s from './Feedback.module.css'

export type Tone = 'info' | 'success' | 'warning' | 'error'

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert }
const prefix = { info: 'Informacja', success: 'Sukces', warning: 'Uwaga', error: 'Błąd' }

type Props = {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  /** Announce immediately (for alerts that appear after an action). */
  live?: boolean
  className?: string
}

export function InlineAlert({ tone = 'info', title, children, live, className }: Props) {
  const Icon = icons[tone]
  return (
    <div className={cx(s.alert, s[tone], className)} role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}>
      <Icon className={s.alertIcon} size={20} aria-hidden="true" />
      <div className={s.alertBody}>
        <span className="visually-hidden">{prefix[tone]}: </span>
        {title && <p className={s.alertTitle}>{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}
