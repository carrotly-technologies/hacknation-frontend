import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { getTeam, type CaseSummary, type Deadline, type Person } from '../api/cases'
import { ErrorState, LoadingState } from '../components/QueryState'
import { Card, EmptyState, PageLayout } from '../components/ui'
import { useMe } from '../lib/useAuth'
import { countLabel, fmtDate, fmtDaysLeft } from '../lib/format'
import { personUrl } from '../lib/people'
import { CASE_STATUS_LABEL, STAGE_SHORT } from '../lib/stages'
import s from './TeamPage.module.css'

/**
 * "Mój zespół": the supervisor's people in one table (name with position, hire date, current assessment step and the
 * nearest deadline), nearest deadline first (overdue at the top), people without a deadline last, alphabetically.
 * The whole row opens the profile; the "Otwórz ›" link in it is what the keyboard reaches.
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
                Pracownicy zespołu ze stanowiskiem, datą zatrudnienia, etapem oceny i najbliższym terminem; najpierw terminy najbliższe i przekroczone.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={s.colPerson}>Pracownik</th>
                  <th scope="col" className={s.colHired}>Data zatrudnienia</th>
                  <th scope="col" className={s.colStage}>Etap</th>
                  <th scope="col" className={s.colDeadline}>Najbliższy termin</th>
                  <th scope="col" className={s.colOpen}><span className="visually-hidden">Profil</span></th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <PersonRow key={p.person.id} person={p.person} current={p.current} />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </PageLayout>
  )
}

function PersonRow({ person, current }: { person: Person; current: CaseSummary | null }) {
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
      <td className={s.colStage}>
        <span className={s.stageText}>{current ? stageText(current) : '—'}</span>
      </td>
      <td className={s.colDeadline}>
        <DeadlineCell deadline={current?.nextDeadline ?? null} />
      </td>
      <td className={s.colOpen}>
        <Link to={url} className={s.open} aria-label={`Otwórz profil: ${name}`}>
          <span className={s.openText}>Otwórz</span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </td>
    </tr>
  )
}

function stageText(c: CaseSummary): string {
  if (c.status === 'W_TOKU') return STAGE_SHORT[c.currentStage]
  return CASE_STATUS_LABEL[c.status]
}

function DeadlineCell({ deadline }: { deadline: Deadline | null }) {
  if (!deadline?.date || deadline.daysLeft === null) return <span className={s.cellText}>—</span>
  const overdue = deadline.daysLeft < 0
  return (
    <>
      <span className={`${s.cellText} num`}>{fmtDate(deadline.date)}</span>
      <span className={`${s.sub} ${overdue ? s.overdue : ''}`} title={deadline.label}>
        {fmtDaysLeft(deadline.daysLeft)}
      </span>
    </>
  )
}

/** Which case a person's row shows: the one in progress, else the newest by its next deadline. */
const STATUS_RANK: Record<CaseSummary['status'], number> = { W_TOKU: 0, DO_ZAPOZNANIA: 1, OKRES_SPRZECIWU: 2, ZAKONCZONA: 3 }

interface TeamRow {
  person: Person
  current: CaseSummary | null
}

/**
 * The people behind the team's cases, each once with their current case; nearest deadline first (overdue at the
 * top), people without a dated deadline last, then by surname and first name (Polish collation).
 */
function toPeople(cases: CaseSummary[]): TeamRow[] {
  const byId = new Map<string, TeamRow>()
  for (const c of cases) {
    const row = byId.get(c.person.id)
    if (!row) byId.set(c.person.id, { person: c.person, current: c })
    else if (row.current && STATUS_RANK[c.status] < STATUS_RANK[row.current.status]) row.current = c
  }
  const dateOf = (r: TeamRow) => r.current?.nextDeadline?.date ?? null
  return [...byId.values()].sort((a, b) => {
    const da = dateOf(a)
    const db = dateOf(b)
    if (da && db && da !== db) return da.localeCompare(db)
    if (da && !db) return -1
    if (!da && db) return 1
    return a.person.lastName.localeCompare(b.person.lastName, 'pl') || a.person.firstName.localeCompare(b.person.firstName, 'pl')
  })
}
