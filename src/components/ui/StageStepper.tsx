import { Check } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router'
import { cx } from './cx'
import s from './StageStepper.module.css'

export type StageStepStatus = 'done' | 'current' | 'todo'

export type StageStep = {
  key: string
  label: string
  status: StageStepStatus
  /** Link target; without it the step is plain text. */
  to?: string
}

type Props = {
  steps: StageStep[]
  /** The step shown on the page (gets aria-current="step"); by default the current one. */
  activeKey?: string
  /** Accessible name of the list, e.g. "Etapy oceny". */
  label: string
}

const STATUS_TEXT: Record<StageStepStatus, string> = {
  done: 'zakończono',
  current: 'w toku',
  todo: 'nierozpoczęty',
}

/**
 * Horizontal process stepper (chevrons). Done steps are light green with a check icon, the current step is
 * tinted, future steps are outlined; the step on screen (in any state) has an --accent outline, a bold label,
 * aria-current="step" and the hidden text "(wyświetlany)". Each step is a
 * link, so the whole stepper works with Tab / Enter. When the stepper is too narrow for its labels (container query in
 * StageStepper.module.css) it turns into numbered dots plus the name of the shown step, without horizontal scrolling.
 * Each word of a label carries its own text in `data-label`: the CSS reserves the width of the bold word, so making
 * a step bold (shown step) never moves a word to the next line or shifts the neighbouring steps.
 */
export function StageStepper({ steps, activeKey, label }: Props) {
  const active = activeKey ?? steps.find((st) => st.status === 'current')?.key
  const activeIndex = steps.findIndex((st) => st.key === active)
  return (
    <nav className={s.root} aria-label={label}>
      <ol className={s.list}>
        {steps.map((st, i) => {
          const isActive = st.key === active
          const content = (
            <>
              <span className={s.marker} aria-hidden="true">
                {st.status === 'done' ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={s.label}>
                {st.label.split(' ').map((word, w) => (
                  <Fragment key={w}>
                    {w > 0 && ' '}
                    <span className={s.word} data-label={word}>
                      {word}
                    </span>
                  </Fragment>
                ))}
              </span>
              <span className="visually-hidden">
                {`, krok ${i + 1} z ${steps.length} (${STATUS_TEXT[st.status]})${isActive ? ' (wyświetlany)' : ''}`}
              </span>
            </>
          )
          const cls = cx(s.step, s[st.status], isActive && s.active)
          return (
            <li key={st.key} className={s.item}>
              {st.to ? (
                <Link to={st.to} className={cls} aria-current={isActive ? 'step' : undefined} title={st.label}>
                  {content}
                </Link>
              ) : (
                <span className={cls} aria-current={isActive ? 'step' : undefined} title={st.label}>
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {activeIndex >= 0 && (
        <p className={s.caption} aria-hidden="true">
          Krok {activeIndex + 1} z {steps.length}: <strong>{steps[activeIndex].label}</strong>
        </p>
      )}
    </nav>
  )
}
