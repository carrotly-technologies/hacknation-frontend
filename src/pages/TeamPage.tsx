import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { getMe, getTeam, type CaseSummary } from '../api/cases'
import { DeadlineText } from '../components/Deadline'
import { ErrorState, LoadingState } from '../components/QueryState'
import { StageDots } from '../components/StageDots'
import { countLabel } from '../lib/format'
import { caseUrl, CASE_STATUS_LABEL, STAGE_SHORT } from '../lib/stages'

export function TeamPage() {
  const navigate = useNavigate()
  const team = useQuery({ queryKey: ['team'], queryFn: ({ signal }) => getTeam(signal) })
  const me = useQuery({ queryKey: ['me'], queryFn: ({ signal }) => getMe(signal), staleTime: Infinity })

  if (team.isPending) return <div className="page"><LoadingState /></div>
  if (team.isError) return <div className="page"><ErrorState error={team.error} what="lista zespołu" onRetry={() => team.refetch()} /></div>

  const { cases } = team.data

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h-page">Mój zespół</h1>
          <p className="page-head__meta" title={me.data?.unit ?? 'Wydział'}>{me.data?.unit ?? 'Wydział'}</p>
        </div>
      </header>

      <section className="section" aria-labelledby="team-h">
        <div className="section__head">
          <h2 id="team-h" className="h-section">Pracownicy</h2>
          <span className="faint small">{countLabel(cases.length, 'osoba', 'osoby', 'osób')}</span>
        </div>
        <div className="panel">
          <table className="table team-table">
            <thead>
              <tr>
                <th>Pracownik</th>
                <th>Rodzaj oceny</th>
                <th>Etap</th>
                <th>Najbliższy termin</th>
                <th>Status</th>
                <th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <TeamRow key={c.id} c={c} onOpen={() => navigate(caseUrl(c.id))} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function TeamRow({ c, onOpen }: { c: CaseSummary; onOpen: () => void }) {
  const current = c.stages.find((s) => s.id === c.currentStage)
  const idx = c.stages.findIndex((s) => s.id === c.currentStage)
  const sheet = c.path === 'FIRST' ? 'arkusz pierwszej oceny' : c.sheetId ? `arkusz ${c.sheetId}` : 'arkusz do ustalenia'
  const stageName = current ? STAGE_SHORT[current.id] : '—'
  return (
    <tr className="is-link" onClick={onOpen}>
      <td>
        <div className="person">
          <span className="person__name" title={`${c.person.firstName} ${c.person.lastName}`}>
            {c.person.firstName} {c.person.lastName}
          </span>
          <span className="person__meta" title={c.person.position}>{c.person.position}</span>
        </div>
      </td>
      <td>
        <div className="person">
          <span>{c.path === 'FIRST' ? 'Pierwsza ocena' : 'Ocena okresowa'}</span>
          <span className="person__meta">{sheet}</span>
        </div>
      </td>
      <td>
        <div className="stage-cell">
          <StageDots stages={c.stages} />
          <span className="stage-cell__name" title={`${idx + 1}/${c.stages.length} ${stageName}`}>
            <span className="faint num">{idx + 1}/{c.stages.length}</span> {stageName}
          </span>
        </div>
      </td>
      <td>
        {c.nextDeadline ? (
          <div className="person">
            <DeadlineText deadline={c.nextDeadline} />
            <span className="person__meta" title={c.nextDeadline.label}>{c.nextDeadline.label.replace(/ do$/, '')}</span>
          </div>
        ) : (
          <span className="faint">—</span>
        )}
      </td>
      <td>
        <span title={CASE_STATUS_LABEL[c.status]} className={`tag ${c.status === 'OKRES_SPRZECIWU' || c.status === 'DO_ZAPOZNANIA' ? 'tag--accent' : ''}`}>{CASE_STATUS_LABEL[c.status]}</span>
      </td>
      <td className="cell-action">
        <Link to={caseUrl(c.id)} className="btn btn--sm" aria-label={`Otwórz teczkę: ${c.person.firstName} ${c.person.lastName}`} onClick={(e) => e.stopPropagation()}>
          Otwórz <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </td>
    </tr>
  )
}
