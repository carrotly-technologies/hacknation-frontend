import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/health'

/** Unobtrusive dot showing whether GET /api/health answers. Re-checks every 30 s. */
export function ApiStatus() {
  const q = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: 30_000,
    retry: false,
  })
  const state = q.isPending ? 'checking' : q.isSuccess ? 'ok' : 'down'
  const label = state === 'checking' ? 'Sprawdzanie API' : state === 'ok' ? 'API połączone' : 'API niedostępne'
  return (
    <button
      type="button"
      className={`api-status api-status--${state}`}
      onClick={() => q.refetch()}
      title={`${label}. Kliknij, aby sprawdzić ponownie.`}
      aria-live="polite"
    >
      <span className="api-status__dot" aria-hidden="true" />
      <span className="api-status__label one-line">API</span>
      <span className="visually-hidden">{label}</span>
    </button>
  )
}
