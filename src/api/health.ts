import { apiGet } from './client'

export interface HealthResponse {
  status: 'ok'
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health', signal)
}
