import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import s from './Choice.module.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & {
  label: ReactNode
  forceState?: 'focus'
}

/** On/off setting that applies immediately (not for form answers: use Checkbox there). */
export function Switch({ label, forceState, id, ...rest }: Props) {
  const auto = useId()
  const inputId = id ?? `sw${auto}`
  return (
    <label htmlFor={inputId} className={s.switch}>
      <input {...rest} id={inputId} type="checkbox" role="switch" data-force={forceState} className={s.switchInput} />
      <span>{label}</span>
    </label>
  )
}
