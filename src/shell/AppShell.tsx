import { useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  LogOut,
  type LucideIcon,
  Menu,
  RotateCcw,
  Settings,
  TableProperties,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { resetDemo, type Role } from '../api/cases'
import { BrandMark } from '../components/BrandMark'
import { ApiStatus } from '../components/ApiStatus'
import { UserMenu } from '../components/ui'
import { ROLE_LABEL, useAuth, useMe } from '../lib/useAuth'

export function AppShell() {
  const me = useMe()
  const { signOut } = useAuth()
  const location = useLocation()
  const qc = useQueryClient()
  // Below 1024px the links live under a "Menu" button (CSS hides the button on wider screens)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  // Escape closes and returns focus to "Menu"; a click outside the menu (and its button) closes
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      menuBtnRef.current?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !menuBtnRef.current?.contains(t)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])

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
  const settingsActive = isUnder(location.pathname, '/ustawienia')

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Przejdź do treści
      </a>
      <header className="topbar">
        <div className="topbar__brand">
          <BrandMark />
          <span className="topbar__product">Kompas kompetencji</span>
        </div>

        <button
          type="button"
          ref={menuBtnRef}
          className="topbar__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="topbar-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>Menu</span>
        </button>

        <div
          id="topbar-menu"
          ref={menuRef}
          className={`topbar__menu ${menuOpen ? 'is-open' : ''}`}
          // close the menu once a link is chosen
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) setMenuOpen(false)
          }}
        >
          <nav className="topnav" aria-label="Nawigacja główna">
            <ul className="topnav__list">
              {navItems(me.role).map(({ to, label, Icon, match }) => {
                const active = match.some((p) => isUnder(location.pathname, p))
                return (
                  <li key={to}>
                    <Link to={to} className={`topnav__link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  </li>
                )
              })}
              {/* phones only: the gear next to the user menu does not fit there, so settings are a row here */}
              <li className="topnav__settings">
                <Link
                  to="/ustawienia"
                  className={`topnav__link ${settingsActive ? 'is-active' : ''}`}
                  aria-current={settingsActive ? 'page' : undefined}
                >
                  <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span>Ustawienia</span>
                </Link>
              </li>
            </ul>
          </nav>
          <div className="topbar__tools">
            <button type="button" className="topbar__tool" onClick={onReset} title="Przywróć dane demonstracyjne">
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>Reset</span>
            </button>
            <ApiStatus />
          </div>
        </div>

        <div className="topbar__right">
          <Link
            to="/ustawienia"
            className={`topbar__icon-btn ${settingsActive ? 'is-active' : ''}`}
            aria-label="Ustawienia"
            title="Ustawienia"
            aria-current={settingsActive ? 'page' : undefined}
          >
            <Settings size={20} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <UserMenu
            name={me.name}
            role={userRole}
            note={`${ROLE_LABEL[me.role]} · ${officeLabel(me.officeName)}`}
            items={[{ label: 'Wyloguj', icon: <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />, onSelect: () => void signOut() }]}
          />
        </div>
      </header>

      <main className="main" id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

type NavItem = { to: string; label: string; Icon: LucideIcon; match: string[] }

/**
 * Main links for a role; `match` lists the paths that highlight the link (a case file belongs to "Mój zespół").
 * The helper pages (`/wiecej`, `/uslugi`, `/wniosek-demo`, `/ui`) keep their routes but are not linked here;
 * `/ustawienia` is the gear icon next to the user menu (on phones: an item in the "Menu" dropdown).
 */
function navItems(role: Role): NavItem[] {
  const byRole: Partial<Record<Role, NavItem>> = {
    SUPERVISOR: { to: '/zespol', label: 'Mój zespół', Icon: Users, match: ['/zespol', '/teczka'] },
    HR: { to: '/hr', label: 'Monitoring', Icon: TableProperties, match: ['/hr'] },
    ADMIN: { to: '/admin/uzytkownicy', label: 'Użytkownicy', Icon: UserCog, match: ['/admin'] },
  }
  const own = byRole[role]
  return [
    ...(own ? [own] : []),
    { to: '/baza-wiedzy', label: 'Baza wiedzy', Icon: BookOpen, match: ['/baza-wiedzy'] },
  ]
}

/** `path` is `base` or below it (`/teczka/c-001` is under `/teczka`, `/uiX` is not under `/ui`). */
const isUnder = (path: string, base: string) => path === base || path.startsWith(`${base}/`)

function officeLabel(name: string | undefined) {
  const n = name ?? 'Ministerstwo Cyfryzacji'
  return /demonstr/i.test(n) ? n.replace(/\s*\((dane demonstracyjne)\)/i, ' — $1') : `${n} — dane demonstracyjne`
}
