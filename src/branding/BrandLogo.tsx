import { useEffect, type ReactNode } from 'react'
import { useIsDarkTheme } from '../lib/preferences'
import { cx } from '../components/ui/cx'
import { useBrandLogo } from './useBrandLogo'
import type { Logo } from './logos'
import s from './BrandLogo.module.css'

/** Inlined SVG markup (our own files from ./logos), so its text uses the page's Open Sans. */
export function Svg({ markup, className }: { markup: string; className?: string }) {
  return <span className={cx(s.svg, className)} dangerouslySetInnerHTML={{ __html: markup }} />
}

type Props = {
  /** The product name as text, shown next to a logo that has none in it. */
  name: string
  /** `inline`: one row (top bar), a logo with the name under the mark gives way to mark + text. `stacked`: any layout. */
  layout: 'inline' | 'stacked'
  /** Class of the product name text. */
  nameClassName?: string
  className?: string
  /** Today's logo: shown when no logo is accepted or GET /api/branding/logo fails. */
  fallback: ReactNode
}

/** The accepted logo (/logo) in the variant of the active theme, or `fallback`. */
export function BrandLogo({ name, layout, nameClassName, className, fallback }: Props) {
  const logo = useBrandLogo()
  const dark = useIsDarkTheme()
  if (!logo) return fallback

  if (logo.hasName && (layout === 'stacked' || logo.wide)) {
    return (
      <span className={cx(s.lockup, layout === 'stacked' && (logo.wide ? s.stacked : s.stackedTall), className)} role="img" aria-label={name}>
        <Svg markup={dark ? logo.dark : logo.light} />
      </span>
    )
  }
  return (
    <span className={cx(s.withName, className)}>
      <Svg markup={dark ? logo.markDark : logo.mark} className={s.mark} />
      <span className={nameClassName}>{name}</span>
    </span>
  )
}

const DEFAULT_FAVICON = '/favicon.svg'

function faviconHref(logo: Logo | null): string {
  return logo ? `data:image/svg+xml,${encodeURIComponent(logo.markFile)}` : DEFAULT_FAVICON
}

/** The browser tab icon: the mark of the accepted logo, else public/favicon.svg. Renders nothing. */
export function BrandFavicon() {
  const logo = useBrandLogo()
  useEffect(() => {
    // by id: browser extensions may add icon links of their own
    const link = document.getElementById('favicon')
    if (!(link instanceof HTMLLinkElement)) return
    link.href = faviconHref(logo)
  }, [logo])
  return null
}
