import type { SourceDocument } from './assistant'
import { apiGet, apiUrl } from './client'

/** GET /api/docs — every source document, linked; available also without the assistant. */
export async function getDocuments(signal?: AbortSignal): Promise<SourceDocument[]> {
  const docs = await apiGet<SourceDocument[]>('/docs', signal)
  return docs.map((d) => ({ ...d, url: d.url ? apiUrl(d.url) : null }))
}
