import type { ReactNode } from 'react'
import { errorMessage } from '../../api/client'
import type { StageInfo } from '../../api/cases'
import { DeadlineText } from '../../components/Deadline'
import { InlineAlert } from '../../components/ui'
import s from './StageLayout.module.css'

/** Frame of the stages redrawn after the "Kompas kompetencji" design: heading, deadline, legal basis, content, actions. */
export function StageLayout({
  info,
  lead,
  children,
  actions,
}: {
  info: StageInfo
  lead?: ReactNode
  children: ReactNode
  /** Bottom-right action row (secondary text link first, primary last). */
  actions?: ReactNode
}) {
  return (
    <div className={s.root}>
      <header className={s.head}>
        <h2 className={s.title}>{info.name}</h2>
        <p className={s.meta}>
          {info.status !== 'DONE' && info.deadline?.date && <DeadlineText deadline={info.deadline} showLabel />}
          <span className={s.legal}>{info.legalBasis}</span>
        </p>
        {lead && <p className={s.lead}>{lead}</p>}
      </header>
      <div className={s.content}>{children}</div>
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  )
}

export function StageError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <InlineAlert tone="error" live title="Nie udało się zapisać">
      {errorMessage(error)}
    </InlineAlert>
  )
}

