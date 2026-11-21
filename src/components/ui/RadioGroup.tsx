import { Fragment, type ReactNode } from 'react'
import { cx } from './cx'
import { Fieldset } from './Field'
import s from './Choice.module.css'

export type RadioOption = {
  value: string
  label: ReactNode
  hint?: ReactNode
  disabled?: boolean
  /** Shown under the option only while it is selected (progressive disclosure). */
  conditional?: ReactNode
}

type Props = {
  /** Base id; the first radio gets exactly this id, so ErrorSummary can link to it. */
  id: string
  name: string
  legend: ReactNode
  hint?: ReactNode
  error?: string
  asHeading?: boolean
  inline?: boolean
  options: ReadonlyArray<RadioOption>
  value: string
  onChange: (value: string) => void
  forceFocus?: string
  /**
   * Answers with a longer description in the hint (e.g. level name + behaviour): bold labels, and the
   * whole answer, description included, selects the option.
   */
  detailed?: boolean
}

/** One question with mutually exclusive answers (fieldset + legend + native radios). */
export function RadioGroup({ id, name, legend, hint, error, asHeading, inline, options, value, onChange, forceFocus, detailed }: Props) {
  return (
    <Fieldset id={id} legend={legend} hint={hint} error={error} asHeading={asHeading}>
      <div className={cx(s.list, inline && s.inline)}>
        {options.map((o, i) => {
          const rid = i === 0 ? id : `${id}-${i}`
          const hintId = o.hint ? `${rid}-hint` : undefined
          return (
            <Fragment key={o.value}>
              <div className={cx(s.item, detailed && s.stretch)}>
                <input
                  id={rid}
                  type="radio"
                  name={name}
                  value={o.value}
                  checked={value === o.value}
                  disabled={o.disabled}
                  onChange={() => onChange(o.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={hintId}
                  data-force={forceFocus === o.value ? 'focus' : undefined}
                  className={cx(s.input, s.radio)}
                />
                <label htmlFor={rid} className={cx(s.label, detailed && s.labelBold)}>
                  {o.label}
                </label>
                {o.hint && (
                  <div id={hintId} className={s.hint}>
                    {o.hint}
                  </div>
                )}
              </div>
              {o.conditional && value === o.value && <div className={s.conditional}>{o.conditional}</div>}
            </Fragment>
          )
        })}
      </div>
    </Fieldset>
  )
}
