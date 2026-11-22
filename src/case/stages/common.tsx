import type { ReactNode } from 'react'
import { errorMessage } from '../../api/client'

export function StageHeader({
  title,
  actions,
  status,
}: {
  title: string
  actions?: ReactNode
  /**
   * The stage's status (done, signed, not started…) as one `InlineAlert`, shown right under the header.
   * It scrolls with the page; nothing is rendered when the stage has no status.
   */
  status?: ReactNode
}) {
  return (
    <>
      <header className="stage-head">
        <div className="stage-head__main">
          <h2 className="stage-head__title">{title}</h2>
        </div>
        {actions && <div className="stage-head__actions">{actions}</div>}
      </header>
      {status && <div className="stage-status">{status}</div>}
    </>
  )
}

/** Inline error for a failed mutation (409 messages from the API are in Polish). */
export function MutationError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p className="notice notice--danger" role="alert">
      {errorMessage(error)}
    </p>
  )
}
