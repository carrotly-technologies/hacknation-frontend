import { apiGet, apiPut } from './client'

// GET (public) and PUT /api/branding/logo (backend README, "Branding: the accepted logo").

/** The logo accepted on /logo; all null until someone accepts one. */
export interface LogoChoice {
  logoId: string | null
  /** ISO 8601 timestamp. */
  acceptedAt: string | null
  acceptedBy: { id: string; name: string } | null
}

export function getLogoChoice(signal?: AbortSignal): Promise<LogoChoice> {
  return apiGet<LogoChoice>('/branding/logo', signal)
}

export function acceptLogo(logoId: string): Promise<LogoChoice> {
  return apiPut<LogoChoice>('/branding/logo', { logoId })
}
