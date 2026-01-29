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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          investor_deal_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          investor_deal_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          investor_deal_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_investor_deal_id_fkey"
            columns: ["investor_deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          end_time: string
          external_id: string | null
          external_provider: string | null
          id: string
          investor_deal_id: string | null
          location: string | null
          meeting_link: string | null
          meeting_type: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          investor_deal_id?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          external_id?: string | null
          external_provider?: string | null
          id?: string
          investor_deal_id?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_investor_deal_id_fkey"
            columns: ["investor_deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          attractiveness_score: number | null
          contact_id: string | null
          created_at: string
          ebitda: number | null
          estimated_valuation: number | null
          geography: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          revenue: number | null
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          attractiveness_score?: number | null
          contact_id?: string | null
          created_at?: string
          ebitda?: number | null
          estimated_valuation?: number | null
          geography?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          revenue?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          attractiveness_score?: number | null
          contact_id?: string | null
          created_at?: string
          ebitda?: number | null
          estimated_valuation?: number | null
          geography?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          revenue?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          email: string | null
          geography: string | null
          id: string
          influence: Database["public"]["Enums"]["influence_level"] | null
          last_interaction_at: string | null
          likelihood: Database["public"]["Enums"]["likelihood_level"] | null
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          role: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          warmth: Database["public"]["Enums"]["warmth_level"] | null
        }
        Insert: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          geography?: string | null
          id?: string
          influence?: Database["public"]["Enums"]["influence_level"] | null
          last_interaction_at?: string | null
          likelihood?: Database["public"]["Enums"]["likelihood_level"] | null
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          warmth?: Database["public"]["Enums"]["warmth_level"] | null
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          geography?: string | null
          id?: string
          influence?: Database["public"]["Enums"]["influence_level"] | null
          last_interaction_at?: string | null
          likelihood?: Database["public"]["Enums"]["likelihood_level"] | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          warmth?: Database["public"]["Enums"]["warmth_level"] | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          body_preview: string | null
          contact_id: string | null
          created_at: string
          external_id: string | null
          external_provider: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_read: boolean | null
          received_at: string | null
          subject: string | null
          thread_id: string | null
          to_emails: string[] | null
          user_id: string
        }
        Insert: {
          body_preview?: string | null
          contact_id?: string | null
          created_at?: string
          external_id?: string | null
          external_provider?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          received_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[] | null
          user_id: string
        }
        Update: {
          body_preview?: string | null
          contact_id?: string | null
          created_at?: string
          external_id?: string | null
          external_provider?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          received_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_deals: {
        Row: {
          commitment_amount: number | null
          contact_id: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization: string | null
          stage: Database["public"]["Enums"]["investor_stage"]
          updated_at: string
          user_id: string
        }
        Insert: {
          commitment_amount?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization?: string | null
          stage?: Database["public"]["Enums"]["investor_stage"]
          updated_at?: string
          user_id: string
        }
        Update: {
          commitment_amount?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization?: string | null
          stage?: Database["public"]["Enums"]["investor_stage"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          company_id: string | null
          completed: boolean | null
          contact_id: string | null
          created_at: string
          due_date: string | null
          id: string
          priority: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          provider: string
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_type: "investor" | "owner" | "intermediary" | "advisor"
      deal_stage:
        | "identified"
        | "researching"
        | "outreach_sent"
        | "follow_up"
        | "nda_sent"
        | "nda_signed"
        | "in_discussion"
        | "passed"
        | "due_diligence"
        | "loi"
        | "closed"
      influence_level: "low" | "medium" | "high"
      investor_stage:
        | "not_contacted"
        | "outreach_sent"
        | "follow_up"
        | "meeting_scheduled"
        | "interested"
        | "passed"
        | "committed"
        | "closed"
      likelihood_level: "low" | "medium" | "high"
      warmth_level: "cold" | "warm" | "hot"
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
      contact_type: ["investor", "owner", "intermediary", "advisor"],
      deal_stage: [
        "identified",
        "researching",
        "outreach_sent",
        "follow_up",
        "nda_sent",
        "nda_signed",
        "in_discussion",
        "passed",
        "due_diligence",
        "loi",
        "closed",
      ],
      influence_level: ["low", "medium", "high"],
      investor_stage: [
        "not_contacted",
        "outreach_sent",
        "follow_up",
        "meeting_scheduled",
        "interested",
        "passed",
        "committed",
        "closed",
      ],
      likelihood_level: ["low", "medium", "high"],
      warmth_level: ["cold", "warm", "hot"],
    },
  },
} as const
