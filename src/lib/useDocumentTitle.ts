import { useEffect } from 'react'

export const APP_TITLE = 'Kompas Kompetencji'

/**
 * Sets the browser tab title to "<page> — Kompas Kompetencji" while the page is shown (WCAG 2.4.2: every screen has
 * its own title, read first by screen readers after a route change). `null` leaves the title as it is (loading).
 */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return
    const prev = document.title
    document.title = `${title} — ${APP_TITLE}`
    return () => {
      document.title = prev
    }
  }, [title])
}
