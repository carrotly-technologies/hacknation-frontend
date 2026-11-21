import type { ReactNode } from 'react'
import { errorMessage } from '../../api/client'

export function StageHeader({
  title,
  actions,
}: {
  title: string
  actions?: ReactNode
}) {
  return (
    <header className="stage-head">
      <div className="stage-head__main">
        <h2 className="stage-head__title">{title}</h2>
      </div>
      {actions && <div className="stage-head__actions">{actions}</div>}
    </header>
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

/** Explains why an action is disabled, right next to it. */
export function BlockedReason({ children }: { children: ReactNode }) {
  return <p className="blocked-reason">{children}</p>
}
