import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, ChevronDown, Compass, Ellipsis, RotateCcw, TableProperties, UserCog, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { resetDemo } from '../api/cases'
import { errorMessage } from '../api/client'
import { getDemoUsers } from '../api/users'
import { ApiStatus } from '../components/ApiStatus'
import { demoUsersQueryKey, ROLE_LABEL, useAuth, useMe } from '../lib/useAuth'

export function AppShell() {
  const me = useMe()
  const location = useLocation()
  const qc = useQueryClient()

  const onReset = async () => {
    if (!window.confirm('Przywrócić dane demonstracyjne do stanu początkowego?')) return
    try {
      await resetDemo()
    } finally {
      // keep the current account, refetch the rest
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    }
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Przejdź do treści
      </a>
      <header className="topbar">
        <div className="topbar__brand">
          <Compass className="topbar__logo" size={22} strokeWidth={1.75} aria-hidden="true" />
          <span className="topbar__product">Kompas Kompetencji</span>
          <span className="topbar__sep" aria-hidden="true" />
          <span className="topbar__office" title={officeLabel(me.officeName)}>{officeLabel(me.officeName)}</span>
        </div>
        <div className="topbar__right">
          <AccountSwitcher />
        </div>
      </header>

      <nav className="sidenav" aria-label="Nawigacja główna">
        <ul className="sidenav__list">
          {me.role === 'SUPERVISOR' && (
            <li>
              <NavLink to="/zespol" className={({ isActive }) => navCls(isActive || location.pathname.startsWith('/teczka'))}>
                <Users size={20} strokeWidth={1.75} aria-hidden="true" />
                <span title="Mój zespół">Mój zespół</span>
              </NavLink>
            </li>
          )}
          {me.role === 'HR' && (
            <li>
              <NavLink to="/hr" className={({ isActive }) => navCls(isActive)}>
                <TableProperties size={20} strokeWidth={1.75} aria-hidden="true" />
                <span title="Monitoring">Monitoring</span>
              </NavLink>
            </li>
          )}
          {me.role === 'ADMIN' && (
            <li>
              <NavLink to="/admin/uzytkownicy" className={({ isActive }) => navCls(isActive)}>
                <UserCog size={20} strokeWidth={1.75} aria-hidden="true" />
                <span title="Użytkownicy">Użytkownicy</span>
              </NavLink>
            </li>
          )}
          <li>
            <NavLink to="/baza-wiedzy" className={({ isActive }) => navCls(isActive)}>
              <BookOpen size={20} strokeWidth={1.75} aria-hidden="true" />
              <span title="Baza wiedzy">Baza wiedzy</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/wiecej" className={() => navCls(MORE_PATHS.some((p) => location.pathname.startsWith(p)))}>
              <Ellipsis size={20} strokeWidth={1.75} aria-hidden="true" />
              <span title="Więcej">Więcej</span>
            </NavLink>
          </li>
        </ul>
        <div className="sidenav__foot">
          <button type="button" className="sidenav__tool" onClick={onReset} title="Przywróć dane demonstracyjne">
            <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Reset</span>
          </button>
          <ApiStatus />
        </div>
      </nav>

      <main className="main" id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

/** Demo accounts instead of sign-in: pick whose eyes the app shows (X-User-Id). */
function AccountSwitcher() {
  const me = useMe()
  const { switchUser } = useAuth()
  const accounts = useQuery({ queryKey: demoUsersQueryKey, queryFn: ({ signal }) => getDemoUsers(signal) })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = accounts.data ?? []
  const options = list.some((u) => u.id === me.id) ? list : [{ id: me.id, name: me.name, role: me.role }, ...list]

  const onChange = async (id: string) => {
    if (id === me.id) return
    setBusy(true)
    setError(null)
    try {
      await switchUser(id)
    } catch (err) {
      setError(`Nie udało się przełączyć konta: ${errorMessage(err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="topbar__account">
      <label className="topbar__account-label" htmlFor="account-switch">
        Konto demo
      </label>
      <div className="topbar__account-field">
        <select
          id="account-switch"
          className="topbar__account-select"
          value={me.id}
          disabled={busy}
          title={`${me.name} · ${ROLE_LABEL[me.role]} · ${me.position}`}
          aria-describedby={error ? 'account-switch-error' : undefined}
          onFocus={() => void accounts.refetch()}
          onChange={(e) => void onChange(e.target.value)}
        >
          {options.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {ROLE_LABEL[u.role]}
            </option>
          ))}
        </select>
        <ChevronDown className="topbar__account-chevron" size={16} strokeWidth={1.75} aria-hidden="true" />
      </div>
      {error && (
        <span id="account-switch-error" className="topbar__account-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

const MORE_PATHS = ['/wiecej', '/uslugi', '/ui', '/wniosek-demo']

const navCls = (active: boolean) => `sidenav__link ${active ? 'is-active' : ''}`

function officeLabel(name: string | undefined) {
  const n = name ?? 'Ministerstwo Cyfryzacji'
  return /demonstr/i.test(n) ? n.replace(/\s*\((dane demonstracyjne)\)/i, ' — $1') : `${n} — dane demonstracyjne`
}
