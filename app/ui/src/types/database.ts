/**
 * Minimal Supabase Database typing until `supabase gen types` (US-006) replaces this file.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ProfileRow {
  username_key: string
  display_username: string
  last_auth_user_id: string | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow & Record<string, unknown>
        Insert: {
          username_key: string
          display_username: string
          last_auth_user_id?: string | null
        } & Record<string, unknown>
        Update: {
          display_username?: string
          last_auth_user_id?: string | null
          updated_at?: string
        } & Record<string, unknown>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      upsert_profile: {
        Args: {
          username_key: string
          display_username: string
        }
        Returns: ProfileRow
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
