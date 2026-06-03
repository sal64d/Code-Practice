import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '../../types/supabase.ts'
import {
  formatSupabaseEnvError,
  getSupabaseEnv,
  type SupabaseEnvResult,
} from './env.ts'

export type { SupabaseEnvResult }

let client: SupabaseClient<Database> | null = null

export function getSupabaseEnvResult(): SupabaseEnvResult {
  return getSupabaseEnv()
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv().ok
}

export function getSupabaseClient(): SupabaseClient<Database> {
  const envResult = getSupabaseEnv()
  if (!envResult.ok) {
    throw new Error(formatSupabaseEnvError(envResult.error))
  }

  if (!client) {
    client = createClient<Database>(envResult.env.url, envResult.env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return client
}

export function resetSupabaseClientForTests(): void {
  client = null
}
