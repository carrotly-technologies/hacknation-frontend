import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'
import s from './FormProgress.module.css'
import { Stepper } from './Stepper'

export type FormProgressState = 'done' | 'current' | 'todo'

export type FormProgressStep = {
  key: string
  label: string
  state: FormProgressState
  /** Link target; without it the step is plain text. */
  to?: string
}

type Props = {
  steps: FormProgressStep[]
  /** Word of the screen reader counter: "Część 2 z 3: …", "Kompetencja 2 z 5: …", "Element 1 z 4: …". */
  unit: string
  /** Accessible name of the list, e.g. "Części arkusza"; by default "{unit} formularza". */
  label?: string
}

/**
 * Progress of a multi-part form: a full-width bar (its "{unit} X z N: name" counter is for screen readers
 * only) and the list of parts with numbered circles, a check for done parts and the current part marked
 * with aria-current="step". Steps with `to` are links. The parts always sit in one row: names that do not
 * fit are cut with "…" (full name in `title`), and in very narrow columns only the circles are shown. Shared by "Formularz oceny" and "Formularz oceny
 * kompetencji", so both forms look and behave the same.
 */
export function FormProgress({ steps, unit, label }: Props) {
  const index = steps.findIndex((st) => st.state === 'current')
  const done = steps.filter((st) => st.state === 'done').length
  const current = index >= 0 ? index + 1 : Math.min(done, steps.length)
  return (
    <div className={s.root}>
      <Stepper unit={unit} current={current} total={steps.length} name={index >= 0 ? steps[index].label : undefined} hideText />
      <ol className={s.list} style={{ '--n': steps.length } as CSSProperties} aria-label={label ?? `${unit} formularza`}>
        {steps.map((st, i) => {
          const n = i + 1
          const isCurrent = st.state === 'current'
          const content = (
            <>
              <span className={s.mark} aria-hidden="true">
                {st.state === 'done' ? <Check size={14} strokeWidth={3} /> : n}
              </span>
              <span className={s.name}>
                <span className="visually-hidden">{unit} {n}: </span>
                {st.label}
                {st.state === 'done' && <span className="visually-hidden"> (za Tobą)</span>}
              </span>
            </>
          )
          const cls = cx(s.step, s[st.state])
          return (
            <li key={st.key} className={s.item}>
              {st.to ? (
                <Link to={st.to} className={cls} aria-current={isCurrent ? 'step' : undefined} title={st.label}>
                  {content}
                </Link>
              ) : (
                <span className={cls} aria-current={isCurrent ? 'step' : undefined} title={st.label}>
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
