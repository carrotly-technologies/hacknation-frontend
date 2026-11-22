import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { sendPageview } from '../api/client'

/** The monitor itself is not reported: the team's own visits would fill the log. */
const NOT_TRACKED = ['/aktywnosc']

/** Query values that are one-time secrets of the sign-in (login.gov.pl return: `artifact`, `state`) are not sent. */
const SECRET_PARAMS = /^(artifact|code|state|token|pesel)$/i

function maskSearch(search: string): string {
  if (!search) return ''
  const params = new URLSearchParams(search)
  for (const key of [...params.keys()]) if (SECRET_PARAMS.test(key)) params.set(key, '***')
  return `?${params.toString().replace(/%2A/g, '*')}`
}

/** Reports every route change (path + query) to the activity log; silent and non-blocking. */
export function usePageviews(): void {
  const { pathname, search } = useLocation()
  // StrictMode runs effects twice in development: report a screen once.
  const last = useRef<string | null>(null)
  useEffect(() => {
    const path = `${pathname}${maskSearch(search)}`
    if (last.current === path) return
    last.current = path
    if (NOT_TRACKED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return
    sendPageview(path)
  }, [pathname, search])
}
