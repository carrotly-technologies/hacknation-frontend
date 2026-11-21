import type { ReactNode } from 'react'
import s from './Surface.module.css'

type Props = {
  icon?: ReactNode
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  /** Heading level; h1 when the empty state is the whole page. */
  as?: 'h1' | 'h2' | 'h3'
}

export function EmptyState({ icon, title, children, action, as: H = 'h2' }: Props) {
  return (
    <div className={s.empty}>
      {icon && (
        <span className={s.emptyIcon} aria-hidden="true">
          {icon}
        </span>
      )}
      <H className={s.emptyTitle}>{title}</H>
      {children && <div className={s.emptyBody}>{children}</div>}
      {action && <div className={s.emptyAction}>{action}</div>}
    </div>
  )
}
