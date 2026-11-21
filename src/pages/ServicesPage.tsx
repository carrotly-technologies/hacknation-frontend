import { LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { ButtonLink, Card, EmptyState, PageLayout, SearchBar } from '../components/ui'

/** Placeholder for a service catalogue. */
export function ServicesPage() {
  const [q, setQ] = useState('')
  return (
    <PageLayout title="Usługi">
      <SearchBar value={q} onChange={setQ} label="Szukaj usługi" placeholder="Wpisz nazwę usługi" />
      <Card>
        <EmptyState
          icon={<LayoutGrid size={28} />}
          title="Katalog usług jest w przygotowaniu"
          action={<ButtonLink to="/wniosek-demo" variant="secondary">Zobacz wniosek demonstracyjny</ButtonLink>}
        >
          Tu pojawią się usługi, które można załatwić w aplikacji.
        </EmptyState>
      </Card>
    </PageLayout>
  )
}
