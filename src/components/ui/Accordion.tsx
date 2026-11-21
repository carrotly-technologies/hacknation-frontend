import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import s from './Surface.module.css'

type Item = { title: ReactNode; content: ReactNode; open?: boolean }

/** Native <details> sections. For content pages (FAQ), never for form questions. */
export function Accordion({ items }: { items: ReadonlyArray<Item> }) {
  return (
    <div className={s.accordion}>
      {items.map((it, i) => (
        <details key={i} className={s.details} open={it.open}>
          <summary className={s.summary}>
            <span>{it.title}</span>
            <ChevronDown className={s.summaryIcon} size={20} aria-hidden="true" />
          </summary>
          <div className={s.panel}>{it.content}</div>
        </details>
      ))}
    </div>
  )
}
