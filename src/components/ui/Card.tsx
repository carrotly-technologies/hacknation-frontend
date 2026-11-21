import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'
import s from './Surface.module.css'

type Props = {
  title?: ReactNode
  /** Heading level of the title; defaults to h3. */
  as?: 'h2' | 'h3' | 'h4'
  icon?: ReactNode
  children?: ReactNode
  /** Makes the whole card a link (service tile). */
  to?: string
  forceState?: 'hover' | 'focus'
  className?: string
}

export function Card({ title, as: H = 'h3', icon, children, to, forceState, className }: Props) {
  if (to) {
    return (
      <Link to={to} className={cx(s.card, s.clickable, className)} data-force={forceState}>
        {icon && <span className={s.cardIcon}>{icon}</span>}
        <span>
          {title && <span className={cx(s.cardTitle, 'one-line')}>{title}</span>}
          {children && <span className={cx(s.cardBody, 'one-line')}>{children}</span>}
        </span>
        <ChevronRight className={s.chevron} size={22} aria-hidden="true" />
      </Link>
    )
  }
  return (
    <section className={cx(s.card, className)}>
      {title && <H className={s.cardTitle}>{title}</H>}
      {children && <div className={s.cardBody}>{children}</div>}
    </section>
  )
}
