import { Link } from 'react-router'

/**
 * Footer of every screen (app shell, sign-in, the assessed person's page): the activity log is not hidden, and the
 * accessibility statement is one Tab away (required link, ustawa o dostępności cyfrowej).
 */
export function ActivityNotice({ className }: { className?: string }) {
  return (
    <footer className={['activity-notice', className].filter(Boolean).join(' ')}>
      <Link to="/deklaracja-dostepnosci" className="activity-notice__link">
        Deklaracja dostępności
      </Link>
      <span>Aplikacja rejestruje aktywność w celach analitycznych.</span>
    </footer>
  )
}
