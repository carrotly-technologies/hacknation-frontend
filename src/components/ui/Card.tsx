import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'
import { Spinner } from './Spinner'
import s from './Surface.module.css'

type Props = {
  title?: ReactNode
  /** Heading level of the title; defaults to h3. */
  as?: 'h2' | 'h3' | 'h4'
  icon?: ReactNode
  children?: ReactNode
  /** Makes the whole card a link (service tile). */
  to?: string
  /** Makes the whole card a button (action tile); the body may wrap to several lines. */
  onClick?: () => void
  /** Button card only: shows a spinner instead of the chevron and blocks clicks. */
  loading?: boolean
  /** Button card only. */
  disabled?: boolean
  forceState?: 'hover' | 'focus'
  className?: string
  /** Plain card only: extra class on the body (e.g. a flex column with a scrolling list). */
  bodyClassName?: string
}

export function Card({ title, as: H = 'h3', icon, children, to, onClick, loading, disabled, forceState, className, bodyClassName }: Props) {
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
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cx(s.card, s.clickable, s.cardButton, loading && s.cardLoading, className)}
        data-force={forceState}
      >
        {icon && <span className={s.cardIcon}>{icon}</span>}
        <span>
          {title && <span className={s.cardTitle}>{title}</span>}
          {children && <span className={s.cardBody}>{children}</span>}
        </span>
        {loading ? <Spinner label="Trwa ładowanie" /> : <ChevronRight className={s.chevron} size={22} aria-hidden="true" />}
      </button>
    )
  }
  return (
    <section className={cx(s.card, className)}>
      {title && <H className={s.cardTitle}>{title}</H>}
      {children && <div className={cx(s.cardBody, bodyClassName)}>{children}</div>}
    </section>
  )
}
