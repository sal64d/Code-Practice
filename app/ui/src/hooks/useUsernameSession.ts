import { useContext } from 'react'

import { UsernameSessionContext } from '../context/usernameSessionContext.ts'

export function useUsernameSession() {
  const context = useContext(UsernameSessionContext)
  if (!context) {
    throw new Error('useUsernameSession must be used within UsernameSessionProvider')
  }
  return context
}
