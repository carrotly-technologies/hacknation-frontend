import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { getTeam, type CaseSummary, type Deadline, type Person } from '../api/cases'
import { ErrorState, LoadingState } from '../components/QueryState'
import { Card, EmptyState, PageLayout, StatusBadge } from '../components/ui'
import { useMe } from '../lib/useAuth'
import { countLabel, fmtDate } from '../lib/format'
import { personUrl } from '../lib/people'
import { caseSteps, STAGE_SHORT } from '../lib/stages'
import s from './TeamPage.module.css'

/** One row of the table: a person and their assessment in progress (if any). */
interface TeamRow {
  person: Person
  name: string
  /** Kind ("Okresowa" / "Pierwsza") and stepper step of the case in progress; null when there is none. */
  current: { kind: string; step: string } | null
  deadline: Deadline | null
}

/**
 * "Mój zespół": the supervisor's people in one table (name with position, hire date, current assessment step,
 * nearest deadline). The whole row opens the employee profile; the "Otwórz ›" link in it is what the keyboard reaches.
 */
export function TeamPage() {
  const team = useQuery({ queryKey: ['team'], queryFn: ({ signal }) => getTeam(signal) })
  const me = useMe()

  if (team.isPending) return <PageLayout><LoadingState /></PageLayout>
  if (team.isError) return <PageLayout><ErrorState error={team.error} what="lista zespołu" onRetry={() => team.refetch()} /></PageLayout>

  const rows = toRows(team.data.cases)

  return (
    <PageLayout title="Mój zespół" meta={me.unit}>
      <section aria-labelledby="team-h">
        <div className="section__head">
          <h2 id="team-h" className="h-section">Pracownicy</h2>
          <span className="faint small">{countLabel(rows.length, 'osoba', 'osoby', 'osób')}</span>
        </div>
        <Card className={s.card}>
          {rows.length === 0 ? (
            <EmptyState as="h3" title="Brak pracowników w zespole">
              Gdy w systemie pojawią się osoby, które oceniasz, zobaczysz je tutaj.
            </EmptyState>
          ) : (
            <table className={s.table}>
              <caption className="visually-hidden">
                Pracownicy zespołu ze stanowiskiem, datą zatrudnienia, bieżącą oceną i najbliższym terminem; najpierw terminy, które minęły.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={s.colPerson}>Pracownik</th>
                  <th scope="col" className={s.colHired}>Data zatrudnienia</th>
                  <th scope="col" className={s.colCurrent}>Bieżąca ocena</th>
                  <th scope="col" className={s.colDeadline}>Najbliższy termin</th>
                  <th scope="col" className={s.colOpen}><span className="visually-hidden">Profil</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <PersonRow key={r.person.id} row={r} />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </PageLayout>
  )
}

function PersonRow({ row }: { row: TeamRow }) {
  const navigate = useNavigate()
  const { person, name, current, deadline } = row
  const url = personUrl(person.id)
  const hired = fmtDate(person.hiredOn)
  const currentText = current ? `${current.kind} · ${current.step}` : 'Brak bieżącej oceny'

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
        {/* Below 900px / 600px the hidden columns move here, under the position. */}
        <span className={`${s.sub} ${s.subHired}`} title={`Data zatrudnienia: ${hired}`}>
          Zatrudnienie: <span className="num">{hired}</span>
        </span>
        <span className={`${s.sub} ${s.subCurrent}`} title={currentText}>{currentText}</span>
      </td>
      <td className={`${s.colHired} num`}>{hired}</td>
      <td className={s.colCurrent}>
        {current ? (
          <>
            <span className={s.kind} title={current.kind}>{current.kind}</span>
            <span className={s.step} title={current.step}>{current.step}</span>
          </>
        ) : (
          <span className={s.none} title="Brak bieżącej oceny">Brak bieżącej oceny</span>
        )}
      </td>
      <td className={s.colDeadline}>
        <DeadlineCell deadline={deadline} />
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

/** Date of the nearest deadline with "Termin minął" (overdue) or "Wkrótce" (the backend's SOON state). */
function DeadlineCell({ deadline }: { deadline: Deadline | null }) {
  if (!deadline || deadline.state === 'NONE') return <span className="faint">—</span>
  const badge =
    deadline.state === 'OVERDUE' ? <StatusBadge tone="error">Termin minął</StatusBadge>
    : deadline.state === 'SOON' ? <StatusBadge tone="warning">Wkrótce</StatusBadge>
    : null
  return (
    <span className={s.deadline} title={deadline.label}>
      {deadline.date ? <span className="num">{fmtDate(deadline.date)}</span> : <span className={s.dateless}>{deadline.label}</span>}
      {badge && <span className={s.badge}>{badge}</span>}
    </span>
  )
}

/** One row per person: their case in progress (the one due soonest if the API sends more), sorted by urgency. */
function toRows(cases: CaseSummary[]): TeamRow[] {
  const byPerson = new Map<string, { person: Person; open: CaseSummary[] }>()
  for (const c of cases) {
    const entry = byPerson.get(c.person.id) ?? { person: c.person, open: [] }
    if (c.status !== 'ZAKONCZONA') entry.open.push(c)
    byPerson.set(c.person.id, entry)
  }
  const rows = [...byPerson.values()].map(({ person, open }): TeamRow => {
    const c = [...open].sort((a, b) => compareDeadlines(a.nextDeadline, b.nextDeadline))[0]
    return {
      person,
      name: `${person.firstName} ${person.lastName}`,
      current: c ? { kind: c.path === 'FIRST' ? 'Pierwsza' : 'Okresowa', step: stepLabel(c) } : null,
      deadline: c?.nextDeadline ?? null,
    }
  })
  return rows.sort((a, b) => compareDeadlines(a.deadline, b.deadline) || compareNames(a.person, b.person))
}

/** The stepper step the case is at ("Formularz oceny kompetencji"), named as in the case file. */
function stepLabel(c: CaseSummary): string {
  const step = caseSteps(c).find((st) => st.stages.some((x) => x.id === c.currentStage))
  return step?.label ?? STAGE_SHORT[c.currentStage]
}

/** Overdue first, then dated deadlines, then deadlines without a date ("niezwłocznie"), then no deadline. */
function rank(d: Deadline | null): number {
  if (!d || d.state === 'NONE') return 3
  if (d.state === 'OVERDUE') return 0
  return d.date ? 1 : 2
}

/** Within a rank the nearest date first; equal ones are left to the name order. */
function compareDeadlines(a: Deadline | null, b: Deadline | null): number {
  const byRank = rank(a) - rank(b)
  if (byRank !== 0) return byRank
  const da = a?.date ?? ''
  const db = b?.date ?? ''
  if (da === db) return 0
  if (!da || !db) return da ? -1 : 1
  return da < db ? -1 : 1
}

function compareNames(a: Person, b: Person): number {
  return a.lastName.localeCompare(b.lastName, 'pl') || a.firstName.localeCompare(b.firstName, 'pl')
}
