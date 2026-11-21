import { ChevronRight, Users } from 'lucide-react'
import { Link } from 'react-router'
import { PageLayout } from '../components/ui'
import { HOME_BY_ROLE, useMe } from '../lib/useAuth'

export function NotFoundPage() {
  const me = useMe()
  return (
    <PageLayout title="Nie ma takiej strony" meta="Adres mógł się zmienić.">
      <div className="panel nav-card">
        <Link className="nav-row" to={HOME_BY_ROLE[me.role]}>
          <Users className="nav-row__icon" size={20} strokeWidth={1.75} aria-hidden="true" />
          <span className="nav-row__text">Wróć do strony startowej</span>
          <ChevronRight className="nav-row__chev" size={18} aria-hidden="true" />
        </Link>
      </div>
    </PageLayout>
  )
}
