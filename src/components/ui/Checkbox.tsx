import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from './cx'
import s from './Choice.module.css'
import f from './Field.module.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  hint?: ReactNode
  invalid?: boolean
  forceState?: 'focus'
  /** Must be ticked to go on: adds "(wymagane)" after the label and aria-required (no native `required`, forms validate themselves). */
  required?: boolean
}

export function Checkbox({ label, hint, invalid, forceState, required, id, className, ...rest }: Props) {
  const auto = useId()
  const inputId = id ?? `c${auto}`
  const hintId = hint ? `${inputId}-hint` : undefined
  return (
    <div className={cx(s.item, className)}>
      <input
        {...rest}
        id={inputId}
        type="checkbox"
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-describedby={hintId}
        data-force={forceState}
        className={cx(s.input, s.checkbox)}
      />
      <label htmlFor={inputId} className={s.label}>
        {label}
        {required && <span className={f.optional}> (wymagane)</span>}
      </label>
      {hint && (
        <div id={hintId} className={s.hint}>
          {hint}
        </div>
      )}
    </div>
  )
}
