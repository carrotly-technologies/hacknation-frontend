import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, Compass, Ellipsis, LogOut, RotateCcw, TableProperties, UserCog, Users } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { resetDemo } from '../api/cases'
import { ApiStatus } from '../components/ApiStatus'
import { UserMenu } from '../components/ui'
import { ROLE_LABEL, useAuth, useMe } from '../lib/useAuth'

export function AppShell() {
  const me = useMe()
  const { signOut } = useAuth()
  const location = useLocation()
  const qc = useQueryClient()

  const onReset = async () => {
    if (!window.confirm('Przywrócić dane demonstracyjne do stanu początkowego?')) return
    try {
      await resetDemo()
    } finally {
      // keep the signed-in user, refetch the rest
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    }
  }

  const userRole = me.position || ROLE_LABEL[me.role]

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Przejdź do treści
      </a>
      <header className="topbar">
        <div className="topbar__brand">
          <Compass className="topbar__logo" size={22} strokeWidth={1.75} aria-hidden="true" />
          <span className="topbar__product">Kompas kompetencji</span>
        </div>
        <div className="topbar__right">
          <UserMenu
            name={me.name}
            role={userRole}
            note={`${ROLE_LABEL[me.role]} · ${officeLabel(me.officeName)}`}
            items={[{ label: 'Wyloguj', icon: <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />, onSelect: () => void signOut() }]}
          />
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

const MORE_PATHS = ['/wiecej', '/uslugi', '/ui', '/wniosek-demo']

const navCls = (active: boolean) => `sidenav__link ${active ? 'is-active' : ''}`

function officeLabel(name: string | undefined) {
  const n = name ?? 'Ministerstwo Cyfryzacji'
  return /demonstr/i.test(n) ? n.replace(/\s*\((dane demonstracyjne)\)/i, ' — $1') : `${n} — dane demonstracyjne`
}
