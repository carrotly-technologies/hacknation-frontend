import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { LogOut, RefreshCw } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ApiError, errorMessage } from '../api/client'
import { getSession, getSessions, type RequestLogEntry, type SessionSummary } from '../api/monitor'
import { BrandMark } from '../components/BrandMark'
import { BackLink, Button, EmptyState, Field, InfoList, InfoRow, InlineAlert, Spinner, StatusBadge, TextInput } from '../components/ui'
import { getMonitorToken, setMonitorToken } from '../lib/activity'
import { countLabel } from '../lib/format'
import { describeUserAgent } from '../lib/userAgent'
import s from './ActivityPage.module.css'

/** The list and the open session refresh themselves this often. */
const REFRESH_MS = 10_000
const PAGE_SIZE = 50

/** Filters live in the URL, so "Powrót do listy" from a session keeps them. */
const FILTER_KEYS = { from: 'od', to: 'do', ip: 'ip', user: 'konto', page: 'strona', session: 'sesja' } as const

/**
 * /aktywnosc: the team's view of the activity log (hacknation-backend#75). Public route outside the app shell, not
 * linked anywhere; the API opens it only with MONITOR_TOKEN, kept in sessionStorage for this tab.
 */
export function ActivityPage() {
  const [token, setToken] = useState(getMonitorToken)
  const [rejected, setRejected] = useState(false)
  const [params] = useSearchParams()
  const sessionId = params.get(FILTER_KEYS.session)

  const save = (value: string | null) => {
    setMonitorToken(value)
    setToken(value)
  }
  const reject = () => {
    save(null)
    setRejected(true)
  }

  let body
  if (!token) {
    body = (
      <TokenForm
        rejected={rejected}
        onSubmit={(t) => {
          setRejected(false)
          save(t)
        }}
      />
    )
  } else if (sessionId) {
    body = <SessionView token={token} sessionId={sessionId} onRejected={reject} />
  } else {
    body = <SessionList token={token} onRejected={reject} />
  }

  return (
    <main className={s.root} id="main">
      <div className={s.inner}>
        <div className={s.top}>
          <div className={s.brand}>
            <BrandMark />
            <span>Kompas Kompetencji · aktywność</span>
          </div>
          {token && (
            <Button variant="text" size="small" icon={<LogOut size={18} aria-hidden="true" />} onClick={() => save(null)}>
              Zamknij podgląd
            </Button>
          )}
        </div>
        {body}
      </div>
    </main>
  )
}

/** 404 from the monitor = no such route for this token (wrong token or MONITOR_TOKEN not set on the server). */
const isRejected = (err: unknown) => err instanceof ApiError && err.status === 404

function TokenForm({ rejected, onSubmit }: { rejected: boolean; onSubmit: (token: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      setError('Wpisz token podglądu')
      return
    }
    onSubmit(value.trim())
  }
  return (
    <section className={s.card} aria-labelledby="token-h">
      <h1 className={s.h1} id="token-h">
        Aktywność użytkowników
      </h1>
      <p className={s.lead}>
        Podgląd sesji: kto, skąd i co robił w aplikacji. Dostęp tylko z tokenem ustawionym na serwerze (zmienna
        MONITOR_TOKEN); konta aplikacji go nie dają.
      </p>
      {rejected && (
        <InlineAlert tone="error" live title="Token nie pasuje" className={s.alert}>
          Sprawdź token albo czy podgląd jest włączony na serwerze (MONITOR_TOKEN).
        </InlineAlert>
      )}
      <form className={s.form} noValidate onSubmit={submit}>
        <Field id="monitor-token" label="Token podglądu" hint="Token jest zapamiętany tylko w tej karcie przeglądarki." error={error}>
          {(p) => (
            <TextInput
              {...p}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(undefined)
              }}
            />
          )}
        </Field>
        <Button type="submit">Pokaż aktywność</Button>
      </form>
    </section>
  )
}

function SessionList({ token, onRejected }: { token: string; onRejected: () => void }) {
  const [params, setParams] = useSearchParams()
  const from = params.get(FILTER_KEYS.from) ?? ''
  const to = params.get(FILTER_KEYS.to) ?? ''
  const ip = params.get(FILTER_KEYS.ip) ?? ''
  const user = params.get(FILTER_KEYS.user) ?? ''
  const page = Math.max(1, Number(params.get(FILTER_KEYS.page)) || 1)

  const setFilter = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== FILTER_KEYS.page) next.delete(FILTER_KEYS.page)
        return next
      },
      { replace: true },
    )

  const q = useQuery({
    queryKey: ['monitor', 'sessions', token, from, to, ip, user, page],
    queryFn: ({ signal }) => getSessions(token, { from, to, ip, userId: user, page, pageSize: PAGE_SIZE }, signal),
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
    retry: (count, err) => !isRejected(err) && count < 1,
  })

  const rejected = q.isError && isRejected(q.error)
  useEffect(() => {
    if (rejected) onRejected()
  }, [rejected, onRejected])
  if (rejected) return null

  const filtered = Boolean(from || to || ip || user)
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.pageSize)) : 1
  const sessionLink = (id: string) => {
    const next = new URLSearchParams(params)
    next.set(FILTER_KEYS.session, id)
    return `?${next}`
  }

  return (
    <>
      <header className={s.head}>
        <div>
          <h1 className={s.h1}>Aktywność użytkowników</h1>
          <p className={s.lead}>
            Sesje (jedna karta przeglądarki), najnowsza aktywność na górze. <RefreshInfo updatedAt={q.dataUpdatedAt} fetching={q.isFetching} />
          </p>
        </div>
      </header>

      <form className={s.filters} role="search" aria-label="Filtry sesji" onSubmit={(e) => e.preventDefault()}>
        <Field id="f-from" label="Od dnia">
          {(p) => <TextInput {...p} type="date" value={from} onChange={(e) => setFilter(FILTER_KEYS.from, e.target.value)} />}
        </Field>
        <Field id="f-to" label="Do dnia">
          {(p) => <TextInput {...p} type="date" value={to} onChange={(e) => setFilter(FILTER_KEYS.to, e.target.value)} />}
        </Field>
        <Field id="f-ip" label="Adres IP" hint="Wystarczy fragment.">
          {(p) => <TextInput {...p} inputMode="decimal" value={ip} onChange={(e) => setFilter(FILTER_KEYS.ip, e.target.value)} />}
        </Field>
        <Field id="f-user" label="Konto" hint="Fragment loginu.">
          {(p) => <TextInput {...p} autoCapitalize="none" spellCheck={false} value={user} onChange={(e) => setFilter(FILTER_KEYS.user, e.target.value)} />}
        </Field>
        {filtered && (
          <Button
            variant="text"
            size="small"
            className={s.clear}
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
          >
            Wyczyść filtry
          </Button>
        )}
      </form>

      {q.isPending ? (
        <div className={s.loading}>
          <Spinner label="Wczytywanie sesji" />
        </div>
      ) : q.isError ? (
        <InlineAlert tone="error" title="Nie udało się wczytać sesji">
          {errorMessage(q.error)}
        </InlineAlert>
      ) : q.data.items.length === 0 ? (
        <EmptyState title={filtered ? 'Brak sesji spełniających filtry' : 'Nikt jeszcze nie korzystał z aplikacji'}>
          {filtered ? 'Zmień albo wyczyść filtry.' : 'Sesje pojawią się tu po pierwszym wejściu do aplikacji.'}
        </EmptyState>
      ) : (
        <>
          <p className="faint small" aria-live="polite">
            {sessionCount(q.data.total)}
            {pages > 1 && ` · strona ${q.data.page} z ${pages}`}
          </p>
          <div className="panel">
            <table className={`table ${s.table}`}>
              <caption className="visually-hidden">Sesje użytkowników</caption>
              <thead>
                <tr>
                  <th scope="col">Konto</th>
                  <th scope="col">Adres IP</th>
                  <th scope="col">Przeglądarka</th>
                  <th scope="col">Pierwsza aktywność</th>
                  <th scope="col">Ostatnia aktywność</th>
                  <th scope="col">Akcje</th>
                  <th scope="col">
                    <span className="visually-hidden">Szczegóły</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {q.data.items.map((session) => (
                  <tr key={session.sessionId}>
                    <td>
                      <Accounts session={session} />
                    </td>
                    <td className="num">{session.ips.join(', ') || '—'}</td>
                    <td title={session.userAgent ?? undefined}>{describeUserAgent(session.userAgent)}</td>
                    <td className="num">{fmtDateTime(session.firstAt)}</td>
                    <td className="num">{fmtDateTime(session.lastAt)}</td>
                    <td>
                      <Counts session={session} />
                    </td>
                    <td>
                      <Link to={sessionLink(session.sessionId)} className={s.open}>
                        Oś czasu<span className="visually-hidden"> sesji {accountsText(session)}</span> ›
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className={s.pager} aria-label="Strony listy sesji">
              <Button variant="secondary" size="small" disabled={page <= 1} onClick={() => setFilter(FILTER_KEYS.page, String(page - 1))}>
                Poprzednia strona
              </Button>
              <Button variant="secondary" size="small" disabled={page >= pages} onClick={() => setFilter(FILTER_KEYS.page, String(page + 1))}>
                Następna strona
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  )
}

function SessionView({ token, sessionId, onRejected }: { token: string; sessionId: string; onRejected: () => void }) {
  const [params] = useSearchParams()
  const back = new URLSearchParams(params)
  back.delete(FILTER_KEYS.session)
  const backLink = <BackLink to={`?${back}`}>Powrót do listy sesji</BackLink>

  const q = useQuery({
    queryKey: ['monitor', 'session', token, sessionId],
    queryFn: ({ signal }) => getSession(token, sessionId, signal),
    refetchInterval: REFRESH_MS,
    retry: (count, err) => !isRejected(err) && count < 1,
  })

  if (q.isPending)
    return (
      <>
        {backLink}
        <div className={s.loading}>
          <Spinner label="Wczytywanie sesji" />
        </div>
      </>
    )
  if (q.isError) {
    if (isRejected(q.error))
      return (
        <>
          {backLink}
          <InlineAlert tone="warning" title="Nie ma takiej sesji">
            Wpisy sesji mogły zostać usunięte (po 30 dniach) albo token przestał pasować.{' '}
            <button type="button" className={s.linkButton} onClick={onRejected}>
              Wpisz token ponownie
            </button>
          </InlineAlert>
        </>
      )
    return (
      <>
        {backLink}
        <InlineAlert tone="error" title="Nie udało się wczytać sesji">
          {errorMessage(q.error)}
        </InlineAlert>
      </>
    )
  }

  const { session, entries } = q.data
  return (
    <>
      {backLink}
      <header className={s.head}>
        <div>
          <h1 className={s.h1}>Sesja: {accountsText(session)}</h1>
          <p className={s.lead}>
            {fmtDateTime(session.firstAt)} – {fmtTime(session.lastAt)}. <RefreshInfo updatedAt={q.dataUpdatedAt} fetching={q.isFetching} />
          </p>
        </div>
      </header>

      <section className={s.card} aria-label="Podsumowanie sesji">
        <InfoList>
          <InfoRow label="Konto" value={<Accounts session={session} />} />
          <InfoRow label="Adres IP" value={session.ips.join(', ') || '—'} />
          <InfoRow
            label="Przeglądarka"
            value={
              <>
                {describeUserAgent(session.userAgent)}
                {session.userAgent && <span className={s.raw}>{session.userAgent}</span>}
              </>
            }
          />
          <InfoRow label="Akcje" value={<Counts session={session} />} />
          <InfoRow label="Identyfikator sesji" value={<span className={s.raw}>{session.sessionId}</span>} />
        </InfoList>
      </section>

      <section aria-labelledby="timeline-h">
        <h2 className={s.h2} id="timeline-h">
          Oś czasu
        </h2>
        <ol className={s.timeline}>
          {entries.map((e) => (
            <TimelineItem key={e.id} entry={e} />
          ))}
        </ol>
      </section>
    </>
  )
}

function TimelineItem({ entry }: { entry: RequestLogEntry }) {
  const page = entry.kind === 'PAGEVIEW'
  return (
    <li className={page ? `${s.event} ${s.pageview}` : s.event}>
      <time className={`${s.time} num`} dateTime={entry.at} title={fmtDateTime(entry.at)}>
        {fmtTime(entry.at)}
      </time>
      <span className={s.kind}>{page ? 'Strona' : 'API'}</span>
      <span className={s.what}>
        {entry.method && <span className={s.method}>{entry.method}</span>}
        <span className={s.path}>{entry.path}</span>
        {entry.userName && <span className="faint small"> · {entry.userName}</span>}
      </span>
      <span className={s.result}>
        {entry.status !== null && <StatusBadge tone={statusTone(entry.status)}>{entry.status}</StatusBadge>}
        {entry.durationMs !== null && <span className="faint small num">{entry.durationMs} ms</span>}
      </span>
    </li>
  )
}

function Accounts({ session }: { session: SessionSummary }) {
  if (session.users.length === 0) return <span className="faint">{session.anonymous ? 'bez sesji, niezalogowany' : 'niezalogowany'}</span>
  return <>{session.users.map((u) => u.name ?? u.id).join(', ')}</>
}

function Counts({ session }: { session: SessionSummary }) {
  return (
    <span className={s.counts}>
      <span className="num">{countLabel(session.pageviews, 'strona', 'strony', 'stron')}</span>
      <span className="num">{session.apiCalls} API</span>
      {session.errors > 0 && (
        <StatusBadge tone="error">{countLabel(session.errors, 'błąd', 'błędy', 'błędów')}</StatusBadge>
      )}
    </span>
  )
}

function RefreshInfo({ updatedAt, fetching }: { updatedAt: number; fetching: boolean }) {
  return (
    <span className={s.refresh}>
      <RefreshCw size={14} aria-hidden="true" className={fetching ? s.spin : undefined} />
      Odświeżane co 10 s{updatedAt ? `, ostatnio ${fmtTime(new Date(updatedAt).toISOString())}` : ''}.
    </span>
  )
}

const accountsText = (session: SessionSummary) =>
  session.users.length ? session.users.map((u) => u.name ?? u.id).join(', ') : 'niezalogowany'

/** 2xx/3xx neutral, 4xx warning, 5xx error; the number is always shown, so colour is not the only cue. */
function statusTone(status: number): 'neutral' | 'success' | 'warning' | 'error' {
  if (status >= 500) return 'error'
  if (status >= 400) return 'warning'
  return 'success'
}

const sessionCount = (n: number) => countLabel(n, 'sesja', 'sesje', 'sesji')

/** Local time of the viewer: 22.11.2026, 10:15:03 */
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
