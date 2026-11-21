import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import s from './Overlay.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children?: ReactNode
  /** Buttons; put the main action last. */
  actions?: ReactNode
}

/** Modal on native <dialog>: focus trap, Esc and inert background come from the browser. Bottom sheet on phones. */
export function Dialog({ open, onClose, title, children, actions }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
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
