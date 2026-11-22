import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { getUsers } from '../api/auth'
import { getAudit, getAuditActions, verifyAudit, type AuditEntry, type AuditResult } from '../api/audit'
import { errorMessage } from '../api/client'
import { ErrorState, LoadingState } from '../components/QueryState'
import { Button, InlineAlert, PageLayout, StatusBadge } from '../components/ui'
import { countLabel } from '../lib/format'
import { ROLE_LABEL } from '../lib/useAuth'

const PAGE_SIZE = 50

const RESULT: Record<AuditResult, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  OK: { label: 'Wykonano', tone: 'success' },
  DENIED: { label: 'Odmowa dostępu', tone: 'warning' },
  ERROR: { label: 'Odrzucono', tone: 'error' },
}

/** 2026-11-21T09:05:03Z → 21.11.2026, 10:05:03 (local time of the browser). */
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** A local day (yyyy-mm-dd from a date input) as an ISO timestamp of its first or last millisecond. */
function dayBound(day: string, end: boolean): string | undefined {
  if (!day) return undefined
  return new Date(`${day}T${end ? '23:59:59.999' : '00:00:00.000'}`).toISOString()
}

function Actor({ entry }: { entry: AuditEntry }) {
  if (entry.actorRole === 'ASSESSED_VIA_LINK') {
    return <span>Oceniany <span className="person__meta">przez link do zapoznania</span></span>
  }
  if (!entry.actorId) {
    return <span className="faint">{entry.action === 'LOGIN_FAILED' ? 'Niezalogowany' : '—'}</span>
  }
  return (
    <div className="person">
      <span className="person__name">{entry.actorName ?? entry.actorId}</span>
      {entry.actorRole && <span className="person__meta">{ROLE_LABEL[entry.actorRole]}</span>}
    </div>
  )
}

/** ADMIN: the append-only event log (who, what, when) with filters, pages and the integrity check. */
export function AdminAuditPage() {
  const [actorId, setActorId] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const filters = { actorId, action, from: dayBound(from, false), to: dayBound(to, true), page, pageSize: PAGE_SIZE }
  const log = useQuery({
    queryKey: ['admin', 'audit', filters],
    queryFn: ({ signal }) => getAudit(filters, signal),
    placeholderData: keepPreviousData,
  })
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: ({ signal }) => getUsers(signal) })
  const actions = useQuery({ queryKey: ['admin', 'audit', 'actions'], queryFn: ({ signal }) => getAuditActions(signal), staleTime: Infinity })
  const verify = useMutation({ mutationFn: verifyAudit })

  const setFilter = (set: (v: string) => void) => (v: string) => {
    set(v)
    setPage(1)
  }
  const filtered = Boolean(actorId || action || from || to)

  if (log.isPending) return <PageLayout><LoadingState /></PageLayout>
  if (log.isError) return <PageLayout><ErrorState error={log.error} what="dziennik zdarzeń" onRetry={() => log.refetch()} /></PageLayout>

  const { items, total } = log.data
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <PageLayout
      title="Dziennik zdarzeń"
      meta="Kto, co i kiedy zmienił w systemie · wpisów nie da się zmienić ani usunąć"
      actions={
        <Button variant="secondary" icon={<ShieldCheck size={18} aria-hidden="true" />} loading={verify.isPending} onClick={() => verify.mutate()}>
          Sprawdź integralność
        </Button>
      }
    >
      {verify.isError && (
        <InlineAlert tone="error" live title="Nie udało się sprawdzić dziennika">
          {errorMessage(verify.error)}
        </InlineAlert>
      )}
      {verify.data?.ok === true && (
        <InlineAlert tone="success" live title="Dziennik jest nienaruszony">
          Sprawdzono {countLabel(verify.data.count, 'wpis', 'wpisy', 'wpisów')}: żaden wpis nie został zmieniony, usunięty ani przestawiony.
        </InlineAlert>
      )}
      {verify.data?.ok === false && (
        <InlineAlert tone="error" live title="Dziennik został naruszony">
          Pierwszy niezgodny wpis: <code>{verify.data.firstBrokenId}</code> (wpis nr {verify.data.count + 1}). Ten wpis został
          zmieniony albo wpis przed nim został usunięty poza aplikacją. Zabezpiecz kopię bazy danych i zgłoś to
          inspektorowi ochrony danych.
        </InlineAlert>
      )}

      <section aria-labelledby="audit-h">
        <h2 id="audit-h" className="visually-hidden">Wpisy dziennika</h2>
        <div className="filters">
          <select className="select" style={{ width: 260 }} value={actorId} onChange={(e) => setFilter(setActorId)(e.target.value)} aria-label="Osoba">
            <option value="">Wszystkie osoby</option>
            {(users.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({ROLE_LABEL[u.role]})</option>
            ))}
          </select>
          <select className="select" style={{ width: 300 }} value={action} onChange={(e) => setFilter(setAction)(e.target.value)} aria-label="Akcja">
            <option value="">Wszystkie akcje</option>
            <option value="CASE_ACTION">Wszystkie akcje w ocenie</option>
            {(actions.data ?? []).map((a) => (
              <option key={a.action} value={a.action}>{a.label}</option>
            ))}
          </select>
          <label className="small">
            Od{' '}
            <input type="date" className="input" style={{ width: 170 }} value={from} max={to || undefined} onChange={(e) => setFilter(setFrom)(e.target.value)} />
          </label>
          <label className="small">
            Do{' '}
            <input type="date" className="input" style={{ width: 170 }} value={to} min={from || undefined} onChange={(e) => setFilter(setTo)(e.target.value)} />
          </label>
          <span className="faint small" aria-live="polite">{countLabel(total, 'wpis', 'wpisy', 'wpisów')}</span>
          {filtered && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => { setActorId(''); setAction(''); setFrom(''); setTo(''); setPage(1) }}
            >
              Wyczyść filtry
            </button>
          )}
        </div>

        <div className="panel">
          <table className="table hr-table">
            <thead>
              <tr>
                <th>Data i godzina</th>
                <th>Kto</th>
                <th>Akcja</th>
                <th>Zasób</th>
                <th>Wynik</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={5} className="muted">{filtered ? 'Brak wpisów spełniających filtry.' : 'Dziennik jest pusty.'}</td></tr>
              )}
              {items.map((e) => (
                <tr key={e.id}>
                  <td className="num">
                    <div>{fmtDateTime(e.at)}</div>
                    {e.ip && <div className="cell-sub faint">IP {e.ip}</div>}
                  </td>
                  <td><Actor entry={e} /></td>
                  <td>
                    <div>{e.actionLabel}</div>
                    {e.changedFields.length > 0 && (
                      <div className="cell-sub faint" title="Nazwy pól, bez ich treści">Pola: {e.changedFields.join(', ')}</div>
                    )}
                  </td>
                  <td>
                    {e.resourceTypeLabel ?? <span className="faint">—</span>}
                    {e.resourceId && <div className="cell-sub faint num">{e.resourceId}</div>}
                  </td>
                  <td><StatusBadge tone={RESULT[e.result].tone}>{RESULT[e.result].label}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <nav className="filters" aria-label="Strony dziennika" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <Button variant="tertiary" size="small" icon={<ChevronLeft size={16} aria-hidden="true" />} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Nowsze
          </Button>
          <span className="small">Strona {page} z {pages}</span>
          <Button variant="tertiary" size="small" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Starsze <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </nav>
        <p className="faint small" style={{ marginTop: 12 }}>
          Dziennik zapisuje każdą zmianę danych i każde logowanie: kto (konto i rola), co (akcja i nazwy zmienionych
          pól, bez ich treści), kiedy i z jakiego adresu IP. Odczyty nie są zapisywane. Każdy wpis zawiera skrót
          poprzedniego, więc zmiana lub usunięcie wpisu wychodzi przy sprawdzeniu integralności.
        </p>
      </section>
    </PageLayout>
  )
}
