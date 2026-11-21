import { Navigate, Route, Routes } from 'react-router'
import { BrandFavicon } from './branding/BrandLogo'
import { CasePage } from './case/CasePage'
import { AckPage } from './pages/AckPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { DemoFormPage } from './pages/DemoFormPage'
import { HrPage } from './pages/HrPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { LogoPage } from './pages/LogoPage'
import { LoginPage } from './pages/LoginPage'
import { MorePage } from './pages/MorePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ServicesPage } from './pages/ServicesPage'
import { SettingsPage } from './pages/SettingsPage'
import { TeamPage } from './pages/TeamPage'
import { UiPage } from './pages/UiPage'
import { SheetPage } from './sheet/SheetPage'
import { AppShell } from './shell/AppShell'
import { HomeRedirect, RequireAuth, RequireRole } from './shell/RequireAuth'

export default function App() {
  return (
    <>
      {/* The browser tab icon follows the logo accepted on /logo, on every page */}
      <BrandFavicon />
      <Routes>
        <Route path="/logowanie" element={<LoginPage />} />
        {/* Public: the assessed person opens the link from the evaluator, without an account or the app shell. */}
        <Route path="/zapoznanie/:token" element={<AckPage />} />
        <Route element={<RequireAuth />}>
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
            <Route path="/ustawienia" element={<SettingsPage />} />
            <Route path="/wniosek-demo/:step?" element={<DemoFormPage />} />
            <Route path="/ui" element={<UiPage />} />
            {/* Logo choice for the whole app: every role, reachable by its address only (not in the menu) */}
            <Route path="/logo" element={<LogoPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
