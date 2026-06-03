import { Navigate, Route, Routes } from 'react-router'

import { AppShell } from '../components/AppShell.tsx'
import { RequireUsername } from '../components/RequireUsername.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { PlaceholderPage } from '../pages/PlaceholderPage.tsx'

function CatchAllRedirect() {
  return <Navigate to="/problems" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireUsername />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/problems" replace />} />
          <Route
            path="/problems"
            element={
              <PlaceholderPage
                title="Problems"
                description="Problem list will load from Supabase after seeding (US-011)."
              />
            }
          />
          <Route
            path="/problems/:problemId"
            element={
              <PlaceholderPage
                title="Problem"
                description="Problem detail and editor arrive in US-012–US-016."
              />
            }
          />
          <Route
            path="/progress"
            element={
              <PlaceholderPage
                title="Progress"
                description="Progress tracking arrives in US-019."
              />
            }
          />
          <Route
            path="/submissions"
            element={
              <PlaceholderPage
                title="Submissions"
                description="Submission browser arrives in US-020."
              />
            }
          />
          <Route
            path="/activity"
            element={
              <PlaceholderPage
                title="Activity"
                description="Activity feed arrives in US-022."
              />
            }
          />
          <Route
            path="/upload"
            element={
              <PlaceholderPage
                title="Upload"
                description="MDX upload flow arrives in US-025."
              />
            }
          />
          <Route path="*" element={<CatchAllRedirect />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
