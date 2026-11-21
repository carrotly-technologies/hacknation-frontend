import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { askAssistant, type AssistantAnswer, type AssistantContext, type AssistantMode } from '../api/assistant'

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
}

/** A question asked from a screen, e.g. "Przygotuj pytania do rozmowy" in step 5. */
export interface AssistantRequest {
  mode: AssistantMode
  question: string
}

export interface AssistantState {
  /** FEATURE_ASSISTANT from GET /api/config: false = no button, no popup. */
  enabled: boolean
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
  enabled: false,
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  context: {},
  setContext: () => {},
  chat: { mode: 'FORMAL', setMode: () => {}, threads: { FORMAL: [], CONVERSATION: [] }, ask: () => {} },
}

/** The assistant of the signed-in session (AssistantProvider); turned off outside it. */
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
        history: before.map((x) => ({ role: x.role, text: x.text })),
      }).then(
        (answer) => settle({ text: answer.answer, answer }),
        () => settle({ text: 'Nie udało się połączyć z asystentem. Spróbuj ponownie.' }),
      )
    },
    [update],
  )

  return useMemo(() => ({ mode, setMode: changeMode, threads, ask }), [mode, changeMode, threads, ask])
}
