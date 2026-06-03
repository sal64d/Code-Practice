import type { Database } from './supabase.ts'

export type { Database, Json } from './supabase.ts'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
