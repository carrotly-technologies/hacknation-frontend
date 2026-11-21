import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ExternalLink, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { askAssistant, getSourceDocuments, type AssistantAnswer, type AssistantContext, type AssistantMode } from '../api/assistant'
import { suggestedQuestions } from './suggestions'

interface Msg {
  id: number
  role: 'user' | 'assistant'
  text: string
  answer?: AssistantAnswer
  pending?: boolean
}

const TABS: { mode: AssistantMode; label: string; blurb: string }[] = [
  { mode: 'FORMAL', label: 'Asystent formalny', blurb: 'Procedura, terminy, przepisy i poprawność formalna.' },
  { mode: 'CONVERSATION', label: 'Asystent rozmowy', blurb: 'Przygotowanie do rozmowy, pytania, informacja zwrotna, plan rozwoju.' },
]

let seq = 0

export function AssistantPanel({ context, onClose, variant = 'dock' }: { context: AssistantContext; onClose?: () => void; variant?: 'dock' | 'page' }) {
  const [mode, setMode] = useState<AssistantMode>('FORMAL')
  const [threads, setThreads] = useState<Record<AssistantMode, Msg[]>>({ FORMAL: [], CONVERSATION: [] })
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const msgs = threads[mode]
  const busy = msgs.some((m) => m.pending)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs.length, busy])

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || busy) return
    const m = mode
    const userMsg: Msg = { id: ++seq, role: 'user', text: q }
    const pending: Msg = { id: ++seq, role: 'assistant', text: '', pending: true }
    setThreads((t) => ({ ...t, [m]: [...t[m], userMsg, pending] }))
    setInput('')
    try {
      const answer = await askAssistant({
        mode: m,
        question: q,
        context,
        history: threads[m].map((x) => ({ role: x.role, text: x.text })),
      })
      setThreads((t) => ({ ...t, [m]: t[m].map((x) => (x.id === pending.id ? { ...x, pending: false, text: answer.answer, answer } : x)) }))
    } catch {
      setThreads((t) => ({ ...t, [m]: t[m].map((x) => (x.id === pending.id ? { ...x, pending: false, text: 'Nie udało się połączyć z asystentem. Spróbuj ponownie.' } : x)) }))
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  const suggestions = suggestedQuestions(mode, context.stageId)
  const tab = TABS.find((t) => t.mode === mode)!

  return (
    <aside className={`assistant assistant--${variant}`} aria-label="Asystent">
      <div className="assistant__tabs" role="tablist" aria-label="Rodzaj asystenta">
        {TABS.map((t) => (
          <button key={t.mode} type="button" role="tab" aria-selected={mode === t.mode} className={`assistant__tab ${mode === t.mode ? 'is-on' : ''}`} onClick={() => setMode(t.mode)}>
            {t.label}
          </button>
        ))}
        {onClose && (
          <button type="button" className="assistant__close" onClick={onClose} aria-label="Zamknij panel asystenta">
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="assistant__ctx">
        {context.label ? (
          <span className="ctx-chip" title={`Asystent zna kontekst bieżącego etapu teczki: ${context.label}`}>
            <span className="ctx-chip__k">Kontekst</span> {context.label}
          </span>
        ) : (
          <span className="ctx-chip"><span className="ctx-chip__k">Kontekst</span> ogólny — bez teczki</span>
        )}
      </div>

      <SourceDocuments />

      <div className="assistant__list" ref={listRef} role="log" aria-live="polite">
        {msgs.length === 0 && (
          <div className="assistant__intro">
            <p className="assistant__blurb">{tab.blurb}</p>
            <p className="h-sub" style={{ marginTop: 14, marginBottom: 6 }}>Podpowiadane pytania</p>
            <ul className="assistant__sugg">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" className="sugg" onClick={() => ask(s)}>{s}</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            {m.role === 'assistant' && <span className="msg__who">{tab.label}</span>}
            {m.pending ? (
              <p className="msg__text msg__text--pending">Szukam w bazie wiedzy…</p>
            ) : (
              <>
                <p className="msg__text">{m.text}</p>
                {m.answer?.placeholder && <p className="msg__badge">Tryb demonstracyjny — brak połączenia z bazą wiedzy</p>}
                {m.answer && m.answer.sources.length > 0 && (
                  <ul className="msg__sources">
                    {m.answer.sources.map((s, i) => (
                      <li key={i}>
                        <span className="msg__src-n num">[{i + 1}]</span>{' '}
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noopener" className="msg__src-link" title="Otwórz dokument źródłowy w nowej karcie">
                            {s.title}
                          </a>
                        ) : (
                          s.title
                        )}
                        {s.locator && <span className="faint">, {s.locator}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        ))}
        {msgs.length > 0 && !busy && (
          <ul className="assistant__sugg assistant__sugg--inline">
            {suggestions.filter((s) => !msgs.some((m) => m.text === s)).slice(0, 2).map((s) => (
              <li key={s}>
                <button type="button" className="sugg" onClick={() => ask(s)}>{s}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="assistant__form" onSubmit={submit}>
        <label htmlFor={`ask-${variant}`} className="visually-hidden">Zadaj pytanie</label>
        <textarea
          id={`ask-${variant}`}
          className="assistant__input"
          rows={2}
          value={input}
          placeholder={mode === 'FORMAL' ? 'Zapytaj o procedurę lub przepisy…' : 'Zapytaj o przygotowanie rozmowy…'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ask(input)
            }
          }}
        />
        <button type="submit" className="assistant__send" disabled={!input.trim() || busy} aria-label="Wyślij pytanie">
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      </form>
      <p className="assistant__disclaimer">Asystent odpowiada na podstawie przepisów i poradników, podając źródło. Nie ocenia pracownika — decyzja należy do przełożonego.</p>
    </aside>
  )
}

/** Collapsible list of every document of the knowledge base, each a link to the original. */
function SourceDocuments() {
  const [open, setOpen] = useState(false)
  const docs = useQuery({
    queryKey: ['assistant', 'documents'],
    queryFn: ({ signal }) => getSourceDocuments(signal),
    staleTime: Infinity,
    enabled: open,
  })
  return (
    <details className="assistant__docs" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Dokumenty źródłowe</summary>
      {docs.isPending && <p className="assistant__docs-note">Wczytuję listę…</p>}
      {docs.isError && <p className="assistant__docs-note">Nie udało się wczytać listy dokumentów.</p>}
      {docs.data && (
        <ul className="assistant__docs-list">
          {docs.data.map((d) => (
            <li key={d.id}>
              {d.url ? (
                <a href={d.url} target="_blank" rel="noopener">
                  {d.title}
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              ) : (
                <span>{d.title}</span>
              )}
              {(d.note || !d.indexed) && (
                <span className="faint">
                  {' '}
                  ({[d.note, d.indexed ? null : 'poza bazą odpowiedzi'].filter(Boolean).join('; ')})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
