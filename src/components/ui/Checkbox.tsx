import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from './cx'
import s from './Choice.module.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  hint?: ReactNode
  invalid?: boolean
  forceState?: 'focus'
}

export function Checkbox({ label, hint, invalid, forceState, id, className, ...rest }: Props) {
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
        aria-describedby={hintId}
        data-force={forceState}
        className={cx(s.input, s.checkbox)}
      />
      <label htmlFor={inputId} className={s.label}>
        {label}
      </label>
      {hint && (
        <div id={hintId} className={s.hint}>
          {hint}
        </div>
      )}
    </div>
  )
}
