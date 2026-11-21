import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { askAssistant, type AssistantAnswer, type AssistantContext, type AssistantExchange } from '../api/assistant'

export interface Msg {
  id: number
  role: 'user' | 'assistant'
  text: string
  answer?: AssistantAnswer
  pending?: boolean
}

/** The one conversation with the AI assistant (rules and talk preparation in the same thread). */
export interface AssistantChat {
  msgs: Msg[]
  /** Asks the question; ignored while the conversation waits for an answer. */
  ask: (question: string, context: AssistantContext) => void
  /** "Nowa rozmowa": empties the conversation, so the next question has no history. */
  reset: () => void
}

/** A question asked from a screen, e.g. "Przygotuj pytania do rozmowy" in step 5. */
export interface AssistantRequest {
  question: string
}

export interface AssistantState {
  isOpen: boolean
  /** Opens the popup; with a request, also asks the question. */
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
  chat: { msgs: [], ask: () => {}, reset: () => {} },
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
  const [msgs, setMsgs] = useState<Msg[]>([])
  // Mirror of `msgs` updated synchronously, so two asks in a row see each other (and the pending check works).
  const ref = useRef(msgs)
  const update = useCallback((fn: (m: Msg[]) => Msg[]) => {
    ref.current = fn(ref.current)
    setMsgs(ref.current)
  }, [])

  const ask = useCallback(
    (question: string, context: AssistantContext) => {
      const q = question.trim()
      const before = ref.current
      if (!q || before.some((x) => x.pending)) return
      const userMsg: Msg = { id: ++seq, role: 'user', text: q }
      const pending: Msg = { id: ++seq, role: 'assistant', text: '', pending: true }
      update((m) => [...m, userMsg, pending])
      const settle = (patch: Partial<Msg>) =>
        update((m) => m.map((x) => (x.id === pending.id ? { ...x, pending: false, ...patch } : x)))
      askAssistant({
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
    if (ref.current.some((x) => x.pending)) return
    update(() => [])
  }, [update])

  return useMemo(() => ({ msgs, ask, reset }), [msgs, ask, reset])
}
