import { NavLink, Outlet } from 'react-router'

import { useUsernameSession } from '../hooks/useUsernameSession.ts'

const navItems = [
  { to: '/problems', label: 'Problems' },
  { to: '/progress', label: 'Progress' },
  { to: '/submissions', label: 'Submissions' },
  { to: '/activity', label: 'Activity' },
  { to: '/upload', label: 'Upload' },
] as const

export function AppShell() {
  const { session, logout } = useUsernameSession()

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <span className="app-shell__title">Learn</span>
          {session ? (
            <span className="app-shell__user">{session.displayUsername}</span>
          ) : null}
        </div>
        <nav className="app-shell__nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="app-shell__logout" onClick={() => void logout()}>
          Switch user
        </button>
      </header>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
