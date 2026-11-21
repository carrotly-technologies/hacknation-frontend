import type { ReactNode } from 'react'
import { errorMessage } from '../../api/client'
import type { StageInfo } from '../../api/cases'
import { InlineAlert } from '../../components/ui'
import { stageTitle } from '../../lib/stages'
import s from './StageLayout.module.css'

/** Frame of the stages redrawn after the "Kompas kompetencji" design: title, content, actions. */
export function StageLayout({
  info,
  title,
  children,
  actions,
}: {
  info: StageInfo
  /** Heading instead of the stage name (e.g. "Ocena okresowa pracownika – Arkusz B"). */
  title?: ReactNode
  children: ReactNode
  /** Bottom-right action row (secondary text link first, primary last). */
  actions?: ReactNode
}) {
  return (
    <div className={s.root}>
      <header className={s.head}>
        <h2 className={s.title}>{title ?? stageTitle(info)}</h2>
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

