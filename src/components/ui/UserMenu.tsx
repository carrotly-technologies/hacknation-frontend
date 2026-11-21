import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cx } from './cx'
import s from './UserMenu.module.css'

export type UserMenuItem = {
  label: string
  icon?: ReactNode
  onSelect: () => void
}

type Props = {
  name: string
  /** Role or position under the name ("Starsza księgowa"). */
  role: string
  /** Extra line at the top of the menu (e.g. office name). */
  note?: string
  items: UserMenuItem[]
  /** Opens the menu; only for the /ui showcase. */
  defaultOpen?: boolean
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

/**
 * Top-bar user menu: avatar circle, name, role and a chevron. A disclosure button with a list of actions;
 * Esc and a click outside close it and focus returns to the button.
 */
export function UserMenu({ name, role, note, items, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={s.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={s.button}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={s.avatar} aria-hidden="true">
          {initials(name)}
        </span>
        <span className={s.who}>
          <span className={s.name}>{name}</span>
          <span className={s.role}>{role}</span>
        </span>
        <span className="visually-hidden">, menu użytkownika</span>
        <ChevronDown className={cx(s.chevron, open && s.chevronOpen)} size={18} aria-hidden="true" />
      </button>
      <div id={menuId} className={s.panel} hidden={!open}>
        <div className={s.panelHead}>
          <p className={s.panelName}>{name}</p>
          <p className={s.panelRole}>{role}</p>
          {note && <p className={s.panelNote}>{note}</p>}
        </div>
        <ul className={s.items}>
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                className={s.item}
                onClick={() => {
                  setOpen(false)
                  it.onSelect()
                }}
              >
                {it.icon}
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
