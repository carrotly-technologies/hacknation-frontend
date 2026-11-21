import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Compass, RotateCcw, TableProperties, Users } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { getMe, resetDemo } from '../api/cases'
import { ApiStatus } from '../components/ApiStatus'
import { useRole, type Role } from '../lib/role'

export function AppShell() {
  const { role, setRole } = useRole()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  // Deep links decide the role: /hr is the HR view, team and case files are the supervisor's.
  useEffect(() => {
    const p = location.pathname
    if (p.startsWith('/hr') && role !== 'HR') setRole('HR')
    else if ((p.startsWith('/zespol') || p.startsWith('/teczka')) && role !== 'SUPERVISOR') setRole('SUPERVISOR')
  }, [location.pathname, role, setRole])

  const me = useQuery({ queryKey: ['me'], queryFn: ({ signal }) => getMe(signal), staleTime: Infinity })

  const switchRole = (r: Role) => {
    if (r === role) return
    setRole(r)
    navigate(r === 'HR' ? '/hr' : '/zespol')
  }

  const onReset = async () => {
    if (!window.confirm('Przywrócić dane demonstracyjne do stanu początkowego?')) return
    try {
      await resetDemo()
    } finally {
      qc.invalidateQueries()
    }
  }

  const userName = role === 'HR' ? 'Agnieszka Lis' : (me.data?.name ?? 'Joanna Kowalczyk')
  const userRole = role === 'HR' ? 'Biuro Dyrektora Generalnego · kadry' : (me.data?.position ?? 'naczelnik wydziału')

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__brand">
          <Compass className="topbar__logo" size={22} strokeWidth={1.75} aria-hidden="true" />
          <span className="topbar__product">Kompas Kompetencji</span>
          <span className="topbar__sep" aria-hidden="true" />
          <span className="topbar__office" title={officeLabel(me.data?.officeName)}>{officeLabel(me.data?.officeName)}</span>
        </div>
        <div className="topbar__right">
          <div className="role-switch" role="radiogroup" aria-label="Rola w systemie">
            {(
              [
                ['SUPERVISOR', 'Przełożony'],
                ['HR', 'Kadry HR'],
              ] as const
            ).map(([r, label]) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                className={`role-switch__opt ${role === r ? 'is-on' : ''}`}
                onClick={() => switchRole(r)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="topbar__user">
            <span className="topbar__user-name" title={userName}>{userName}</span>
            <span className="topbar__user-role" title={userRole}>{userRole}</span>
          </div>
        </div>
      </header>

      <nav className="sidenav" aria-label="Nawigacja główna">
        <ul className="sidenav__list">
          {role === 'SUPERVISOR' ? (
            <li>
              <NavLink to="/zespol" className={({ isActive }) => navCls(isActive || location.pathname.startsWith('/teczka'))}>
                <Users size={20} strokeWidth={1.75} aria-hidden="true" />
                <span title="Mój zespół">Mój zespół</span>
              </NavLink>
            </li>
          ) : (
            <li>
              <NavLink to="/hr" className={({ isActive }) => navCls(isActive)}>
                <TableProperties size={20} strokeWidth={1.75} aria-hidden="true" />
                <span title="Monitoring">Monitoring</span>
              </NavLink>
            </li>
          )}
          <li>
            <NavLink to="/baza-wiedzy" className={({ isActive }) => navCls(isActive)}>
              <BookOpen size={20} strokeWidth={1.75} aria-hidden="true" />
              <span title="Baza wiedzy">Baza wiedzy</span>
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

      <main className="main" id="main">
        <Outlet />
      </main>
    </div>
  )
}

const navCls = (active: boolean) => `sidenav__link ${active ? 'is-active' : ''}`

function officeLabel(name: string | undefined) {
  const n = name ?? 'Ministerstwo Cyfryzacji'
  return /demonstr/i.test(n) ? n.replace(/\s*\((dane demonstracyjne)\)/i, ' — $1') : `${n} — dane demonstracyjne`
}
