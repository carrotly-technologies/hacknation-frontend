import { BookOpen, FileText, LayoutGrid, Palette, Settings } from 'lucide-react'
import { Card } from '../components/ui'

/** "Więcej": secondary destinations; reachable only by its address, not linked from the navigation. */
export function MorePage() {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="h-page">Więcej</h1>
      </header>
      <ul className="more-list">
        <li>
          <Card to="/ustawienia" title="Ustawienia" icon={<Settings size={24} aria-hidden="true" />}>
            Motyw jasny lub ciemny, rozmiar tekstu, wysoki kontrast
          </Card>
        </li>
        <li>
          <Card to="/baza-wiedzy" title="Baza wiedzy" icon={<BookOpen size={24} aria-hidden="true" />}>
            Przepisy i odpowiedzi asystenta
          </Card>
        </li>
        <li>
          <Card to="/uslugi" title="Usługi" icon={<LayoutGrid size={24} aria-hidden="true" />}>
            Katalog usług
          </Card>
        </li>
        <li>
          <Card to="/wniosek-demo" title="Wniosek demonstracyjny" icon={<FileText size={24} aria-hidden="true" />}>
            Wzorzec formularza krok po kroku
          </Card>
        </li>
        <li>
          <Card to="/ui" title="Komponenty interfejsu" icon={<Palette size={24} aria-hidden="true" />}>
            Katalog elementów, kolory i tryb ciemny
          </Card>
        </li>
      </ul>
    </div>
  )
}
