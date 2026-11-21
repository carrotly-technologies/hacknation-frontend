import type { ReactNode } from 'react'
import s from './Surface.module.css'

/** Wrap InfoRows in InfoList (a definition list). */
export function InfoList({ children }: { children: ReactNode }) {
  return <dl className={s.infoList}>{children}</dl>
}

type Props = {
  label: ReactNode
  value: ReactNode
  /** e.g. a "Zmień" link on the check-answers page */
  action?: ReactNode
}

export function InfoRow({ label, value, action }: Props) {
  return (
    <div className={s.infoRow}>
      <dt className={s.infoLabel}>{label}</dt>
      <dd className={s.infoValue}>{value}</dd>
      {action && <dd className={s.infoAction}>{action}</dd>}
    </div>
  )
}
