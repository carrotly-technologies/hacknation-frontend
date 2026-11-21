import { CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cx } from './cx'
import s from './Field.module.css'

/** Props a control receives from Field so label, hint and error are announced together. */
export type FieldControlProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

type Props = {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  /** Renders the label as the page heading (h1), for one-question-per-page forms. */
  asHeading?: boolean
  /** Fixed id of the control, e.g. so an ErrorSummary can link to it. */
  id?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

/** Label above, hint under the label, error message above the control; all tied via aria-describedby. */
export function Field({ label, hint, error, optional, asHeading, id, className, children }: Props) {
  const auto = useId()
  const controlId = id ?? `f${auto}`
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const labelEl = (
    <label htmlFor={controlId} className={cx(s.label, asHeading && s.labelLarge)}>
      {label}
      {optional && <span className={s.optional}> (opcjonalne)</span>}
    </label>
  )
  return (
    <div className={cx(s.root, error && s.invalid, className)}>
      {asHeading ? <h1 className={s.legend}>{labelEl}</h1> : labelEl}
      {hint && (
        <div id={hintId} className={s.hint}>
          {hint}
        </div>
      )}
      {error && <FieldError id={errorId!}>{error}</FieldError>}
      <div className={s.control}>
        {children({ id: controlId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      </div>
    </div>
  )
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={s.error}>
      <CircleAlert size={18} aria-hidden="true" />
      <span>
        <span className="visually-hidden">Błąd: </span>
        {children}
      </span>
    </p>
  )
}

type FieldsetProps = {
  legend: ReactNode
  hint?: ReactNode
  error?: string
  asHeading?: boolean
  id: string
  className?: string
  children: ReactNode
}

/** Groups radios or checkboxes under one question (fieldset + legend). */
export function Fieldset({ legend, hint, error, asHeading, id, className, children }: FieldsetProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <fieldset
      className={cx(s.root, error && s.invalid, className)}
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
    >
      <legend className={cx(s.legend, !asHeading && s.label)}>
        {asHeading ? <h1 className={s.labelLarge}>{legend}</h1> : legend}
      </legend>
      {hint && (
        <div id={hintId} className={s.hint}>
          {hint}
        </div>
      )}
      {error && <FieldError id={errorId!}>{error}</FieldError>}
      <div className={s.control}>{children}</div>
    </fieldset>
  )
}
