import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptLogo, getLogoChoice } from '../api/branding'
import { findLogo, type Logo } from './logos'

export const logoChoiceKey = ['branding', 'logo'] as const

const logoChoiceQuery = {
  queryKey: logoChoiceKey,
  queryFn: ({ signal }: { signal?: AbortSignal }) => getLogoChoice(signal),
  staleTime: 5 * 60_000,
  retry: false,
} as const

/** GET /api/branding/logo (public, also on the sign-in page). */
export function useLogoChoice() {
  return useQuery(logoChoiceQuery)
}

/** The accepted logo; null while loading, when none is accepted or the request failed (the default logo stays). */
export function useBrandLogo(): Logo | null {
  return findLogo(useLogoChoice().data?.logoId)
}

/** PUT /api/branding/logo; the new choice shows at once in the top bar, the sign-in page and the favicon. */
export function useAcceptLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (logoId: string) => acceptLogo(logoId),
    onSuccess: (choice) => {
      qc.setQueryData(logoChoiceKey, choice)
      void qc.invalidateQueries({ queryKey: logoChoiceKey })
    },
  })
}
