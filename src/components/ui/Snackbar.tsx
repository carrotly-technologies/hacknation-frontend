import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cx } from './cx'
import s from './Feedback.module.css'

type Props = {
  open: boolean
  message: string
  onClose: () => void
  action?: { label: string; onClick: () => void }
  /** ms; 0 keeps it until closed. Default 6000. */
  duration?: number
  /** Render in place instead of fixed at the bottom (showcase). */
  inline?: boolean
}

/** Short confirmation after an action ("Zapisano"). The live region always exists, so the message is announced. */
export function Snackbar({ open, message, onClose, action, duration = 6000, inline }: Props) {
  useEffect(() => {
    if (!open || duration === 0) return
    const t = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(t)
  }, [open, duration, onClose])
  return (
    <div className={cx(s.snackbarRegion, inline && s.snackbarStatic)} role="status" aria-live="polite">
      {open && (
        <div className={s.snackbar}>
          <span>{message}</span>
          {action && (
            <button type="button" className={s.snackbarAction} onClick={action.onClick}>
              {action.label}
            </button>
          )}
          <button type="button" className={s.snackbarClose} onClick={onClose} aria-label="Zamknij komunikat">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
