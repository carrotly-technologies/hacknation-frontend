import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { getTeam, type Person } from '../api/cases'
import { ErrorState, LoadingState } from '../components/QueryState'
import { Card, EmptyState, PageLayout } from '../components/ui'
import { useMe } from '../lib/useAuth'
import { countLabel } from '../lib/format'
import { personUrl } from '../lib/people'
import s from './TeamPage.module.css'

/** "Mój zespół": the supervisor's people as a list of rows (name, "Otwórz ›"); each row opens the employee profile. */
export function TeamPage() {
  const team = useQuery({ queryKey: ['team'], queryFn: ({ signal }) => getTeam(signal) })
  const me = useMe()

  if (team.isPending) return <PageLayout><LoadingState /></PageLayout>
  if (team.isError) return <PageLayout><ErrorState error={team.error} what="lista zespołu" onRetry={() => team.refetch()} /></PageLayout>

  // One row per person, even if the API sends more than one case for them.
  const people = [...new Map(team.data.cases.map((c) => [c.person.id, c.person])).values()]

  return (
    <PageLayout title="Mój zespół" meta={me.unit}>
      <section aria-labelledby="team-h">
        <div className="section__head">
          <h2 id="team-h" className="h-section">Pracownicy</h2>
          <span className="faint small">{countLabel(people.length, 'osoba', 'osoby', 'osób')}</span>
        </div>
        <Card className={s.card}>
          {people.length === 0 ? (
            <EmptyState as="h3" title="Brak pracowników w zespole">
              Gdy w systemie pojawią się osoby, które oceniasz, zobaczysz je tutaj.
            </EmptyState>
          ) : (
            <ul className={s.list}>
              {people.map((p) => (
                <PersonRow key={p.id} person={p} />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </PageLayout>
  )
}

function PersonRow({ person }: { person: Person }) {
  const name = `${person.firstName} ${person.lastName}`
  return (
    <li>
      <Link to={personUrl(person.id)} className={s.row} aria-label={`Otwórz profil: ${name}`}>
        <span className={s.name} title={name}>{name}</span>
        <span className={s.open} aria-hidden="true">
          Otwórz <ChevronRight size={18} />
        </span>
      </Link>
    </li>
  )
}
