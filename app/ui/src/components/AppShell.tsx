import { Outlet } from 'react-router'
import { useUsernameSession } from '../hooks/useUsernameSession.ts'
import { AppLayout } from '../design-system/layouts/AppLayout.tsx'

const navItems = [
  { to: '/problems', label: 'Problems' },
  { to: '/progress', label: 'Progress' },
  { to: '/submissions', label: 'Submissions' },
  { to: '/activity', label: 'Activity' },
  { to: '/upload', label: 'Upload' },
]

export function AppShell() {
  const { session, logout } = useUsernameSession()

  return (
    <AppLayout
      session={session}
      onLogout={() => void logout()}
      navItems={navItems}
    >
      <Outlet />
    </AppLayout>
  )
}
