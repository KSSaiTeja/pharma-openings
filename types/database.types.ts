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
      admin_candidate_notes: {
        Row: {
          admin_email: string | null
          body: string
          candidate_id: string
          created_at: string
          id: string
        }
        Insert: {
          admin_email?: string | null
          body: string
          candidate_id: string
          created_at?: string
          id?: string
        }
        Update: {
          admin_email?: string | null
          body?: string
          candidate_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          candidate_id: string | null
          created_at: string
          current_company: string | null
          current_department: string | null
          current_designation: string | null
          email: string
          full_name: string
          highest_qualification: string | null
          id: string
          job_id: string
          mobile: string
          resume_url: string | null
          snapshot_company: string | null
          snapshot_department: string | null
          snapshot_designation: string | null
          snapshot_qualification: string | null
          snapshot_resume_url: string | null
          status: string
          status_changed_at: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          current_company?: string | null
          current_department?: string | null
          current_designation?: string | null
          email: string
          full_name: string
          highest_qualification?: string | null
          id?: string
          job_id: string
          mobile: string
          resume_url?: string | null
          snapshot_company?: string | null
          snapshot_department?: string | null
          snapshot_designation?: string | null
          snapshot_qualification?: string | null
          snapshot_resume_url?: string | null
          status?: string
          status_changed_at?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          current_company?: string | null
          current_department?: string | null
          current_designation?: string | null
          email?: string
          full_name?: string
          highest_qualification?: string | null
          id?: string
          job_id?: string
          mobile?: string
          resume_url?: string | null
          snapshot_company?: string | null
          snapshot_department?: string | null
          snapshot_designation?: string | null
          snapshot_qualification?: string | null
          snapshot_resume_url?: string | null
          status?: string
          status_changed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          current_company: string | null
          current_department: string | null
          current_designation: string | null
          current_sub_department: string | null
          department_custom: string | null
          designation_custom: string | null
          email: string
          full_name: string
          highest_qualification: string | null
          id: string
          mobile: string
          notice_period: string | null
          otp_verified: boolean
          preferred_location: string | null
          preferred_modules: string[] | null
          resume_url: string | null
          sub_department_custom: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_company?: string | null
          current_department?: string | null
          current_designation?: string | null
          current_sub_department?: string | null
          department_custom?: string | null
          designation_custom?: string | null
          email: string
          full_name: string
          highest_qualification?: string | null
          id?: string
          mobile: string
          notice_period?: string | null
          otp_verified?: boolean
          preferred_location?: string | null
          preferred_modules?: string[] | null
          resume_url?: string | null
          sub_department_custom?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_company?: string | null
          current_department?: string | null
          current_designation?: string | null
          current_sub_department?: string | null
          department_custom?: string | null
          designation_custom?: string | null
          email?: string
          full_name?: string
          highest_qualification?: string | null
          id?: string
          mobile?: string
          notice_period?: string | null
          otp_verified?: boolean
          preferred_location?: string | null
          preferred_modules?: string[] | null
          resume_url?: string | null
          sub_department_custom?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          department: string | null
          description: string
          id: string
          is_active: boolean
          location: string
          module: string | null
          qualification_needed: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          description: string
          id?: string
          is_active?: boolean
          location: string
          module?: string | null
          qualification_needed?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string
          id?: string
          is_active?: boolean
          location?: string
          module?: string | null
          qualification_needed?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          mobile: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          mobile: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          mobile?: string
          verified?: boolean
        }
        Relationships: []
      }
      otp_mobile_lockouts: {
        Row: {
          created_at: string
          locked_until: string
          mobile: string
        }
        Insert: {
          created_at?: string
          locked_until: string
          mobile: string
        }
        Update: {
          created_at?: string
          locked_until?: string
          mobile?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          job_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_job_filter_facets: { Args: Record<PropertyKey, never>; Returns: Json }
      count_talent_pool_candidates: { Args: Record<PropertyKey, never>; Returns: string }
      po_request_mobile_header: { Args: never; Returns: string }
      talent_pool_candidates_page: {
        Args: {
          p_limit: number
          p_location?: string | null
          p_module?: string | null
          p_offset: number
          p_qual?: string | null
          p_search?: string | null
        }
        Returns: Json
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
    Enums: {},
  },
} as const

/** Table row aliases (Supabase codegen convenience). */
export type JobRow = Database["public"]["Tables"]["jobs"]["Row"]
export type CandidateRow = Database["public"]["Tables"]["candidates"]["Row"]
export type AdminCandidateNoteRow = Database["public"]["Tables"]["admin_candidate_notes"]["Row"]
export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"]
export type SavedJobRow = Database["public"]["Tables"]["saved_jobs"]["Row"]
