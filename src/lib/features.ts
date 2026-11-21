import { useQuery, type QueryClient } from '@tanstack/react-query'
import { getConfig, type Features } from '../api/config'

/** Used while /api/config loads and when it fails: everything flagged stays hidden. */
const FEATURES_OFF: Features = { assistant: false }

const configQuery = {
  queryKey: ['config'],
  queryFn: ({ signal }: { signal?: AbortSignal }) => getConfig(signal),
  staleTime: Infinity,
  retry: false,
} as const

/** Starts loading the runtime config (feature flags) at app start. */
export function prefetchConfig(client: QueryClient): void {
  void client.prefetchQuery(configQuery)
}

/** Feature flags from GET /api/config (backend env, no frontend rebuild needed). */
export function useFeatures(): Features {
  const q = useQuery(configQuery)
  return q.data?.features?.assistant === true ? { assistant: true } : FEATURES_OFF
}
