import { Navigate, Outlet, useLocation } from 'react-router'

import { useUsernameSession } from '../hooks/useUsernameSession.ts'

export function RequireUsername() {
  const { session, isReady } = useUsernameSession()
  const location = useLocation()

  if (!isReady) {
    return (
      <div className="page-loading" aria-live="polite">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
