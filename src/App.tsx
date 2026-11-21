import { Navigate, Route, Routes } from 'react-router'
import { CasePage } from './case/CasePage'
import { DemoFormPage } from './pages/DemoFormPage'
import { HrPage } from './pages/HrPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { MorePage } from './pages/MorePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ServicesPage } from './pages/ServicesPage'
import { TeamPage } from './pages/TeamPage'
import { UiPage } from './pages/UiPage'
import { SheetPage } from './sheet/SheetPage'
import { AppShell } from './shell/AppShell'

export default function App() {
  return (
    <Routes>
      <Route path="/teczka/:id/arkusz" element={<SheetPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/zespol" replace />} />
        <Route path="/zespol" element={<TeamPage />} />
        <Route path="/teczka/:id/:stage?" element={<CasePage />} />
        <Route path="/hr" element={<HrPage />} />
        <Route path="/baza-wiedzy" element={<KnowledgePage />} />
        <Route path="/uslugi" element={<ServicesPage />} />
        <Route path="/wiecej" element={<MorePage />} />
        <Route path="/wniosek-demo/:step?" element={<DemoFormPage />} />
        <Route path="/ui" element={<UiPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
