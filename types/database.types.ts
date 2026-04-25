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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      po_request_mobile_header: { Args: never; Returns: string }
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
