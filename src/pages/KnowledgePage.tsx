import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText } from 'lucide-react'
import { getDocuments } from '../api/docs'
import { AssistantPanel } from '../assistant/AssistantPanel'
import { ErrorState, LoadingState } from '../components/QueryState'
import { useFeatures } from '../lib/features'

export function KnowledgePage() {
  const { assistant } = useFeatures()
  const meta = assistant
    ? 'Asystent formalny i asystent rozmowy — bez kontekstu konkretnej teczki'
    : 'Akty prawne, model kompetencji i poradniki, na których opiera się Kompas'
  return (
    <div className="page page--knowledge">
      <header className="page-head">
        <div>
          <h1 className="h-page">Baza wiedzy</h1>
          <p className="page-head__meta" title={meta}>{meta}</p>
        </div>
      </header>
      <div className={`knowledge ${assistant ? '' : 'knowledge--sources-only'}`}>
        {assistant && <AssistantPanel context={{}} variant="page" />}
        <aside className="knowledge__sources panel">
          <div className="panel__head">
            <h2 className="h-section">Źródła asystenta</h2>
          </div>
          <SourceList />
          <p className="panel__body small muted">
            Gdy w źródłach brak odpowiedzi, asystent mówi to wprost zamiast zgadywać. Nie podejmuje decyzji o poziomie oceny.
          </p>
        </aside>
      </div>
    </div>
  )
}

/** Every source document from GET /api/docs; the ones with a file or official text are links. */
function SourceList() {
  const docs = useQuery({
    queryKey: ['docs'],
    queryFn: ({ signal }) => getDocuments(signal),
    staleTime: Infinity,
  })
  if (docs.isPending) return <LoadingState label="Wczytuję źródła…" />
  if (docs.isError) return <ErrorState error={docs.error} what="źródła asystenta" onRetry={() => docs.refetch()} />
  return (
    <ul className="sources">
      {docs.data.map((d) => (
        <li key={d.id} className="sources__row">
          <FileText className="sources__icon" size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="sources__text">
            {d.url ? (
              <a className="sources__t sources__link" href={d.url} target="_blank" rel="noopener" title={d.title}>
                {d.title}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : (
              <span className="sources__t" title={d.title}>{d.title}</span>
            )}
            <span className="sources__d" title={d.description}>{d.description}</span>
            {!d.url && d.note && <span className="sources__d faint">{d.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
