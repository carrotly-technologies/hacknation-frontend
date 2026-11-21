import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { getTeam, type CaseSummary, type Person } from '../api/cases'
import { ErrorState, LoadingState } from '../components/QueryState'
import { Card, EmptyState, PageLayout } from '../components/ui'
import { useMe } from '../lib/useAuth'
import { countLabel, fmtDate } from '../lib/format'
import { personUrl } from '../lib/people'
import s from './TeamPage.module.css'

/**
 * "Mój zespół": the supervisor's people in one table (name with position, hire date), alphabetically by surname.
 * Assessment state and deadlines live in the employee profile and the case file. The whole row opens the profile;
 * the "Otwórz ›" link in it is what the keyboard reaches.
 */
export function TeamPage() {
  const team = useQuery({ queryKey: ['team'], queryFn: ({ signal }) => getTeam(signal) })
  const me = useMe()

  if (team.isPending) return <PageLayout><LoadingState /></PageLayout>
  if (team.isError) return <PageLayout><ErrorState error={team.error} what="lista zespołu" onRetry={() => team.refetch()} /></PageLayout>

  const people = toPeople(team.data.cases)

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
            <table className={s.table}>
              <caption className="visually-hidden">
                Pracownicy zespołu ze stanowiskiem i datą zatrudnienia, alfabetycznie według nazwiska.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={s.colPerson}>Pracownik</th>
                  <th scope="col" className={s.colHired}>Data zatrudnienia</th>
                  <th scope="col" className={s.colOpen}><span className="visually-hidden">Profil</span></th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <PersonRow key={p.id} person={p} />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </PageLayout>
  )
}

function PersonRow({ person }: { person: Person }) {
  const navigate = useNavigate()
  const name = `${person.firstName} ${person.lastName}`
  const url = personUrl(person.id)
  const hired = fmtDate(person.hiredOn)

  // A click anywhere in the row opens the profile, like the link; a click on the link itself or selecting text does not.
  const onClick = (e: MouseEvent<HTMLTableRowElement>) => {
    if ((e.target as HTMLElement).closest('a') || window.getSelection()?.toString()) return
    navigate(url)
  }

  return (
    <tr className={s.row} onClick={onClick}>
      <td className={s.colPerson}>
        <span className={s.name} title={name}>{name}</span>
        <span className={s.sub} title={person.position}>{person.position}</span>
        {/* Below 600px the hire date column moves here, under the position. */}
        <span className={`${s.sub} ${s.subHired}`} title={`Data zatrudnienia: ${hired}`}>
          Zatrudnienie: <span className="num">{hired}</span>
        </span>
      </td>
      <td className={`${s.colHired} num`}>{hired}</td>
      <td className={s.colOpen}>
        <Link to={url} className={s.open} aria-label={`Otwórz profil: ${name}`}>
          <span className={s.openText}>Otwórz</span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </td>
    </tr>
  )
}

/** The people behind the team's cases, each once, alphabetically by surname, then first name (Polish collation). */
function toPeople(cases: CaseSummary[]): Person[] {
  const byId = new Map<string, Person>()
  for (const c of cases) if (!byId.has(c.person.id)) byId.set(c.person.id, c.person)
  return [...byId.values()].sort(
    (a, b) => a.lastName.localeCompare(b.lastName, 'pl') || a.firstName.localeCompare(b.firstName, 'pl'),
  )
}
