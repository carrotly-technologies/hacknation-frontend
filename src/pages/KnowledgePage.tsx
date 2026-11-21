import { FileText } from 'lucide-react'
import { AssistantPanel } from '../assistant/AssistantPanel'

const SOURCES = [
  ['Ustawa z 21.11.2008 o służbie cywilnej', 'art. 35–38 (pierwsza ocena), art. 81–83 (ocena okresowa, sprzeciw), art. 89, art. 108'],
  ['Rozporządzenie PRM z 4.04.2016', 'warunki i sposób przeprowadzania ocen okresowych (Dz.U. poz. 470), wzory arkuszy A, B, C'],
  ['Rozporządzenie PRM z 23.07.2015', 'pierwsza ocena w służbie cywilnej (Dz.U. poz. 1144), arkusz i sprawozdanie'],
  ['Model kompetencji służby cywilnej', '14 kompetencji, 49 wskaźników behawioralnych, 5 poziomów'],
  ['Poradniki KPRM', 'ocena okresowa i pierwsza ocena — interpretacje i przykłady'],
  ['Pytania i odpowiedzi', 'zestaw przygotowany przez zespół do weryfikacji asystenta'],
]

export function KnowledgePage() {
  return (
    <div className="page page--knowledge">
      <header className="page-head">
        <div>
          <h1 className="h-page">Baza wiedzy</h1>
          <p className="page-head__meta" title="Asystent formalny i asystent rozmowy — bez kontekstu konkretnej teczki">Asystent formalny i asystent rozmowy — bez kontekstu konkretnej teczki</p>
        </div>
      </header>
      <div className="knowledge">
        <AssistantPanel context={{}} variant="page" />
        <aside className="knowledge__sources panel">
          <div className="panel__head">
            <h2 className="h-section">Źródła asystenta</h2>
          </div>
          <ul className="sources">
            {SOURCES.map(([t, d]) => (
              <li key={t} className="sources__row">
                <FileText className="sources__icon" size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="sources__text">
                  <span className="sources__t" title={t}>{t}</span>
                  <span className="sources__d" title={d}>{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="panel__body small muted">
            Gdy w źródłach brak odpowiedzi, asystent mówi to wprost zamiast zgadywać. Nie podejmuje decyzji o poziomie oceny.
          </p>
        </aside>
      </div>
    </div>
  )
}
