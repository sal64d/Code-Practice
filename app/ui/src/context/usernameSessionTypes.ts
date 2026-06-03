import type { UsernameSession } from '../types/session.ts'

export interface UsernameSessionContextValue {
  session: UsernameSession | null
  isReady: boolean
  isLoggingIn: boolean
  loginError: string | null
  login: (rawUsername: string) => Promise<void>
  logout: () => Promise<void>
}
