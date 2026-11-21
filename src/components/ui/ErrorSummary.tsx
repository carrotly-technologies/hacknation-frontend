import { useEffect, useId, useRef } from 'react'
import s from './Feedback.module.css'

export type FormError = {
  /** id of the field (or first radio) the message belongs to */
  id: string
  message: string
}

type Props = {
  errors: ReadonlyArray<FormError>
  title?: string
}

/**
 * List of all errors at the top of the form. Takes focus when it appears (after a submit),
 * so screen readers read it and keyboard users can jump to each field.
 */
export function ErrorSummary({ errors, title = 'Popraw błędy w formularzu' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // Pass a new array on every failed submit: each one moves focus back to the summary.
  useEffect(() => {
    if (errors.length) ref.current?.focus()
  }, [errors])
  if (errors.length === 0) return null
  return (
    <div ref={ref} className={s.summary} role="alert" aria-labelledby={titleId} tabIndex={-1}>
      <h2 id={titleId} className={s.summaryTitle}>
        {title}
      </h2>
      <ul className={s.summaryList}>
        {errors.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => {
                const el = document.getElementById(e.id)
                if (!el) return
                ev.preventDefault()
                el.focus()
                el.scrollIntoView({ block: 'center' })
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
