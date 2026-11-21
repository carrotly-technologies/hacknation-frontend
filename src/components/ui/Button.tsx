import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'
import { Spinner } from './Spinner'
import s from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text'

type Common = {
  variant?: ButtonVariant
  /** Red version for irreversible actions (delete, withdraw). */
  destructive?: boolean
  size?: 'large' | 'small'
  fullWidth?: boolean
  /** Icon before the label (lucide-react element, aria-hidden). */
  icon?: ReactNode
  /** Forces a visual state; only for the /ui showcase. */
  forceState?: 'hover' | 'focus'
}

function classes({ variant = 'primary', destructive, size = 'large', fullWidth }: Common, extra?: string) {
  return cx(s.root, s[variant], destructive && s.destructive, size === 'small' && s.small, fullWidth && s.full, extra)
}

type ButtonProps = Common &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Keeps the width, shows a spinner and blocks clicks. */
    loading?: boolean
  }

export function Button({
  variant,
  destructive,
  size,
  fullWidth,
  icon,
  forceState,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-force={forceState}
      className={classes({ variant, destructive, size, fullWidth }, cx(loading && s.loading, className))}
    >
      <span className={s.label}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className={s.spinner}>
          <Spinner label="Trwa ładowanie" />
        </span>
      )}
    </button>
  )
}

type ButtonLinkProps = Common & LinkProps

/** A navigation link that looks like a button. */
export function ButtonLink({ variant, destructive, size, fullWidth, icon, forceState, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link {...rest} data-force={forceState} className={classes({ variant, destructive, size, fullWidth }, className)}>
      <span className={s.label}>
        {icon}
        {children}
      </span>
    </Link>
  )
}
