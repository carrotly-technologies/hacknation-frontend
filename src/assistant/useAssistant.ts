import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { askAssistant, type AssistantAnswer, type AssistantContext, type AssistantExchange, type AssistantMode } from '../api/assistant'

export interface Msg {
  id: number
  role: 'user' | 'assistant'
  text: string
  answer?: AssistantAnswer
  pending?: boolean
}

export type Threads = Record<AssistantMode, Msg[]>

/** One conversation per assistant (formal, conversation), with the tab that is open. */
export interface AssistantChat {
  mode: AssistantMode
  setMode: (mode: AssistantMode) => void
  threads: Threads
  /** Asks in `mode` (default: the open tab); ignored while that thread waits for an answer. */
  ask: (question: string, context: AssistantContext, mode?: AssistantMode) => void
  /** "Nowa rozmowa": empties the open tab's conversation, so the next question has no history. */
  reset: () => void
}

/** A question asked from a screen, e.g. "Przygotuj pytania do rozmowy" in step 5. */
export interface AssistantRequest {
  mode: AssistantMode
  question: string
}

export interface AssistantState {
  isOpen: boolean
  /** Opens the popup; with a request, also switches to its assistant and asks the question. */
  open: (request?: AssistantRequest) => void
  close: () => void
  toggle: () => void
  /** What the current screen tells the assistant (case and stage); `{}` outside the case file. */
  context: AssistantContext
  setContext: (context: AssistantContext) => void
  /** The popup's conversation: kept while the popup is closed, until sign-out. */
  chat: AssistantChat
}

export const AssistantCtx = createContext<AssistantState | null>(null)

const OFF: AssistantState = {
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  context: {},
  setContext: () => {},
  chat: { mode: 'FORMAL', setMode: () => {}, threads: { FORMAL: [], CONVERSATION: [] }, ask: () => {}, reset: () => {} },
}

/** The assistant of the signed-in session (AssistantProvider); does nothing outside it. */
export function useAssistant(): AssistantState {
  return useContext(AssistantCtx) ?? OFF
}

/** Tells the assistant what the screen shows while it is mounted (e.g. the case file and its stage). */
export function useAssistantContext(context: AssistantContext): void {
  const { setContext } = useAssistant()
  const { caseId, stageId, label } = context
  useEffect(() => {
    setContext({ caseId, stageId, label })
    return () => setContext({})
  }, [setContext, caseId, stageId, label])
}

let seq = 0

/** How many earlier exchanges go with a question (the API uses at most this many). */
const HISTORY_EXCHANGES = 3

/** The answered exchanges of a thread, oldest first: a question and the answer that came back for it. */
export function historyOf(msgs: Msg[]): AssistantExchange[] {
  const out: AssistantExchange[] = []
  msgs.forEach((m, i) => {
    const next = msgs[i + 1]
    if (m.role === 'user' && next?.role === 'assistant' && next.answer && !next.answer.placeholder) {
      out.push({ question: m.text, answer: next.answer.reply })
    }
  })
  return out.slice(-HISTORY_EXCHANGES)
}

/** Conversation state and asking: the popup keeps one in AssistantProvider, the "Baza wiedzy" page its own. */
export function useAssistantChat(): AssistantChat {
  const [mode, setMode] = useState<AssistantMode>('FORMAL')
  const [threads, setThreads] = useState<Threads>({ FORMAL: [], CONVERSATION: [] })
  // Mirror of `threads` updated synchronously, so two asks in a row see each other (and the pending check works).
  const ref = useRef(threads)
  const update = useCallback((fn: (t: Threads) => Threads) => {
    ref.current = fn(ref.current)
    setThreads(ref.current)
  }, [])

  const modeRef = useRef(mode)
  const changeMode = useCallback((m: AssistantMode) => {
    modeRef.current = m
    setMode(m)
  }, [])

  const ask = useCallback(
    (question: string, context: AssistantContext, m?: AssistantMode) => {
      const target = m ?? modeRef.current
      const q = question.trim()
      const before = ref.current[target]
      if (!q || before.some((x) => x.pending)) return
      const userMsg: Msg = { id: ++seq, role: 'user', text: q }
      const pending: Msg = { id: ++seq, role: 'assistant', text: '', pending: true }
      update((t) => ({ ...t, [target]: [...t[target], userMsg, pending] }))
      const settle = (patch: Partial<Msg>) =>
        update((t) => ({ ...t, [target]: t[target].map((x) => (x.id === pending.id ? { ...x, pending: false, ...patch } : x)) }))
      askAssistant({
        mode: target,
        question: q,
        context,
        history: historyOf(before),
      }).then(
        (answer) => settle({ text: answer.answer, answer }),
        () => settle({ text: 'Nie udało się połączyć z asystentem. Spróbuj ponownie.' }),
      )
    },
    [update],
  )

  const reset = useCallback(() => {
    const target = modeRef.current
    if (ref.current[target].some((x) => x.pending)) return
    update((t) => ({ ...t, [target]: [] }))
  }, [update])

  return useMemo(() => ({ mode, setMode: changeMode, threads, ask, reset }), [mode, changeMode, threads, ask, reset])
}
