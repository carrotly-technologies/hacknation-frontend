import { ChevronLeft } from 'lucide-react'
import { Link, type LinkProps } from 'react-router'
import { cx } from './cx'
import s from './BackLink.module.css'

type Props = Omit<LinkProps, 'children'> & {
  /** Visible text; "Powrót" by default. */
  children?: string
}

/** "‹ Powrót" link above the page content: link colour, 44px target, focus ring. */
export function BackLink({ children = 'Powrót', className, ...rest }: Props) {
  return (
    <Link {...rest} className={cx(s.root, className)}>
      <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
      {children}
    </Link>
  )
}
