import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText } from 'lucide-react'
import { getDocuments } from '../api/docs'
import { AssistantPanel } from '../assistant/AssistantPanel'
import { ErrorState, LoadingState } from '../components/QueryState'
import { Card, PageLayout } from '../components/ui'
import s from './KnowledgePage.module.css'

/**
 * "Baza wiedzy": the chat (about ⅔) and the assistant's sources (about ⅓) in the page container. From 1024px the
 * page is exactly the height of the window; the messages and the source list scroll inside, the question field
 * stays at the bottom. Below 1024px the sources go under the chat and the page scrolls.
 */
export function KnowledgePage() {
  return (
    <PageLayout title="Baza wiedzy" meta="Asystent formalny i asystent rozmowy — bez kontekstu konkretnej teczki" fill>
      <div className={s.grid}>
        <AssistantPanel context={{}} variant="page" />
        <Card title="Źródła asystenta" as="h2" className={s.sources} bodyClassName={s.sourcesBody}>
          <SourceList />
          <p className={s.note}>
            Gdy w źródłach brak odpowiedzi, asystent mówi to wprost zamiast zgadywać. Nie podejmuje decyzji o poziomie oceny.
          </p>
        </Card>
      </div>
    </PageLayout>
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
    // Keyboard users scroll the list with the arrow keys once it has the focus.
    <div className={s.scroll} role="region" aria-label="Lista źródeł asystenta" tabIndex={0}>
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
    </div>
  )
}
