import { ChevronRight, Users } from 'lucide-react'
import { Link } from 'react-router'
import { HOME_BY_ROLE, useMe } from '../lib/useAuth'

export function NotFoundPage() {
  const me = useMe()
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="h-page">Nie ma takiej strony</h1>
      </header>
      <p className="muted">Adres mógł się zmienić.</p>
      <div className="panel nav-card">
        <Link className="nav-row" to={HOME_BY_ROLE[me.role]}>
          <Users className="nav-row__icon" size={20} strokeWidth={1.75} aria-hidden="true" />
          <span className="nav-row__text">Wróć do strony startowej</span>
          <ChevronRight className="nav-row__chev" size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
