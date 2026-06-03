export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          display_username: string
          id: string
          language: Database["public"]["Enums"]["language"] | null
          problem_id: string | null
          problem_title: string | null
          problem_version_id: string | null
          problem_version_number: number | null
          submission_id: string | null
          submission_solved: boolean | null
          type: Database["public"]["Enums"]["activity_event_type"]
          username_key: string
        }
        Insert: {
          created_at?: string
          display_username: string
          id?: string
          language?: Database["public"]["Enums"]["language"] | null
          problem_id?: string | null
          problem_title?: string | null
          problem_version_id?: string | null
          problem_version_number?: number | null
          submission_id?: string | null
          submission_solved?: boolean | null
          type: Database["public"]["Enums"]["activity_event_type"]
          username_key: string
        }
        Update: {
          created_at?: string
          display_username?: string
          id?: string
          language?: Database["public"]["Enums"]["language"] | null
          problem_id?: string | null
          problem_title?: string | null
          problem_version_id?: string | null
          problem_version_number?: number | null
          submission_id?: string | null
          submission_solved?: boolean | null
          type?: Database["public"]["Enums"]["activity_event_type"]
          username_key?: string
        }
        Relationships: []
      }
      attempts: {
        Row: {
          code_text: string
          language: Database["public"]["Enums"]["language"]
          problem_id: string
          problem_version_id: string
          updated_at: string
          username_key: string
        }
        Insert: {
          code_text: string
          language: Database["public"]["Enums"]["language"]
          problem_id: string
          problem_version_id: string
          updated_at?: string
          username_key: string
        }
        Update: {
          code_text?: string
          language?: Database["public"]["Enums"]["language"]
          problem_id?: string
          problem_version_id?: string
          updated_at?: string
          username_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_problem_version_id_fkey"
            columns: ["problem_version_id"]
            isOneToOne: false
            referencedRelation: "problem_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_username_key_fkey"
            columns: ["username_key"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username_key"]
          },
        ]
      }
      language_progress: {
        Row: {
          attempted: boolean
          language: Database["public"]["Enums"]["language"]
          last_activity_at: string
          latest_submission_id: string | null
          pinned_best_submission_id: string | null
          problem_id: string
          username_key: string
        }
        Insert: {
          attempted?: boolean
          language: Database["public"]["Enums"]["language"]
          last_activity_at?: string
          latest_submission_id?: string | null
          pinned_best_submission_id?: string | null
          problem_id: string
          username_key: string
        }
        Update: {
          attempted?: boolean
          language?: Database["public"]["Enums"]["language"]
          last_activity_at?: string
          latest_submission_id?: string | null
          pinned_best_submission_id?: string | null
          problem_id?: string
          username_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "language_progress_latest_submission_id_fkey"
            columns: ["latest_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "language_progress_pinned_best_submission_id_fkey"
            columns: ["pinned_best_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "language_progress_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "language_progress_username_key_fkey"
            columns: ["username_key"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username_key"]
          },
        ]
      }
      problem_progress: {
        Row: {
          last_activity_at: string
          latest_attempted_problem_version_id: string
          overall_state: string
          pinned_best_submission_id: string | null
          problem_id: string
          started_problem_version_id: string
          username_key: string
        }
        Insert: {
          last_activity_at?: string
          latest_attempted_problem_version_id: string
          overall_state: string
          pinned_best_submission_id?: string | null
          problem_id: string
          started_problem_version_id: string
          username_key: string
        }
        Update: {
          last_activity_at?: string
          latest_attempted_problem_version_id?: string
          overall_state?: string
          pinned_best_submission_id?: string | null
          problem_id?: string
          started_problem_version_id?: string
          username_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_progress_latest_attempted_problem_version_id_fkey"
            columns: ["latest_attempted_problem_version_id"]
            isOneToOne: false
            referencedRelation: "problem_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_progress_pinned_best_submission_id_fkey"
            columns: ["pinned_best_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_progress_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_progress_started_problem_version_id_fkey"
            columns: ["started_problem_version_id"]
            isOneToOne: false
            referencedRelation: "problem_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_progress_username_key_fkey"
            columns: ["username_key"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username_key"]
          },
        ]
      }
      problem_versions: {
        Row: {
          content_hash: string
          created_at: string
          created_by_username_key: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          mdx_storage_path: string
          parsed_frontmatter: Json
          problem_id: string
          published_at: string | null
          status: Database["public"]["Enums"]["problem_version_status"]
          supported_languages: Database["public"]["Enums"]["language"][]
          tags: string[]
          title: string
          updated_at: string
          version_number: number | null
          visible_test_count: number
        }
        Insert: {
          content_hash: string
          created_at?: string
          created_by_username_key?: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          id?: string
          mdx_storage_path: string
          parsed_frontmatter: Json
          problem_id: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["problem_version_status"]
          supported_languages: Database["public"]["Enums"]["language"][]
          tags?: string[]
          title: string
          updated_at?: string
          version_number?: number | null
          visible_test_count: number
        }
        Update: {
          content_hash?: string
          created_at?: string
          created_by_username_key?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          mdx_storage_path?: string
          parsed_frontmatter?: Json
          problem_id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["problem_version_status"]
          supported_languages?: Database["public"]["Enums"]["language"][]
          tags?: string[]
          title?: string
          updated_at?: string
          version_number?: number | null
          visible_test_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "problem_versions_created_by_username_key_fkey"
            columns: ["created_by_username_key"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username_key"]
          },
          {
            foreignKeyName: "problem_versions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          created_at: string
          created_by_username_key: string | null
          current_published_version_id: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          source_type: Database["public"]["Enums"]["problem_source_type"]
          supported_languages: Database["public"]["Enums"]["language"][]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_username_key?: string | null
          current_published_version_id?: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          source_type: Database["public"]["Enums"]["problem_source_type"]
          supported_languages: Database["public"]["Enums"]["language"][]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_username_key?: string | null
          current_published_version_id?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          source_type?: Database["public"]["Enums"]["problem_source_type"]
          supported_languages?: Database["public"]["Enums"]["language"][]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "problems_created_by_username_key_fkey"
            columns: ["created_by_username_key"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username_key"]
          },
          {
            foreignKeyName: "problems_current_published_version_id_fkey"
            columns: ["current_published_version_id"]
            isOneToOne: false
            referencedRelation: "problem_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_username: string
          last_auth_user_id: string | null
          updated_at: string
          username_key: string
        }
        Insert: {
          created_at?: string
          display_username: string
          last_auth_user_id?: string | null
          updated_at?: string
          username_key: string
        }
        Update: {
          created_at?: string
          display_username?: string
          last_auth_user_id?: string | null
          updated_at?: string
          username_key?: string
        }
        Relationships: []
      }
      solved_versions: {
        Row: {
          language: Database["public"]["Enums"]["language"]
          problem_id: string
          problem_version_id: string
          solved_at: string
          submission_id: string
          username_key: string
        }
        Insert: {
          language: Database["public"]["Enums"]["language"]
          problem_id: string
          problem_version_id: string
          solved_at?: string
          submission_id: string
          username_key: string
        }
        Update: {
          language?: Database["public"]["Enums"]["language"]
          problem_id?: string
          problem_version_id?: string
          solved_at?: string
          submission_id?: string
          username_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "solved_versions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solved_versions_problem_version_id_fkey"
            columns: ["problem_version_id"]
            isOneToOne: false
            referencedRelation: "problem_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solved_versions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solved_versions_username_key_fkey"
            columns: ["username_key"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username_key"]
          },
        ]
      }
      submissions: {
        Row: {
          archived: boolean
          code_preview: string
          code_storage_path: string
          created_at: string
          duration_ms: number
          id: string
          language: Database["public"]["Enums"]["language"]
          passed: number
          pinned_best: boolean
          problem_id: string
          problem_version_id: string
          result: Json
          solved: boolean
          stdout_bytes: number
          total: number
          username_key: string
        }
        Insert: {
          archived?: boolean
          code_preview?: string
          code_storage_path: string
          created_at?: string
          duration_ms: number
          id: string
          language: Database["public"]["Enums"]["language"]
          passed: number
          pinned_best?: boolean
          problem_id: string
          problem_version_id: string
          result: Json
          solved: boolean
          stdout_bytes: number
          total: number
          username_key: string
        }
        Update: {
          archived?: boolean
          code_preview?: string
          code_storage_path?: string
          created_at?: string
          duration_ms?: number
          id?: string
          language?: Database["public"]["Enums"]["language"]
          passed?: number
          pinned_best?: boolean
          problem_id?: string
          problem_version_id?: string
          result?: Json
          solved?: boolean
          stdout_bytes?: number
          total?: number
          username_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_problem_version_id_fkey"
            columns: ["problem_version_id"]
            isOneToOne: false
            referencedRelation: "problem_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_username_key_fkey"
            columns: ["username_key"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username_key"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      commit_submission: { Args: { input: Json }; Returns: Json }
      compute_problem_overall_state: {
        Args: { p_problem_id: string; p_username_key: string }
        Returns: string
      }
      pin_best_submission: {
        Args: { p_submission_id: string; p_username_key: string }
        Returns: Json
      }
      publish_problem_version: {
        Args: { draft_version_id: string }
        Returns: Json
      }
      switch_problem_version: {
        Args: {
          p_problem_id: string
          p_problem_version_id: string
          p_username_key: string
        }
        Returns: Json
      }
      upsert_profile: {
        Args: { p_display_username: string; p_username_key: string }
        Returns: {
          created_at: string
          display_username: string
          last_auth_user_id: string | null
          updated_at: string
          username_key: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      activity_event_type:
        | "started_attempting"
        | "submitted_attempt"
        | "solved_problem"
        | "published_problem"
        | "pinned_best_submission"
      difficulty: "easy" | "medium" | "hard"
      language: "javascript" | "php"
      problem_source_type: "official_repo" | "user_upload"
      problem_version_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_event_type: [
        "started_attempting",
        "submitted_attempt",
        "solved_problem",
        "published_problem",
        "pinned_best_submission",
      ],
      difficulty: ["easy", "medium", "hard"],
      language: ["javascript", "php"],
      problem_source_type: ["official_repo", "user_upload"],
      problem_version_status: ["draft", "published", "archived"],
    },
  },
} as const
