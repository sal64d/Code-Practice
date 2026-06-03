import type { UsernameSession } from '../../types/session.ts'

const STORAGE_KEY = 'learn-app:username-session'

export function readUsernameSession(): UsernameSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as UsernameSession
    if (
      typeof parsed.usernameKey !== 'string' ||
      typeof parsed.displayUsername !== 'string'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeUsernameSession(session: UsernameSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearUsernameSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
