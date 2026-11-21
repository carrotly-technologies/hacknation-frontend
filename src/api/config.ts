import { apiGet } from './client'

export interface Features {
  assistant: boolean
}

export interface AppConfigResponse {
  features: Features
}

export function getConfig(signal?: AbortSignal): Promise<AppConfigResponse> {
  return apiGet<AppConfigResponse>('/config', signal)
}
