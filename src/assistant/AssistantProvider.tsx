import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router'
import type { AssistantContext } from '../api/assistant'
import { AssistantCtx, useAssistantChat, type AssistantRequest, type AssistantState } from './useAssistant'

const sameContext = (a: AssistantContext, b: AssistantContext) => a.caseId === b.caseId && a.stageId === b.stageId && a.label === b.label

/**
 * The AI assistant of the signed-in session: whether the popup is open, what the current screen tells it (case and
 * stage, set by `useAssistantContext`) and the conversation, which stays when the popup closes or the user goes to
 * another screen (also the sheet print view) and goes away on sign-out. The button and the popup are in AppShell
 * (`AssistantLauncher`). Kept in memory only: questions may be about an employee, so nothing goes to storage.
 */
export function AssistantProvider({ children }: { children?: ReactNode }) {
  const chat = useAssistantChat()
  const [isOpen, setOpen] = useState(false)
  const [context, setContextState] = useState<AssistantContext>({})
  // Latest context for `open(request)`, which can run in the same tick as a context change.
  const contextRef = useRef(context)

  const setContext = useCallback((next: AssistantContext) => {
    if (sameContext(contextRef.current, next)) return
    contextRef.current = next
    setContextState(next)
  }, [])

  const { ask } = chat
  const open = useCallback(
    (request?: AssistantRequest) => {
      setOpen(true)
      if (request) ask(request.question, contextRef.current)
    },
    [ask],
  )
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((o) => !o), [])

  const value = useMemo<AssistantState>(
    () => ({ isOpen, open, close, toggle, context, setContext, chat }),
    [isOpen, open, close, toggle, context, setContext, chat],
  )
  return <AssistantCtx.Provider value={value}>{children ?? <Outlet />}</AssistantCtx.Provider>
}
