import { createContext } from 'react'

import type { UsernameSessionContextValue } from './usernameSessionTypes.ts'

export const UsernameSessionContext =
  createContext<UsernameSessionContextValue | null>(null)
