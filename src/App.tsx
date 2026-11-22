import { Navigate, Route, Routes } from 'react-router'
import { AssistantProvider } from './assistant/AssistantProvider'
import { CasePage } from './case/CasePage'
import { usePageviews } from './lib/usePageviews'
import { AckPage } from './pages/AckPage'
import { ActivityPage } from './pages/ActivityPage'
import { AdminAuditPage } from './pages/AdminAuditPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { DemoFormPage } from './pages/DemoFormPage'
import { HrPage } from './pages/HrPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { LoginGovReturnPage } from './pages/LoginGovReturnPage'
import { LoginPage } from './pages/LoginPage'
import { MockLoginGovPage } from './pages/MockLoginGovPage'
import { MorePage } from './pages/MorePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PersonPage } from './pages/PersonPage'
import { PresentationPage } from './pages/PresentationPage'
import { ServicesPage } from './pages/ServicesPage'
import { SettingsPage } from './pages/SettingsPage'
import { TeamPage } from './pages/TeamPage'
import { UiPage } from './pages/UiPage'
import { SheetPage } from './sheet/SheetPage'
import { AppShell } from './shell/AppShell'
import { HomeRedirect, RequireAuth, RequireRole } from './shell/RequireAuth'

export default function App() {
  usePageviews()
  return (
    <Routes>
      <Route path="/logowanie" element={<LoginPage />} />
      {/* Simulated login.gov.pl (hacknation-backend#67): the mock identity provider and the return page, both public. */}
      <Route path="/mock-login-gov" element={<MockLoginGovPage />} />
      <Route path="/logowanie/login-gov" element={<LoginGovReturnPage />} />
      {/* Public: the assessed person opens the link from the evaluator, without an account or the app shell. */}
      <Route path="/zapoznanie/:token" element={<AckPage />} />
      {/* Public: the project presentation (hacknation-frontend#116), no sign-in. */}
      <Route path="/prezentacja" element={<PresentationPage />} />
      {/* Public, not linked anywhere: the team's view of the activity log; opens only with MONITOR_TOKEN (hacknation-backend#75). */}
      <Route path="/aktywnosc" element={<ActivityPage />} />
      {/* The assistant's conversation lives for the signed-in session (also across the sheet print view). */}
      <Route
        element={
          <RequireAuth>
            <AssistantProvider />
          </RequireAuth>
        }
      >
        {/* HR reads cases (the API allows it); the case file shows them read-only. */}
        <Route element={<RequireRole roles={['SUPERVISOR', 'HR']} />}>
          <Route path="/teczka/:id/arkusz" element={<SheetPage />} />
        </Route>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route element={<RequireRole roles={['SUPERVISOR']} />}>
            <Route path="/zespol" element={<TeamPage />} />
            <Route path="/pracownik/:personId" element={<PersonPage />} />
          </Route>
          <Route element={<RequireRole roles={['SUPERVISOR', 'HR']} />}>
            <Route path="/teczka/:id/:stage?" element={<CasePage />} />
          </Route>
          <Route element={<RequireRole roles={['HR']} />}>
            <Route path="/hr" element={<HrPage />} />
          </Route>
          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="/admin/uzytkownicy" element={<AdminUsersPage />} />
            <Route path="/admin/dziennik" element={<AdminAuditPage />} />
            <Route path="/admin" element={<Navigate to="/admin/uzytkownicy" replace />} />
          </Route>
          <Route path="/baza-wiedzy" element={<KnowledgePage />} />
          <Route path="/uslugi" element={<ServicesPage />} />
          <Route path="/wiecej" element={<MorePage />} />
          <Route path="/ustawienia" element={<SettingsPage />} />
          <Route path="/wniosek-demo/:step?" element={<DemoFormPage />} />
          <Route path="/ui" element={<UiPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
