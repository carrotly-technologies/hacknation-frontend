import { ChevronDown, ChevronRight } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
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
  /** Plain card that opens and closes: the heading is a full-width button, the body is hidden when closed. */
  collapsible?: boolean
  /** Collapsible card only: open on first render (closed by default). */
  defaultOpen?: boolean
  /** Collapsible card only: a smaller second line under the title, visible when closed. */
  subtitle?: ReactNode
}

export function Card({ title, as: H = 'h3', icon, children, to, onClick, loading, disabled, forceState, className, bodyClassName, collapsible, defaultOpen, subtitle }: Props) {
  if (collapsible) {
    return (
      <CollapsibleCard title={title} as={H} subtitle={subtitle} defaultOpen={defaultOpen} forceState={forceState} className={className} bodyClassName={bodyClassName}>
        {children}
      </CollapsibleCard>
    )
  }
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

type CollapsibleProps = Pick<Props, 'title' | 'subtitle' | 'children' | 'defaultOpen' | 'forceState' | 'className' | 'bodyClassName'> & {
  as: 'h2' | 'h3' | 'h4'
}

/** The plain card's look; the heading wraps a disclosure button (aria-expanded), Enter / Space toggle it natively. */
function CollapsibleCard({ title, as: H, subtitle, children, defaultOpen = false, forceState, className, bodyClassName }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section className={cx(s.card, s.collapsible, className)}>
      <H className={s.collapsibleHeading}>
        <button
          type="button"
          className={s.collapsibleToggle}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          data-force={forceState}
        >
          <span className={s.collapsibleText}>
            <span className={s.cardTitle}>{title}</span>
            {subtitle && <span className={s.collapsibleSubtitle}>{subtitle}</span>}
          </span>
          <ChevronDown className={s.collapsibleIcon} size={22} aria-hidden="true" />
        </button>
      </H>
      <div id={id} className={cx(s.cardBody, s.collapsiblePanel, bodyClassName)} hidden={!open}>
        {children}
      </div>
    </section>
  )
}
