// Empty VITE_API_URL = same origin, so requests go through the Vite dev proxy.
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, { signal })
  if (!res.ok) {
    throw new Error(`API responded with ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}
