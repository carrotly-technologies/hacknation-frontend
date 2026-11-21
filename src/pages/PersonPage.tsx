import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getPerson, type HistoryItem, type PersonOsp, type PersonProfile } from '../api/people'
import { ErrorState, LoadingState } from '../components/QueryState'
import { BackLink, Button, ButtonLink, Card, EmptyState, InfoList, InfoRow, InlineAlert, StatusBadge } from '../components/ui'
import { fmtDate } from '../lib/format'
import { assessmentAction, EMPLOYMENT_LABEL, lastCompleted, RESULT_LABEL } from '../lib/people'
import { caseUrl } from '../lib/stages'
import { HOME_BY_ROLE, useMe } from '../lib/useAuth'
import s from './PersonPage.module.css'

/** Employee profile: data, job description, supervisor and assessment history in one column, with one button to the right assessment. */
export function PersonPage() {
  const { personId = '' } = useParams()
  const me = useMe()
  const q = useQuery({ queryKey: ['person', personId], queryFn: ({ signal }) => getPerson(personId, signal) })
  const back = <BackLink to={HOME_BY_ROLE[me.role]}>Mój zespół</BackLink>

  if (q.isPending) return <div className="page"><LoadingState /></div>
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) {
      return (
        <div className="page">
          {back}
          <EmptyState as="h1" title="Nie znaleziono pracownika">
            Tego pracownika nie ma w Twoim zespole albo adres jest nieaktualny. Wróć do listy zespołu i wybierz osobę jeszcze raz.
          </EmptyState>
        </div>
      )
    }
    return <div className="page"><ErrorState error={q.error} what="profil pracownika" onRetry={() => q.refetch()} /></div>
  }

  const profile = q.data
  const { person, supervisor } = profile

  return (
    <div className="page">
      {back}
      <header className={s.head}>
        <div className={s.title}>
          <h1 className="h-page">{person.firstName} {person.lastName}</h1>
          <p className={s.position} title={person.position}>{person.position}</p>
        </div>
        <AssessmentButton profile={profile} />
      </header>

      <div className={s.status}>
        <LastAssessment history={profile.history} />
      </div>

      <div className={s.sections}>
        <Card title="Dane pracownika" as="h2">
          <InfoList>
            <InfoRow label="Komórka organizacyjna" value={person.unit} />
            <InfoRow label="Stanowisko" value={person.position} />
            <InfoRow label="Status" value={EMPLOYMENT_LABEL[person.employment]} />
            <InfoRow label="Data zatrudnienia" value={fmtDate(person.hiredOn)} />
          </InfoList>
        </Card>
        <Card title="Opis stanowiska" as="h2">
          <JobDescription osp={profile.osp} />
        </Card>
        <Card title="Przełożony" as="h2">
          {supervisor ? (
            <InfoList>
              <InfoRow label="Imię i nazwisko" value={`${supervisor.firstName} ${supervisor.lastName}`} />
              <InfoRow label="Stanowisko" value={supervisor.position} />
              <InfoRow label="Komórka organizacyjna" value={supervisor.unit} />
            </InfoList>
          ) : (
            <p>Brak danych o przełożonym.</p>
          )}
        </Card>
        <Card title="Historia ocen" as="h2">
          <HistoryTable history={profile.history} name={`${person.firstName} ${person.lastName}`} />
        </Card>
      </div>
    </div>
  )
}

function JobDescription({ osp }: { osp: PersonOsp | null }) {
  if (!osp) return <p>Brak opisu stanowiska w systemie</p>
  return (
    <div className={s.osp}>
      <p className={s.ospTitle}>{osp.title}</p>
      <p>{osp.purpose}</p>
      <h3 className="h-sub">Zadania pracownika</h3>
      <ul className="bullets">
        {osp.mainTasks.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

function AssessmentButton({ profile }: { profile: PersonProfile }) {
  const label = assessmentAction(profile)
  const current = profile.currentCase
  if (current) {
    return (
      <ButtonLink variant="primary" to={caseUrl(current.id, current.currentStage)} className={s.action}>
        {label}
      </ButtonLink>
    )
  }
  // Creating a new case is a separate task: the button is visible but inactive for now.
  return (
    <div className={s.action}>
      <Button variant="primary" disabled aria-describedby="person-action-hint">
        {label}
      </Button>
      <p id="person-action-hint" className={s.hint}>Wkrótce</p>
    </div>
  )
}

function LastAssessment({ history }: { history: HistoryItem[] }) {
  const last = lastCompleted(history)
  if (last) {
    return (
      <InlineAlert tone={last.result === 'POSITIVE' ? 'success' : 'warning'} title={`Ostatnia ocena: ${RESULT_LABEL[last.result].toLowerCase()}`}>
        Podpisana {fmtDate(last.signedByEvaluatorOn)}, zaakceptowana przez ocenianego {fmtDate(last.acknowledgedOn)}.
      </InlineAlert>
    )
  }
  const external = history.find((h) => h.source === 'EXTERNAL')
  if (external?.result) {
    return (
      <InlineAlert tone="info" title={`Ostatnia ocena: ${RESULT_LABEL[external.result].toLowerCase()}`}>
        Z dnia {fmtDate(external.date)}, sporządzona poza systemem. Brak zakończonych ocen w systemie.
      </InlineAlert>
    )
  }
  return <InlineAlert tone="info" title="Brak zakończonych ocen" />
}

const kindOf = (h: HistoryItem) => (h.source === 'EXTERNAL' || h.path === 'PERIODIC' ? 'Ocena okresowa' : 'Pierwsza ocena')

function ResultBadge({ h }: { h: HistoryItem }) {
  if (h.result) return <StatusBadge tone={h.result === 'POSITIVE' ? 'success' : 'error'}>{RESULT_LABEL[h.result]}</StatusBadge>
  if (h.source === 'SYSTEM') return <StatusBadge tone="info">W toku</StatusBadge>
  return <span className="faint">—</span>
}

function HistoryTable({ history, name }: { history: HistoryItem[]; name: string }) {
  if (history.length === 0) return <p>Brak ocen w systemie.</p>
  return (
    <div className={s.tableWrap}>
      <table className={`table ${s.table}`}>
        <caption className="visually-hidden">Historia ocen: {name}, od najnowszej</caption>
        <thead>
          <tr>
            <th scope="col">Rodzaj</th>
            <th scope="col" className={s.wide}>Okres / cykl</th>
            <th scope="col">Wynik</th>
            <th scope="col" className={s.wide}>Poziom</th>
            <th scope="col" className={s.wide}>Podpisano</th>
            <th scope="col" className={s.wide}>Zaakceptowano</th>
            <th scope="col"><span className="visually-hidden">Arkusz</span></th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => {
            const cycle = h.source === 'SYSTEM' ? h.cycleLabel : h.date ? `Ocena z ${fmtDate(h.date)}` : '—'
            const signed = h.source === 'SYSTEM' ? fmtDate(h.signedByEvaluatorOn) : '—'
            const acked = h.source === 'SYSTEM' ? fmtDate(h.acknowledgedOn) : '—'
            return (
              <tr key={h.source === 'SYSTEM' ? h.caseId : 'external'}>
                <th scope="row" className={s.kind}>
                  <span>{kindOf(h)}</span>
                  {h.source === 'EXTERNAL' && <span className={s.meta}>spoza systemu</span>}
                  {/* Below 600px the hidden columns are listed here, under the name. */}
                  <span className={s.narrow}>
                    <span className={s.meta}>{cycle}</span>
                    {h.level && <span className={s.meta}>Poziom: {h.level}</span>}
                    {h.source === 'SYSTEM' && (
                      <span className={s.meta}>Podpisano {signed} · zaakceptowano {acked}</span>
                    )}
                  </span>
                </th>
                <td className={s.wide}>{cycle}</td>
                <td><ResultBadge h={h} /></td>
                <td className={s.wide}>{h.level ?? '—'}</td>
                <td className={`${s.wide} num`}>{signed}</td>
                <td className={`${s.wide} num`}>{acked}</td>
                <td className="cell-action">
                  {h.source === 'SYSTEM' && (
                    <Link to={`/teczka/${h.caseId}/arkusz`} className="btn btn--sm" aria-label={`Zobacz arkusz: ${kindOf(h).toLowerCase()}, ${h.cycleLabel}`}>
                      <FileText size={14} aria-hidden="true" />
                      Zobacz arkusz
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
