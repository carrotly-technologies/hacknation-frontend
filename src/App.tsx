import { Navigate, Route, Routes } from 'react-router'
import { CasePage } from './case/CasePage'
import { AdminUsersPage } from './pages/AdminUsersPage'
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
import { HomeRedirect, RequireRole } from './shell/RequireRole'

export default function App() {
  return (
    <Routes>
      {/* There is no sign-in any more: old links land on the start page. */}
      <Route path="/logowanie" element={<Navigate to="/" replace />} />
      <Route element={<RequireRole roles={['SUPERVISOR']} />}>
        <Route path="/teczka/:id/arkusz" element={<SheetPage />} />
      </Route>
      <Route element={<AppShell />}>
        <Route index element={<HomeRedirect />} />
        <Route element={<RequireRole roles={['SUPERVISOR']} />}>
          <Route path="/zespol" element={<TeamPage />} />
          <Route path="/teczka/:id/:stage?" element={<CasePage />} />
        </Route>
        <Route element={<RequireRole roles={['HR']} />}>
          <Route path="/hr" element={<HrPage />} />
        </Route>
        <Route element={<RequireRole roles={['ADMIN']} />}>
          <Route path="/admin/uzytkownicy" element={<AdminUsersPage />} />
          <Route path="/admin" element={<Navigate to="/admin/uzytkownicy" replace />} />
        </Route>
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
