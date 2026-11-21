import { useId } from 'react'
import { cx } from './cx'
import { FieldError } from './Field'
import { useMediaQuery } from './useMediaQuery'
import choice from './Choice.module.css'
import s from './RadioMatrix.module.css'

export type RadioMatrixColumn = {
  value: string
  /** Column heading, e.g. "Na poziomie oczekiwań". */
  label: string
  /** Second line of the heading, e.g. "5 punktów". */
  sublabel?: string
}

export type RadioMatrixRow = {
  /** Key in `value` and in `onChange`; the row's first radio gets the DOM id `${id}-${row.id}`. */
  id: string
  label: string
  error?: string
}

export type RadioMatrixGroup = {
  /** Header of the group of rows, e.g. "Kryteria obowiązkowe". */
  heading?: string
  rows: ReadonlyArray<RadioMatrixRow>
}

type Props = {
  /** Base id (and radio name) of the rows: row r is `${id}-${r.id}`, so an ErrorSummary can link to it. */
  id: string
  /** Accessible name of the whole matrix (table caption). */
  label: string
  /** Heading of the first column on wide screens, e.g. "Kryterium". */
  rowHeader?: string
  columns: ReadonlyArray<RadioMatrixColumn>
  rows?: ReadonlyArray<RadioMatrixRow>
  /** Rows split into headed groups; used instead of `rows`. */
  groups?: ReadonlyArray<RadioMatrixGroup>
  /** Chosen column value per row id ('' or missing = nothing chosen). */
  value: Readonly<Record<string, string | undefined>>
  onChange: (rowId: string, value: string) => void
  /** Shows the answers with disabled radios. */
  readOnly?: boolean
  /** 'auto' (default) picks the table from 768px; 'stacked' forces the phone layout (e.g. in the /ui catalogue). */
  layout?: 'auto' | 'stacked'
}

/** Same breakpoint as the rest of the design system (phones below 768px). */
const WIDE = '(min-width: 768px)'

/**
 * One question per row with the same answers in every row (e.g. a score on one scale for each criterion).
 * From 768px: a table, rows × columns, a radio in every cell (the whole cell is clickable).
 * Below: every row is a fieldset with the answers as segments in one line and the chosen answer spelled out under it.
 * Each row is its own native radio group (one name), so the arrow keys move within the row.
 */
export function RadioMatrix({ id, label, rowHeader, columns, rows, groups, value, onChange, readOnly, layout = 'auto' }: Props) {
  const wide = useMediaQuery(WIDE) && layout === 'auto'
  const uid = useId()
  const all: ReadonlyArray<RadioMatrixGroup> = groups ?? [{ rows: rows ?? [] }]
  const rowId = (r: RadioMatrixRow) => `${id}-${r.id}`
  const radioId = (r: RadioMatrixRow, i: number) => (i === 0 ? rowId(r) : `${rowId(r)}-${i}`)
  const errorId = (r: RadioMatrixRow) => `${rowId(r)}-error`
  const a11yLabel = (r: RadioMatrixRow, c: RadioMatrixColumn) => [r.label, c.sublabel, c.label].filter(Boolean).join(', ')

  const radio = (r: RadioMatrixRow, c: RadioMatrixColumn, i: number, className: string) => (
    <input
      id={radioId(r, i)}
      type="radio"
      name={rowId(r)}
      value={c.value}
      checked={value[r.id] === c.value}
      disabled={readOnly}
      onChange={() => onChange(r.id, c.value)}
      aria-label={a11yLabel(r, c)}
      aria-invalid={r.error ? true : undefined}
      aria-describedby={r.error ? errorId(r) : undefined}
      className={className}
    />
  )

  if (wide) {
    return (
      <table className={cx(s.table, readOnly && s.readOnly)}>
        <caption className="visually-hidden">{label}</caption>
        <colgroup>
          <col className={s.colRow} />
          {columns.map((c) => (
            <col key={c.value} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={s.headRow}>
              {rowHeader}
            </th>
            {columns.map((c) => (
              <th key={c.value} scope="col" className={s.headCol}>
                <span className={s.headLabel}>{c.label}</span>
                {c.sublabel && <span className={s.headSub}>{c.sublabel}</span>}
              </th>
            ))}
          </tr>
        </thead>
        {all.map((g, gi) => (
          <tbody key={gi}>
            {g.heading && (
              <tr>
                <th scope="rowgroup" colSpan={columns.length + 1} className={s.group}>
                  {g.heading}
                </th>
              </tr>
            )}
            {g.rows.map((r) => (
              <tr key={r.id} className={cx(r.error && s.invalid)}>
                <th scope="row" className={s.rowLabel}>
                  {r.label}
                  {r.error && <FieldError id={errorId(r)}>{r.error}</FieldError>}
                </th>
                {columns.map((c, i) => (
                  <td key={c.value} className={s.cell}>
                    <label className={s.cellTarget}>{radio(r, c, i, cx(choice.input, choice.radio))}</label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    )
  }

  return (
    <div className={s.stack}>
      <ul className={s.key} aria-label={`${label}: skala`}>
        {columns.map((c) => (
          <li key={c.value}>
            <span className={s.keyValue}>{c.value}</span> {c.label.toLocaleLowerCase('pl-PL')}
          </li>
        ))}
      </ul>
      {all.map((g, gi) => {
        const headingId = `${uid}-g${gi}`
        const body = g.rows.map((r) => {
          const chosen = columns.find((c) => c.value === value[r.id])
          return (
            <fieldset key={r.id} className={cx(s.rowSet, r.error && s.invalid)}>
              <legend className={s.rowLegend}>{r.label}</legend>
              {r.error && <FieldError id={errorId(r)}>{r.error}</FieldError>}
              <div className={s.segments}>
                {columns.map((c, i) => (
                  <label key={c.value} className={s.segment}>
                    {radio(r, c, i, s.segmentInput)}
                    <span className={s.segmentText} aria-hidden="true">
                      {c.value}
                    </span>
                  </label>
                ))}
              </div>
              <p className={cx(s.chosen, !chosen && s.chosenNone)}>
                {chosen ? [chosen.sublabel, chosen.label.toLocaleLowerCase('pl-PL')].filter(Boolean).join(': ') : 'Nie wybrano'}
              </p>
            </fieldset>
          )
        })
        return g.heading ? (
          <div key={gi} role="group" aria-labelledby={headingId} className={s.stack}>
            <p id={headingId} className={s.groupMobile}>
              {g.heading}
            </p>
            {body}
          </div>
        ) : (
          <div key={gi} className={s.stack}>
            {body}
          </div>
        )
      })}
    </div>
  )
}
