import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { bootstrapUsernameSession } from '../lib/auth/bootstrap.ts'
import {
  clearUsernameSession,
  readUsernameSession,
  writeUsernameSession,
} from '../lib/session/storage.ts'
import {
  isValidUsernameKey,
  normalizeDisplayUsername,
  normalizeUsernameKey,
} from '../lib/username/normalize.ts'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client.ts'
import type { UsernameSession } from '../types/session.ts'
import { UsernameSessionContext } from './usernameSessionContext.ts'

export function UsernameSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [session, setSession] = useState<UsernameSession | null>(() =>
    readUsernameSession(),
  )
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const login = useCallback(async (rawUsername: string) => {
    setLoginError(null)
    const displayUsername = normalizeDisplayUsername(rawUsername)
    if (!displayUsername) {
      setLoginError('Enter a username to continue.')
      return
    }

    const usernameKey = normalizeUsernameKey(displayUsername)
    if (!isValidUsernameKey(usernameKey)) {
      setLoginError(
        'Username must be 1–40 characters and use only letters, numbers, hyphens, and underscores.',
      )
      return
    }

    if (!isSupabaseConfigured()) {
      setLoginError('Supabase is not configured. Add env vars in app/ui/.env.local.')
      return
    }

    setIsLoggingIn(true)
    try {
      await bootstrapUsernameSession(usernameKey, displayUsername)
      const nextSession: UsernameSession = { usernameKey, displayUsername }
      writeUsernameSession(nextSession)
      setSession(nextSession)
      navigate('/problems', { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not sign in. Try again.'
      setLoginError(message)
    } finally {
      setIsLoggingIn(false)
    }
  }, [navigate])

  const logout = useCallback(async () => {
    clearUsernameSession()
    setSession(null)
    queryClient.clear()

    if (isSupabaseConfigured()) {
      try {
        await getSupabaseClient().auth.signOut()
      } catch {
        // Username identity is local; auth sign-out failure should not block logout.
      }
    }

    navigate('/login', { replace: true })
  }, [navigate, queryClient])

  const value = useMemo(
    () => ({
      session,
      isReady: true,
      isLoggingIn,
      loginError,
      login,
      logout,
    }),
    [session, isLoggingIn, loginError, login, logout],
  )

  return (
    <UsernameSessionContext.Provider value={value}>
      {children}
    </UsernameSessionContext.Provider>
  )
}
