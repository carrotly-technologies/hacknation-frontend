import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { getHrOverview, sendReminders, type HrCase, type HrOverview, type ReminderResponse } from '../api/cases'
import { DeadlineText } from '../components/Deadline'
import { ErrorState, LoadingState } from '../components/QueryState'
import { PageLayout, StatusBadge } from '../components/ui'
import { StageDots } from '../components/StageDots'
import { countLabel, DEMO_TODAY, fmtDate } from '../lib/format'
import { caseUrl, CASE_STATUS_LABEL, STAGE_SHORT } from '../lib/stages'
import { MutationError } from '../case/stages/common'

type CounterKey = keyof HrOverview['counters'] | 'all'

const COUNTERS: { key: CounterKey; label: string; tone?: string }[] = [
  { key: 'inProgress', label: 'W toku' },
  { key: 'dueSoon', label: 'Termin ≤ 14 dni', tone: 'warn' },
  { key: 'overdue', label: 'Po terminie', tone: 'danger' },
  { key: 'awaitingAck', label: 'Oczekuje na zapoznanie' },
  { key: 'objectionPeriod', label: 'W okresie sprzeciwu' },
]

function matches(c: HrCase, k: CounterKey) {
  switch (k) {
    case 'all': return true
    case 'inProgress': return c.status === 'W_TOKU'
    case 'dueSoon': return c.nextDeadline?.state === 'SOON'
    case 'overdue': return c.nextDeadline?.state === 'OVERDUE'
    case 'awaitingAck': return c.status === 'DO_ZAPOZNANIA'
    case 'objectionPeriod': return c.status === 'OKRES_SPRZECIWU'
  }
}

const deptOf = (unit: string) => unit.split(',')[0]

export function HrPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  // A click anywhere in the row opens the case read-only, like the name link; not on the reminder button or when selecting text.
  const openRow = (e: MouseEvent<HTMLTableRowElement>, id: string) => {
    if ((e.target as HTMLElement).closest('a, button') || window.getSelection()?.toString()) return
    navigate(caseUrl(id))
  }
  const q = useQuery({ queryKey: ['hr'], queryFn: ({ signal }) => getHrOverview(signal) })
  const [counter, setCounter] = useState<CounterKey>('all')
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [path, setPath] = useState('')
  const [log, setLog] = useState<ReminderResponse['log']>([])
  const remind = useMutation({
    mutationFn: (ids: string[]) => sendReminders(ids),
    onSuccess: (r) => {
      setLog((l) => [...r.log, ...l])
      qc.invalidateQueries({ queryKey: ['hr'] })
    },
  })

  const cases = q.data?.cases
  const depts = useMemo(() => [...new Set((cases ?? []).map((c) => deptOf(c.person.unit)))].sort(), [cases])

  if (q.isPending) return <PageLayout><LoadingState /></PageLayout>
  if (q.isError) return <PageLayout><ErrorState error={q.error} what="monitoring ocen" onRetry={() => q.refetch()} /></PageLayout>

  const { counters } = q.data
  const rows = q.data.cases
    .filter((c) => matches(c, counter))
    .filter((c) => !dept || deptOf(c.person.unit) === dept)
    .filter((c) => !path || c.path === path)
    .filter((c) => !search || `${c.person.firstName} ${c.person.lastName} ${c.evaluatorName}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.nextDeadline?.date ?? '9999').localeCompare(b.nextDeadline?.date ?? '9999'))
  const soonIds = q.data.cases.filter((c) => c.nextDeadline && (c.nextDeadline.state === 'SOON' || c.nextDeadline.state === 'OVERDUE')).map((c) => c.id)

  return (
    <PageLayout
      title="Monitoring ocen"
      meta={`Wszystkie procesy ocen w urzędzie · stan na ${fmtDate(DEMO_TODAY)}`}
      actions={
        <button type="button" className="btn btn--primary" disabled={soonIds.length === 0 || remind.isPending} onClick={() => remind.mutate(soonIds)}>
          <Bell size={15} aria-hidden="true" /> Przypomnij wszystkim z terminem ≤ 14 dni ({soonIds.length})
        </button>
      }
    >
      <div className="counters" role="group" aria-label="Filtr według stanu">
        {COUNTERS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`counter ${counter === c.key ? 'is-on' : ''} ${c.tone ? `counter--${c.tone}` : ''}`}
            aria-pressed={counter === c.key}
            onClick={() => setCounter(counter === c.key ? 'all' : c.key)}
          >
            <span className="counter__n num">{counters[c.key as keyof HrOverview['counters']]}</span>
            <span className="counter__l" title={c.label}>{c.label}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="filters">
          <input type="search" className="input" style={{ width: 240 }} placeholder="Szukaj pracownika lub oceniającego" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Szukaj" />
          <select className="select" style={{ width: 260 }} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Komórka">
            <option value="">Wszystkie komórki</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="select" style={{ width: 180 }} value={path} onChange={(e) => setPath(e.target.value)} aria-label="Rodzaj oceny">
            <option value="">Każdy rodzaj oceny</option>
            <option value="PERIODIC">Ocena okresowa</option>
            <option value="FIRST">Pierwsza ocena</option>
          </select>
          <span className="faint small">{countLabel(rows.length, 'proces', 'procesy', 'procesów')}</span>
          {(counter !== 'all' || dept || path || search) && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setCounter('all'); setDept(''); setPath(''); setSearch('') }}>
              Wyczyść filtry
            </button>
          )}
        </div>

        <div className="panel">
          <table className="table hr-table">
            <thead>
              <tr>
                <th>Pracownik</th>
                <th>Komórka</th>
                <th>Oceniający</th>
                <th>Rodzaj</th>
                <th>Etap</th>
                <th>Termin</th>
                <th>Status</th>
                <th>Przypomnienie</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="muted">Brak procesów spełniających filtry.</td></tr>
              )}
              {rows.map((c) => {
                const sentToday = c.lastReminderOn === DEMO_TODAY
                return (
                  <tr key={c.id} className="hr-row" onClick={(e) => openRow(e, c.id)}>
                    <td>
                      <div className="person">
                        <Link to={caseUrl(c.id)} className="person__name" title={`Otwórz teczkę (podgląd): ${c.person.firstName} ${c.person.lastName}`}>
                          {c.person.firstName} {c.person.lastName}
                        </Link>
                        <span className="person__meta" title={c.person.position}>{c.person.position}</span>
                      </div>
                    </td>
                    <td className="cell-unit" title={c.person.unit}>{deptOf(c.person.unit)}</td>
                    <td title={c.evaluatorName}>{c.evaluatorName}</td>
                    <td>{c.path === 'FIRST' ? 'Pierwsza' : `Okresowa · ${c.sheetId ?? '—'}`}</td>
                    <td>
                      <div className="stage-cell">
                        <StageDots stages={c.stages} />
                        <span className="stage-cell__name" title={STAGE_SHORT[c.currentStage]}>{STAGE_SHORT[c.currentStage]}</span>
                      </div>
                    </td>
                    <td>{c.nextDeadline ? <DeadlineText deadline={c.nextDeadline} /> : <span className="faint">—</span>}</td>
                    <td>
                      <span title={CASE_STATUS_LABEL[c.status]} className={`tag ${c.status === 'OKRES_SPRZECIWU' || c.status === 'DO_ZAPOZNANIA' ? 'tag--accent' : ''}`}>{CASE_STATUS_LABEL[c.status]}</span>
                      {c.objectionSubmittedOn && (
                        <span className="cell-sub" title={`Oceniany wniósł sprzeciw ${fmtDate(c.objectionSubmittedOn)}`}>
                          <StatusBadge tone="warning">Sprzeciw</StatusBadge>
                        </span>
                      )}
                    </td>
                    <td className="cell-action">
                      <button type="button" className="btn btn--sm" disabled={sentToday || remind.isPending} onClick={() => remind.mutate([c.id])}>
                        {sentToday ? 'Wysłano dziś' : 'Wyślij przypomnienie'}
                      </button>
                      {c.lastReminderOn && !sentToday && <span className="cell-sub num">ostatnio {fmtDate(c.lastReminderOn)}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <MutationError error={remind.error} />
      </div>

      {log.length > 0 && (
        <section aria-labelledby="log-h">
          <div className="section__head">
            <h2 id="log-h" className="h-section">Wysłane przypomnienia</h2>
            <span className="faint small" title="Symulacja — docelowo e-mail lub zadanie w EZD">Symulacja — docelowo e-mail lub zadanie w EZD</span>
          </div>
          <ul className="log panel">
            {log.map((l, i) => (
              <li key={i} title={`${fmtDate(l.date)} ${l.text}`}>
                <Bell className="log__icon" size={16} aria-hidden="true" />
                <span className="num faint">{fmtDate(l.date)}</span>
                <span className="log__text">{l.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageLayout>
  )
}
