import type { ReactNode } from 'react'
import type { CaseDetail } from '../../api/cases'
import type { CompetencyModel } from '../../api/kompas'
import { StatusBadge } from '../../components/ui'
import { fmtAvg } from '../../lib/format'
import { competencyName } from '../../lib/model'
import type { LiveResult } from '../../lib/result'
import s from './CompetencyScores.module.css'

/** An extra column of the scores table (e.g. "Do omówienia" in step 5, "Popraw" in step 6). */
export interface ScoresColumn {
  header: string
  /** Header hidden visually (still read by screen readers), e.g. for a column of links. */
  hiddenHeader?: boolean
  cell: (criterionId: string) => ReactNode
}

interface TableProps {
  detail: CaseDetail
  model: CompetencyModel
  criteria: string[]
  caption: string
  /** Show the caption as the table's visible title (default: read by screen readers only). */
  showCaption?: boolean
  /** Header of the first column (default "Kompetencja"). */
  firstHeader?: string
  /** Shown under the competency name, e.g. a deviation note. */
  note?: (criterionId: string) => ReactNode
  extra?: ScoresColumn[]
}

/**
 * Partial assessments as a plain table: competency, points (just the number) and level from the API scale.
 * Below 600px the level column is hidden and the level shows in small print under the competency name.
 */
export function CompetencyScoresTable({
  detail,
  model,
  criteria,
  caption,
  showCaption,
  firstHeader = 'Kompetencja',
  note,
  extra = [],
}: TableProps) {
  const level = (p: number | null | undefined) => (p == null ? '—' : (model.scale.find((x) => x.points === p)?.label.toLowerCase() ?? '—'))
  return (
    <table className={s.table}>
      <caption className={showCaption ? s.caption : 'visually-hidden'}>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{firstHeader}</th>
          <th scope="col" className={s.points}>
            Punkty
          </th>
          <th scope="col" className={s.level}>
            Poziom
          </th>
          {extra.map((x) => (
            <th key={x.header} scope="col">
              {x.hiddenHeader ? <span className="visually-hidden">{x.header}</span> : x.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {criteria.map((c) => {
          const p = detail.decisions[c]
          const n = note?.(c)
          return (
            <tr key={c}>
              <th scope="row">
                {competencyName(model, c)}
                <span className={s.levelInline}>{level(p)}</span>
                {n && <span className={s.note}>{n}</span>}
              </th>
              <td className={s.points}>{p ?? '—'}</td>
              <td className={s.level}>{level(p)}</td>
              {extra.map((x) => (
                <td key={x.header}>{x.cell(c)}</td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/**
 * Average and band under the table, then the result as a badge: final (green / red) once every criterion is decided
 * and the result can no longer change, otherwise a neutral "Wstępnie …". No badge while there is no result yet.
 */
export function ResultSummary({ result: r }: { result: LiveResult }) {
  const final = r.complete && !r.provisional
  const word = r.result === 'POSITIVE' ? 'pozytywna' : 'negatywna'
  return (
    <div className={s.summary}>
      <p>
        Średnia: <span className="num">{fmtAvg(r.average)}</span>
        {r.band && ` · ${r.band.label.toLowerCase()}`}
      </p>
      {r.result && (
        <div>
          <StatusBadge tone={final ? (r.result === 'POSITIVE' ? 'success' : 'error') : 'neutral'}>
            {final ? `Ocena ${word}` : `Wstępnie ${word}`}
          </StatusBadge>
        </div>
      )}
    </div>
  )
}
