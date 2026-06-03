import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'

import { ConfigError } from '../components/ConfigError.tsx'
import { useUsernameSession } from '../hooks/useUsernameSession.ts'
import { isSupabaseConfigured } from '../lib/supabase/client.ts'

export function LoginPage() {
  const { session, isReady, isLoggingIn, loginError, login } = useUsernameSession()
  const [username, setUsername] = useState('')
  const supabaseReady = isSupabaseConfigured()

  if (isReady && session) {
    return <Navigate to="/problems" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await login(username)
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1>Sign in with username</h1>
        <p className="login-page__notice">
          Prototype only: anyone who knows a username can reuse it. There is no password
          and no secure identity guarantee.
        </p>

        {!supabaseReady ? <ConfigError /> : null}

        <form className="login-page__form" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoFocus
            disabled={!supabaseReady || isLoggingIn}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. ada-lovelace"
          />
          {loginError ? (
            <p className="login-page__error" role="alert">
              {loginError}
            </p>
          ) : null}
          <button type="submit" disabled={!supabaseReady || isLoggingIn}>
            {isLoggingIn ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
