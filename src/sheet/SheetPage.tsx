import { ArrowLeft, Printer } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/QueryState'
import { PageLayout } from '../components/ui'
import { useCase } from '../lib/caseQueries'
import { caseCriteria, useModel, useSheets } from '../lib/model'
import { caseUrl } from '../lib/stages'
import { SheetDocument } from './SheetDocument'

/** Full-page document preview; printing (Ctrl+P / button) yields the PDF via the print stylesheet. */
export function SheetPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const q = useCase(id)
  const model = useModel()
  const sheets = useSheets()
  const ready = q.isSuccess && model.isSuccess && sheets.isSuccess
  const autoPrint = params.get('druk') === '1'

  useEffect(() => {
    if (!ready) return
    const name = `${q.data.person.lastName}_${q.data.person.firstName}_arkusz_${q.data.sheetId ?? ''}`
    const prev = document.title
    document.title = `Arkusz oceny — ${q.data.person.firstName} ${q.data.person.lastName}`
    if (autoPrint) {
      document.title = name
      const t = window.setTimeout(() => window.print(), 400)
      return () => {
        window.clearTimeout(t)
        document.title = prev
      }
    }
    return () => {
      document.title = prev
    }
  }, [ready, autoPrint, q.data])

  if (q.isError) return <PageLayout><ErrorState error={q.error} what="arkusz" /></PageLayout>
  if (!ready) return <PageLayout><LoadingState /></PageLayout>

  const detail = q.data
  const name = `${detail.person.firstName} ${detail.person.lastName}`
  const back = caseUrl(detail.id, detail.currentStage)

  return (
    <div className="sheet-view">
      <header className="sheet-bar">
        <Link to={back} className="btn btn--ghost">
          <ArrowLeft size={15} aria-hidden="true" /> Wróć do teczki
        </Link>
        <div className="sheet-bar__title">
          <strong>Podgląd arkusza</strong>
          <span className="muted">
            {name} · {detail.path === 'FIRST' ? 'arkusz pierwszej oceny' : `arkusz ${detail.sheetId ?? '—'}`} · stan na dziś, wypełnia się z decyzji w teczce
          </span>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => window.print()}>
          <Printer size={15} aria-hidden="true" /> Drukuj / zapisz PDF
        </button>
      </header>
      {/* the sheet scrolls inside: focusable so the keyboard can scroll it too (WCAG 2.1.1) */}
      <main className="sheet-scroll" id="main" tabIndex={0} aria-label="Arkusz oceny">
        <SheetDocument detail={detail} model={model.data} criteria={caseCriteria(detail, sheets.data)} />
      </main>
    </div>
  )
}
