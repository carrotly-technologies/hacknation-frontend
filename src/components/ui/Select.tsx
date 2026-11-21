import { ChevronDown } from 'lucide-react'
import type { Ref, SelectHTMLAttributes } from 'react'
import { cx } from './cx'
import s from './Input.module.css'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  options: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>
  /** First, empty option ("Wybierz…"). */
  placeholder?: string
  ref?: Ref<HTMLSelectElement>
}

/** Native select (dropdown) styled like the text field. */
export function Select({ options, placeholder, className, ...rest }: Props) {
  return (
    <div className={s.selectWrap}>
      <select {...rest} className={cx(s.select, className)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className={s.chevron} size={20} aria-hidden="true" />
    </div>
  )
}
