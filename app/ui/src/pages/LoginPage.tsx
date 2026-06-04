import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'

import { LoginPageLayout } from '../design-system/layouts/LoginPageLayout'
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
    <LoginPageLayout
      username={username}
      onUsernameChange={setUsername}
      onSubmit={(e) => void handleSubmit(e)}
      isLoggingIn={isLoggingIn}
      loginError={loginError}
      isSupabaseConfigured={supabaseReady}
    />
  )
}
