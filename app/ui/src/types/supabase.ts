/**
 * Supabase Database types for the learn-app schema.
 * Regenerate after migrations: `yarn supabase:types` (from app/ui).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          username_key: string
          display_username: string
          last_auth_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          username_key: string
          display_username: string
          last_auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username_key?: string
          display_username?: string
          last_auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          id: string
          source_type: Database['public']['Enums']['problem_source_type']
          title: string
          difficulty: Database['public']['Enums']['difficulty']
          tags: string[]
          supported_languages: Database['public']['Enums']['language'][]
          current_published_version_id: string | null
          created_by_username_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          source_type: Database['public']['Enums']['problem_source_type']
          title: string
          difficulty: Database['public']['Enums']['difficulty']
          tags?: string[]
          supported_languages: Database['public']['Enums']['language'][]
          current_published_version_id?: string | null
          created_by_username_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source_type?: Database['public']['Enums']['problem_source_type']
          title?: string
          difficulty?: Database['public']['Enums']['difficulty']
          tags?: string[]
          supported_languages?: Database['public']['Enums']['language'][]
          current_published_version_id?: string | null
          created_by_username_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      problem_versions: {
        Row: {
          id: string
          problem_id: string
          version_number: number | null
          status: Database['public']['Enums']['problem_version_status']
          title: string
          difficulty: Database['public']['Enums']['difficulty']
          tags: string[]
          supported_languages: Database['public']['Enums']['language'][]
          visible_test_count: number
          parsed_frontmatter: Json
          mdx_storage_path: string
          content_hash: string
          created_by_username_key: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_id: string
          version_number?: number | null
          status?: Database['public']['Enums']['problem_version_status']
          title: string
          difficulty: Database['public']['Enums']['difficulty']
          tags?: string[]
          supported_languages: Database['public']['Enums']['language'][]
          visible_test_count: number
          parsed_frontmatter: Json
          mdx_storage_path: string
          content_hash: string
          created_by_username_key?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_id?: string
          version_number?: number | null
          status?: Database['public']['Enums']['problem_version_status']
          title?: string
          difficulty?: Database['public']['Enums']['difficulty']
          tags?: string[]
          supported_languages?: Database['public']['Enums']['language'][]
          visible_test_count?: number
          parsed_frontmatter?: Json
          mdx_storage_path?: string
          content_hash?: string
          created_by_username_key?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      attempts: {
        Row: {
          username_key: string
          problem_id: string
          problem_version_id: string
          language: Database['public']['Enums']['language']
          code_text: string
          updated_at: string
        }
        Insert: {
          username_key: string
          problem_id: string
          problem_version_id: string
          language: Database['public']['Enums']['language']
          code_text: string
          updated_at?: string
        }
        Update: {
          username_key?: string
          problem_id?: string
          problem_version_id?: string
          language?: Database['public']['Enums']['language']
          code_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          id: string
          username_key: string
          problem_id: string
          problem_version_id: string
          language: Database['public']['Enums']['language']
          code_storage_path: string
          code_preview: string
          result: Json
          passed: number
          total: number
          solved: boolean
          pinned_best: boolean
          archived: boolean
          duration_ms: number
          stdout_bytes: number
          created_at: string
        }
        Insert: {
          id: string
          username_key: string
          problem_id: string
          problem_version_id: string
          language: Database['public']['Enums']['language']
          code_storage_path: string
          code_preview?: string
          result: Json
          passed: number
          total: number
          solved: boolean
          pinned_best?: boolean
          archived?: boolean
          duration_ms: number
          stdout_bytes: number
          created_at?: string
        }
        Update: {
          id?: string
          username_key?: string
          problem_id?: string
          problem_version_id?: string
          language?: Database['public']['Enums']['language']
          code_storage_path?: string
          code_preview?: string
          result?: Json
          passed?: number
          total?: number
          solved?: boolean
          pinned_best?: boolean
          archived?: boolean
          duration_ms?: number
          stdout_bytes?: number
          created_at?: string
        }
        Relationships: []
      }
      problem_progress: {
        Row: {
          username_key: string
          problem_id: string
          started_problem_version_id: string
          latest_attempted_problem_version_id: string
          overall_state: string
          pinned_best_submission_id: string | null
          last_activity_at: string
        }
        Insert: {
          username_key: string
          problem_id: string
          started_problem_version_id: string
          latest_attempted_problem_version_id: string
          overall_state: string
          pinned_best_submission_id?: string | null
          last_activity_at?: string
        }
        Update: {
          username_key?: string
          problem_id?: string
          started_problem_version_id?: string
          latest_attempted_problem_version_id?: string
          overall_state?: string
          pinned_best_submission_id?: string | null
          last_activity_at?: string
        }
        Relationships: []
      }
      language_progress: {
        Row: {
          username_key: string
          problem_id: string
          language: Database['public']['Enums']['language']
          attempted: boolean
          latest_submission_id: string | null
          pinned_best_submission_id: string | null
          last_activity_at: string
        }
        Insert: {
          username_key: string
          problem_id: string
          language: Database['public']['Enums']['language']
          attempted?: boolean
          latest_submission_id?: string | null
          pinned_best_submission_id?: string | null
          last_activity_at?: string
        }
        Update: {
          username_key?: string
          problem_id?: string
          language?: Database['public']['Enums']['language']
          attempted?: boolean
          latest_submission_id?: string | null
          pinned_best_submission_id?: string | null
          last_activity_at?: string
        }
        Relationships: []
      }
      solved_versions: {
        Row: {
          username_key: string
          problem_id: string
          problem_version_id: string
          language: Database['public']['Enums']['language']
          submission_id: string
          solved_at: string
        }
        Insert: {
          username_key: string
          problem_id: string
          problem_version_id: string
          language: Database['public']['Enums']['language']
          submission_id: string
          solved_at?: string
        }
        Update: {
          username_key?: string
          problem_id?: string
          problem_version_id?: string
          language?: Database['public']['Enums']['language']
          submission_id?: string
          solved_at?: string
        }
        Relationships: []
      }
      activity_events: {
        Row: {
          id: string
          type: Database['public']['Enums']['activity_event_type']
          username_key: string
          display_username: string
          problem_id: string | null
          problem_title: string | null
          problem_version_id: string | null
          problem_version_number: number | null
          submission_id: string | null
          language: Database['public']['Enums']['language'] | null
          submission_solved: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          type: Database['public']['Enums']['activity_event_type']
          username_key: string
          display_username: string
          problem_id?: string | null
          problem_title?: string | null
          problem_version_id?: string | null
          problem_version_number?: number | null
          submission_id?: string | null
          language?: Database['public']['Enums']['language'] | null
          submission_solved?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: Database['public']['Enums']['activity_event_type']
          username_key?: string
          display_username?: string
          problem_id?: string | null
          problem_title?: string | null
          problem_version_id?: string | null
          problem_version_number?: number | null
          submission_id?: string | null
          language?: Database['public']['Enums']['language'] | null
          submission_solved?: boolean | null
          created_at?: string
        }
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
        Returns: Database['public']['Tables']['profiles']['Row']
      }
      publish_problem_version: {
        Args: {
          draft_version_id: string
        }
        Returns: Json
      }
      commit_submission: {
        Args: {
          input: Json
        }
        Returns: Json
      }
      pin_best_submission: {
        Args: {
          submission_id: string
          username_key: string
        }
        Returns: Json
      }
      switch_problem_version: {
        Args: {
          username_key: string
          problem_id: string
          problem_version_id: string
        }
        Returns: Json
      }
      compute_problem_overall_state: {
        Args: {
          p_username_key: string
          p_problem_id: string
        }
        Returns: string
      }
    }
    Enums: {
      language: 'javascript' | 'php'
      difficulty: 'easy' | 'medium' | 'hard'
      problem_source_type: 'official_repo' | 'user_upload'
      problem_version_status: 'draft' | 'published' | 'archived'
      activity_event_type:
        | 'started_attempting'
        | 'submitted_attempt'
        | 'solved_problem'
        | 'published_problem'
        | 'pinned_best_submission'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
