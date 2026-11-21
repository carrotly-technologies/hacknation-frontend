import { useCallback, useEffect, useState } from 'react'
import { getHealth } from './api/health'
import './App.css'

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: string }
  | { kind: 'error'; message: string }

function App() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })

  const load = useCallback((signal?: AbortSignal) => {
    getHealth(signal)
      .then((res) => setHealth({ kind: 'ok', status: res.status }))
      .catch((err: unknown) => {
        if (signal?.aborted) return
        setHealth({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        })
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const retry = () => {
    setHealth({ kind: 'loading' })
    load()
  }

  return (
    <main className="app">
      <h1>HackNation</h1>
      <section className="card" aria-live="polite">
        <h2>API status</h2>
        {health.kind === 'loading' && <p className="muted">Checking API…</p>}
        {health.kind === 'ok' && (
          <p className="ok">
            Status: <strong data-testid="health-status">{health.status}</strong>
          </p>
        )}
        {health.kind === 'error' && (
          <div className="error" role="alert">
            <p>
              <strong>Cannot reach the API.</strong> Is the backend running on
              port 3000?
            </p>
            <p className="muted">{health.message}</p>
          </div>
        )}
        <button type="button" onClick={retry}>
          Check again
        </button>
      </section>
    </main>
  )
}

export default App
