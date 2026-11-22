import type { ReactNode } from 'react'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { cx } from './cx'
import s from './PageLayout.module.css'

type Props = {
  /** The page h1. Without it only the container is rendered (loading and error states). */
  title?: ReactNode
  /** One line under the h1; longer text ends with "…" and the full text is in `title`. */
  meta?: string
  /** Right side of the header (one primary action); below 768px it goes under the title. */
  actions?: ReactNode
  /** Above the h1, e.g. a `BackLink`. */
  back?: ReactNode
  /**
   * From 1024px the page fills the height of the window under the top bar and does not scroll as a whole; the
   * content (a grid with `min-height: 0`) scrolls inside. Below 1024px the page scrolls as usual.
   */
  fill?: boolean
  children?: ReactNode
  className?: string
  /** Browser tab title ("… — Kompas Kompetencji"); by default the h1 when it is plain text. */
  documentTitle?: string
}

/**
 * The frame of every main page ("Mój zespół", "Baza wiedzy", HR, employee profile, settings…): one container of
 * `--content-max` (1200px) centred on the screen, so the h1 and the content start at the same place on every tab,
 * then the header (h1, meta line, actions) and the content with fixed gaps.
 */
export function PageLayout({ title, meta, actions, back, fill, children, className, documentTitle }: Props) {
  useDocumentTitle(documentTitle ?? (typeof title === 'string' ? title : null))
  return (
    <div className={cx(s.root, fill && s.fill, className)} data-page-fill={fill || undefined}>
      {back && <div className={s.back}>{back}</div>}
      {(title || actions) && (
        <header className={s.head}>
          <div className={s.titles}>
            {title && <h1 className={cx('h-page', s.title)}>{title}</h1>}
            {meta && (
              <p className={s.meta} title={meta}>
                {meta}
              </p>
            )}
          </div>
          {actions && <div className={s.actions}>{actions}</div>}
        </header>
      )}
      <div className={s.body}>{children}</div>
    </div>
  )
}
