import { Sparkles, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { useMediaQuery } from '../components/ui/useMediaQuery'
import { AssistantPanel } from './AssistantPanel'
import { useAssistant } from './useAssistant'

const POPUP_ID = 'assistant-popup'

/**
 * "Asystent AI": the floating button in the bottom right corner of every AppShell screen and the chat window it
 * opens. From 600px the window sits above the button and the page stays usable (non-modal <dialog>); below 600px it
 * fills the screen as a modal <dialog> (focus trap and inert page from the browser). Esc and "Zamknij" close it and
 * focus goes back to the button.
 */
export function AssistantLauncher() {
  const a = useAssistant()
  const phone = useMediaQuery('(max-width: 599px)')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const { isOpen, close } = a

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (!isOpen) {
      if (d.open) {
        d.close()
        fabRef.current?.focus()
      }
      return
    }
    if (d.open && d.matches(':modal') === phone) return
    // Opening, or the window crossed 600px while open: reopen in the other mode.
    if (d.open) d.close()
    if (phone) d.showModal()
    else d.show()
    d.querySelector('textarea')?.focus()
  }, [isOpen, phone])

  // Leaving the shell (e.g. the sheet print view) closes the window; the conversation stays in the provider.
  useEffect(() => close, [close])

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className={`assistant-fab ${a.isOpen ? 'is-open' : ''}`}
        aria-label="Asystent AI"
        title="Asystent AI"
        aria-haspopup="dialog"
        aria-expanded={a.isOpen}
        aria-controls={POPUP_ID}
        onClick={a.toggle}
      >
        {a.isOpen ? <X size={24} strokeWidth={2} aria-hidden="true" /> : <Sparkles size={24} strokeWidth={1.75} aria-hidden="true" />}
      </button>
      <dialog
        ref={dialogRef}
        id={POPUP_ID}
        className="assistant-popup"
        aria-labelledby={titleId}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          e.preventDefault()
          close()
        }}
        // Esc in the modal (phone) dialog: close through the state, so the button gets the focus back.
        onCancel={(e) => {
          e.preventDefault()
          close()
        }}
      >
        <AssistantPanel variant="popup" context={a.context} chat={a.chat} onClose={close} titleId={titleId} />
      </dialog>
    </>
  )
}
