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
      brand_settings: {
        Row: {
          accent_color: string | null
          apple_touch_icon_url: string | null
          asset_version: number | null
          background_color: string | null
          created_at: string
          default_thumbnail_url: string | null
          email_header_logo_url: string | null
          favicon_url: string | null
          id: string
          logo_dark_url: string | null
          logo_full_url: string | null
          logo_light_url: string | null
          logo_mark_url: string | null
          meta_description: string | null
          mobile_app_icon_url: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          primary_color: string | null
          secondary_color: string | null
          site_subtitle: string | null
          site_title: string | null
          text_color: string | null
          twitter_description: string | null
          twitter_image_url: string | null
          twitter_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          apple_touch_icon_url?: string | null
          asset_version?: number | null
          background_color?: string | null
          created_at?: string
          default_thumbnail_url?: string | null
          email_header_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_full_url?: string | null
          logo_light_url?: string | null
          logo_mark_url?: string | null
          meta_description?: string | null
          mobile_app_icon_url?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_subtitle?: string | null
          site_title?: string | null
          text_color?: string | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          apple_touch_icon_url?: string | null
          asset_version?: number | null
          background_color?: string | null
          created_at?: string
          default_thumbnail_url?: string | null
          email_header_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_full_url?: string | null
          logo_light_url?: string | null
          logo_mark_url?: string | null
          meta_description?: string | null
          mobile_app_icon_url?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_subtitle?: string | null
          site_title?: string | null
          text_color?: string | null
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          contact_name: string
          coverage_geo: string | null
          coverage_sector: string | null
          created_at: string
          email: string | null
          firm: string
          id: string
          notes: string | null
          phone: string | null
          responsiveness_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name: string
          coverage_geo?: string | null
          coverage_sector?: string | null
          created_at?: string
          email?: string | null
          firm: string
          id?: string
          notes?: string | null
          phone?: string | null
          responsiveness_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          coverage_geo?: string | null
          coverage_sector?: string | null
          created_at?: string
          email?: string | null
          firm?: string
          id?: string
          notes?: string | null
          phone?: string | null
          responsiveness_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          company_source: string | null
          company_status: string | null
          company_tags: string[] | null
          contact_id: string | null
          created_at: string
          description: string | null
          ebitda: number | null
          ebitda_band: string | null
          employee_count: number | null
          estimated_valuation: number | null
          geography: string | null
          id: string
          industry: string | null
          last_touched_at: string | null
          naics_code: string | null
          name: string
          notes: string | null
          ownership_type: string | null
          revenue: number | null
          revenue_band: string | null
          sic_code: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          attractiveness_score?: number | null
          company_source?: string | null
          company_status?: string | null
          company_tags?: string[] | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          ebitda?: number | null
          ebitda_band?: string | null
          employee_count?: number | null
          estimated_valuation?: number | null
          geography?: string | null
          id?: string
          industry?: string | null
          last_touched_at?: string | null
          naics_code?: string | null
          name: string
          notes?: string | null
          ownership_type?: string | null
          revenue?: number | null
          revenue_band?: string | null
          sic_code?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          attractiveness_score?: number | null
          company_source?: string | null
          company_status?: string | null
          company_tags?: string[] | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          ebitda?: number | null
          ebitda_band?: string | null
          employee_count?: number | null
          estimated_valuation?: number | null
          geography?: string | null
          id?: string
          industry?: string | null
          last_touched_at?: string | null
          naics_code?: string | null
          name?: string
          notes?: string | null
          ownership_type?: string | null
          revenue?: number | null
          revenue_band?: string | null
          sic_code?: string | null
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
      deals: {
        Row: {
          broker_id: string | null
          company_id: string | null
          created_at: string
          customer_concentration: string | null
          deal_ebitda: number | null
          deal_revenue: number | null
          ebitda_growth: number | null
          ebitda_margin: number | null
          entry_multiple: number | null
          exit_multiple: number | null
          expected_close_date: string | null
          hold_period: number | null
          id: string
          interest_rate: number | null
          leverage_pct: number | null
          name: string
          next_step: string | null
          notes: string | null
          nwc_notes: string | null
          probability: number | null
          recurring_rev_pct: number | null
          retention_proxy: string | null
          source: string | null
          stage: Database["public"]["Enums"]["deal_sourcing_stage"]
          structure_notes: string | null
          updated_at: string
          user_id: string
          valuation_notes: string | null
        }
        Insert: {
          broker_id?: string | null
          company_id?: string | null
          created_at?: string
          customer_concentration?: string | null
          deal_ebitda?: number | null
          deal_revenue?: number | null
          ebitda_growth?: number | null
          ebitda_margin?: number | null
          entry_multiple?: number | null
          exit_multiple?: number | null
          expected_close_date?: string | null
          hold_period?: number | null
          id?: string
          interest_rate?: number | null
          leverage_pct?: number | null
          name: string
          next_step?: string | null
          notes?: string | null
          nwc_notes?: string | null
          probability?: number | null
          recurring_rev_pct?: number | null
          retention_proxy?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_sourcing_stage"]
          structure_notes?: string | null
          updated_at?: string
          user_id: string
          valuation_notes?: string | null
        }
        Update: {
          broker_id?: string | null
          company_id?: string | null
          created_at?: string
          customer_concentration?: string | null
          deal_ebitda?: number | null
          deal_revenue?: number | null
          ebitda_growth?: number | null
          ebitda_margin?: number | null
          entry_multiple?: number | null
          exit_multiple?: number | null
          expected_close_date?: string | null
          hold_period?: number | null
          id?: string
          interest_rate?: number | null
          leverage_pct?: number | null
          name?: string
          next_step?: string | null
          notes?: string | null
          nwc_notes?: string | null
          probability?: number | null
          recurring_rev_pct?: number | null
          retention_proxy?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_sourcing_stage"]
          structure_notes?: string | null
          updated_at?: string
          user_id?: string
          valuation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_log: {
        Row: {
          created_at: string
          deal_id: string
          decision: string
          decision_date: string
          id: string
          lessons_learned: string | null
          next_action: string | null
          rationale: string | null
          reason_codes: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          decision?: string
          decision_date?: string
          id?: string
          lessons_learned?: string | null
          next_action?: string | null
          rationale?: string | null
          reason_codes?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          decision?: string
          decision_date?: string
          id?: string
          lessons_learned?: string | null
          next_action?: string | null
          rationale?: string | null
          reason_codes?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      diligence_items: {
        Row: {
          category: string | null
          comments: string | null
          created_at: string
          deal_id: string
          doc_link: string | null
          due_date: string | null
          id: string
          owner: string | null
          sort_order: number | null
          stage_template: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          comments?: string | null
          created_at?: string
          deal_id: string
          doc_link?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          sort_order?: number | null
          stage_template?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          comments?: string | null
          created_at?: string
          deal_id?: string
          doc_link?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          sort_order?: number | null
          stage_template?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diligence_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          document_type: string
          file_path: string
          file_type: string
          id: string
          investor_deal_id: string | null
          name: string
          size_bytes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          document_type?: string
          file_path: string
          file_type: string
          id?: string
          investor_deal_id?: string | null
          name: string
          size_bytes: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          document_type?: string
          file_path?: string
          file_type?: string
          id?: string
          investor_deal_id?: string | null
          name?: string
          size_bytes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_investor_deal_id_fkey"
            columns: ["investor_deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          created_at: string
          document_id: string
          email_id: string
          id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          email_id: string
          id?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          email_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_attachments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          id: string
          name: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          body_preview: string | null
          contact_id: string | null
          created_at: string
          direction: string
          external_id: string | null
          external_provider: string | null
          first_opened_at: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_read: boolean | null
          last_opened_at: string | null
          open_count: number | null
          received_at: string | null
          scheduled_send_at: string | null
          send_status: string
          subject: string | null
          thread_id: string | null
          to_emails: string[] | null
          tracking_id: string | null
          user_id: string
        }
        Insert: {
          body_preview?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string
          external_id?: string | null
          external_provider?: string | null
          first_opened_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          last_opened_at?: string | null
          open_count?: number | null
          received_at?: string | null
          scheduled_send_at?: string | null
          send_status?: string
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[] | null
          tracking_id?: string | null
          user_id: string
        }
        Update: {
          body_preview?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: string
          external_id?: string | null
          external_provider?: string | null
          first_opened_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          last_opened_at?: string | null
          open_count?: number | null
          received_at?: string | null
          scheduled_send_at?: string | null
          send_status?: string
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[] | null
          tracking_id?: string | null
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
      follow_up_sequences: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          follow_up_number: number
          id: string
          interval_days: number
          investor_deal_id: string | null
          last_sent_at: string | null
          max_follow_ups: number
          next_send_at: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          follow_up_number?: number
          id?: string
          interval_days?: number
          investor_deal_id?: string | null
          last_sent_at?: string | null
          max_follow_ups?: number
          next_send_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          follow_up_number?: number
          id?: string
          interval_days?: number
          investor_deal_id?: string | null
          last_sent_at?: string | null
          max_follow_ups?: number
          next_send_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_sequences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_sequences_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_sequences_investor_deal_id_fkey"
            columns: ["investor_deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_sequences_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_memos: {
        Row: {
          business_overview: string | null
          created_at: string
          deal_id: string
          id: string
          key_questions: string | null
          quality_assessment: string | null
          recommendation: string | null
          risks: string | null
          thesis: string | null
          updated_at: string
          user_id: string
          valuation_snapshot: string | null
        }
        Insert: {
          business_overview?: string | null
          created_at?: string
          deal_id: string
          id?: string
          key_questions?: string | null
          quality_assessment?: string | null
          recommendation?: string | null
          risks?: string | null
          thesis?: string | null
          updated_at?: string
          user_id: string
          valuation_snapshot?: string | null
        }
        Update: {
          business_overview?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          key_questions?: string | null
          quality_assessment?: string | null
          recommendation?: string | null
          risks?: string | null
          thesis?: string | null
          updated_at?: string
          user_id?: string
          valuation_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ic_memos_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      investor_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_count: number | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          color: string | null
          company_id: string | null
          contact_id: string | null
          content: string | null
          created_at: string
          id: string
          investor_deal_id: string | null
          is_pinned: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          investor_deal_id?: string | null
          is_pinned?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          investor_deal_id?: string | null
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_investor_deal_id_fkey"
            columns: ["investor_deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          currency: string
          display_name: string | null
          fundraising_goal: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          fundraising_goal?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          fundraising_goal?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_items: {
        Row: {
          created_at: string
          deal_id: string
          file_path: string | null
          id: string
          item_name: string
          notes: string | null
          received_date: string | null
          requested_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          file_path?: string | null
          id?: string
          item_name: string
          notes?: string | null
          received_date?: string | null
          requested_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          file_path?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          received_date?: string | null
          requested_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string
          entity_type: string
          filter_config: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_type?: string
          filter_config?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          filter_config?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_communications: {
        Row: {
          auto_send: boolean | null
          content: string | null
          created_at: string | null
          id: string
          last_sent_at: string | null
          recipient_ids: string[] | null
          recipient_type: string
          recurrence: string | null
          scheduled_for: string
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_send?: boolean | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_sent_at?: string | null
          recipient_ids?: string[] | null
          recipient_type?: string
          recurrence?: string | null
          scheduled_for: string
          status?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_send?: boolean | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_sent_at?: string | null
          recipient_ids?: string[] | null
          recipient_type?: string
          recurrence?: string | null
          scheduled_for?: string
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
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
          description: string | null
          due_date: string | null
          id: string
          investor_deal_id: string | null
          priority: string | null
          recurrence: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          investor_deal_id?: string | null
          priority?: string | null
          recurrence?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          investor_deal_id?: string | null
          priority?: string | null
          recurrence?: string | null
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
          {
            foreignKeyName: "tasks_investor_deal_id_fkey"
            columns: ["investor_deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      contact_type:
        | "investor"
        | "owner"
        | "intermediary"
        | "advisor"
        | "river_guide"
      deal_sourcing_stage:
        | "screening"
        | "contacted"
        | "teaser"
        | "cim"
        | "ioi"
        | "loi"
        | "dd"
        | "financing"
        | "signing"
        | "closed_won"
        | "lost"
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
      contact_type: [
        "investor",
        "owner",
        "intermediary",
        "advisor",
        "river_guide",
      ],
      deal_sourcing_stage: [
        "screening",
        "contacted",
        "teaser",
        "cim",
        "ioi",
        "loi",
        "dd",
        "financing",
        "signing",
        "closed_won",
        "lost",
      ],
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
