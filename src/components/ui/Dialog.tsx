import { X } from 'lucide-react'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import s from './Overlay.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children?: ReactNode
  /** Buttons; put the main action last. */
  actions?: ReactNode
}

/**
 * Modal on native <dialog>: focus trap, Esc and inert background come from the browser. Bottom sheet on phones.
 * Tab and Shift+Tab cycle inside the dialog (the browser alone would let focus leave to its own toolbar).
 * On close (Esc, a button, the backdrop) focus goes back to the control that opened it (WCAG 2.4.3); when that control
 * is gone (e.g. the page changed), to the main area, so focus never drops to the top of the document.
 */
export function Dialog({ open, onClose, title, children, actions }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      d.showModal()
    } else if (!open && d.open) d.close()
  }, [open])
  // closing while unmounting (the page changed under an open dialog) still gives focus back
  useEffect(() => () => restoreFocus(returnTo), [])
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      onClose={() => {
        // the close event is queued: when the dialog was opened again in the meantime, it is stale
        if (ref.current?.open) return
        onClose()
        restoreFocus(returnTo)
      }}
      onKeyDown={(e) => {
        // Esc: close through the state right away (the native close event comes later, and Chrome may skip it after
        // keyboard-only use), so reopening at once works
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        } else trapTab(e, ref.current)
      }}
      onClick={(e) => {
        // click on the backdrop closes the dialog
        if (e.target === ref.current) onClose()
      }}
    >
      <div className={s.dialogInner}>
        <div className={s.dialogHead}>
          <h2 id={titleId} className={s.dialogTitle}>
            {title}
          </h2>
          <button type="button" className={s.dialogClose} onClick={onClose} aria-label="Zamknij">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {children && <div className={s.dialogBody}>{children}</div>}
        {actions && <div className={s.dialogActions}>{actions}</div>}
      </div>
    </dialog>
  )
}

function restoreFocus(returnTo: { current: HTMLElement | null }) {
  const el = returnTo.current
  returnTo.current = null
  if (!el) return
  // after React has re-rendered: the opener may become disabled or be replaced (signing moves to the next step)
  requestAnimationFrame(() => {
    const active = document.activeElement
    if (active && active !== document.body && active.isConnected && !active.closest('dialog')) return
    if (el.isConnected && !el.matches(':disabled')) el.focus()
    else document.getElementById('main')?.focus({ preventScroll: true })
  })
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab inside the dialog: from the last control to the first and back. */
function trapTab(e: KeyboardEvent, dialog: HTMLDialogElement | null) {
  if (e.key !== 'Tab' || !dialog) return
  const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0)
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === dialog)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}
