import { apiGet, apiPost, apiUrl } from './client'
import type { StageId } from './cases'

export type AssistantMode = 'FORMAL' | 'CONVERSATION'

export interface AssistantContext {
  caseId?: string
  stageId?: StageId
  /** Human-readable context shown in the chip, e.g. "Ocena · Anna Nowak · Arkusz C". */
  label?: string
}

export interface AssistantSource {
  /** e.g. "§11 ust. 1 pkt 4 rozp. PRM z 4.04.2016" */
  title: string
  /** e.g. "Poradnik KPRM, s. 28" */
  locator?: string
  quote?: string
  /** Absolute link to the original document (PDFs open on the excerpt's page), or null when there is no file. */
  url: string | null
}

export interface AssistantAnswer {
  answer: string
  sources: AssistantSource[]
  /** True when the knowledge base had no sufficient information (the assistant must say so). */
  noAnswer: boolean
  placeholder?: boolean
}

export interface AskAssistantRequest {
  mode: AssistantMode
  question: string
  context: AssistantContext
  history: { role: 'user' | 'assistant'; text: string }[]
}

interface AskResponse {
  answer: string
  grounded: boolean
  mode: 'LLM' | 'EXTRACTIVE'
  sources: { n: number; title: string; ref: string; quote: string; url: string | null }[]
  disclaimer: string
}

/** One document of the assistant's knowledge base (GET /api/assistant/documents). */
export interface SourceDocument {
  id: string
  title: string
  /** One line under the title: what the document covers. */
  description: string
  /** Absolute link to the file or the official text, or null when there is no source file. */
  url: string | null
  /** Whether the assistant answers from this document. */
  indexed: boolean
  /** e.g. "brak pliku źródłowego". */
  note: string | null
}

/** GET /api/assistant/documents — every source document, linked. */
export async function getSourceDocuments(signal?: AbortSignal): Promise<SourceDocument[]> {
  const docs = await apiGet<SourceDocument[]>('/assistant/documents', signal)
  return docs.map((d) => ({ ...d, url: d.url ? apiUrl(d.url) : null }))
}

/** POST /api/assistant/ask — answers only from the knowledge base, with sources. */
export async function askAssistant(req: AskAssistantRequest): Promise<AssistantAnswer> {
  const res = await apiPost<AskResponse>('/assistant/ask', {
    question: req.question,
    assistant: req.mode,
    ...(req.context.caseId ? { caseId: req.context.caseId } : {}),
    ...(req.context.stageId ? { stageId: req.context.stageId } : {}),
  })
  return {
    answer: res.disclaimer ? `${res.answer}\n\n${res.disclaimer}` : res.answer,
    sources: res.sources.map((s) => ({
      title: s.ref,
      locator: s.title,
      quote: s.quote,
      url: s.url ? apiUrl(s.url) : null,
    })),
    noAnswer: !res.grounded,
  }
}
