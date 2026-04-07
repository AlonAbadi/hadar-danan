// Hand-written types derived from supabase/schema.sql
// Conforms to the GenericTable / GenericSchema shape that @supabase/supabase-js v2 expects.
// Regenerate automatically with: npx supabase gen types typescript --project-id <ref>

export type UserStatus = "lead" | "engaged" | "high_intent" | "buyer" | "booked" | "premium_lead" | "partnership_lead";
export type ProductType = "challenge_197" | "workshop_1080" | "course_1800" | "strategy_4000" | "premium_14000";
export type PurchaseStatus = "pending" | "completed" | "failed" | "refunded";
export type JobStatus = "pending" | "running" | "done" | "failed";
export type EmailLogStatus = "sent" | "opened" | "clicked";
export type ExperimentStatus = "running" | "paused" | "concluded";
export type AbVariant = "A" | "B";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          name: string | null;
          status: UserStatus;
          segment: string | null;
          ab_variant: AbVariant | null;
          utm_source: string | null;
          utm_campaign: string | null;
          utm_adset: string | null;
          utm_ad: string | null;
          click_id: string | null;
          created_at: string;
          last_seen_at: string;
          marketing_consent: boolean;
          consent_at: string | null;
          hive_tier: string | null;
          hive_status: string | null;
          hive_started_at: string | null;
          hive_cancelled_at: string | null;
          hive_next_billing_date: string | null;
          auth_id: string | null;
          email_verified: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string | null;
          name?: string | null;
          status?: UserStatus;
          segment?: string | null;
          ab_variant?: AbVariant | null;
          utm_source?: string | null;
          utm_campaign?: string | null;
          utm_adset?: string | null;
          utm_ad?: string | null;
          click_id?: string | null;
          created_at?: string;
          last_seen_at?: string;
          marketing_consent?: boolean;
          consent_at?: string | null;
          hive_tier?: string | null;
          hive_status?: string | null;
          hive_started_at?: string | null;
          hive_cancelled_at?: string | null;
          hive_next_billing_date?: string | null;
          auth_id?: string | null;
          email_verified?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string | null;
          name?: string | null;
          status?: UserStatus;
          segment?: string | null;
          ab_variant?: AbVariant | null;
          utm_source?: string | null;
          utm_campaign?: string | null;
          utm_adset?: string | null;
          utm_ad?: string | null;
          click_id?: string | null;
          created_at?: string;
          last_seen_at?: string;
          marketing_consent?: boolean;
          consent_at?: string | null;
          hive_tier?: string | null;
          hive_status?: string | null;
          hive_started_at?: string | null;
          hive_cancelled_at?: string | null;
          hive_next_billing_date?: string | null;
          auth_id?: string | null;
          email_verified?: boolean;
        };
        Relationships: [];
      };

      identities: {
        Row: {
          id: string;
          anonymous_id: string;
          user_id: string | null;
          email: string | null;
          phone: string | null;
          first_seen: string;
          last_seen: string;
        };
        Insert: {
          id?: string;
          anonymous_id: string;
          user_id?: string | null;
          email?: string | null;
          phone?: string | null;
          first_seen?: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          anonymous_id?: string;
          user_id?: string | null;
          email?: string | null;
          phone?: string | null;
          first_seen?: string;
          last_seen?: string;
        };
        Relationships: [];
      };

      purchases: {
        Row: {
          id: string;
          user_id: string;
          product: ProductType;
          amount: number;
          currency: string;
          status: PurchaseStatus;
          cardcom_ref: string | null;
          is_recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product: ProductType;
          amount: number;
          currency?: string;
          status?: PurchaseStatus;
          cardcom_ref?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product?: ProductType;
          amount?: number;
          currency?: string;
          status?: PurchaseStatus;
          cardcom_ref?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      events: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string | null;
          type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          type: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          type?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };

      experiments: {
        Row: {
          id: string;
          name: string;
          variant_a_label: string;
          variant_b_label: string;
          visitors_a: number;
          visitors_b: number;
          conversions_a: number;
          conversions_b: number;
          winner: AbVariant | null;
          status: ExperimentStatus;
        };
        Insert: {
          id?: string;
          name: string;
          variant_a_label?: string;
          variant_b_label?: string;
          visitors_a?: number;
          visitors_b?: number;
          conversions_a?: number;
          conversions_b?: number;
          winner?: AbVariant | null;
          status?: ExperimentStatus;
        };
        Update: {
          id?: string;
          name?: string;
          variant_a_label?: string;
          variant_b_label?: string;
          visitors_a?: number;
          visitors_b?: number;
          conversions_a?: number;
          conversions_b?: number;
          winner?: AbVariant | null;
          status?: ExperimentStatus;
        };
        Relationships: [];
      };

      jobs: {
        Row: {
          id: string;
          type: string;
          payload: Record<string, unknown>;
          run_at: string;
          status: JobStatus;
          attempts: number;
          failed_permanently: boolean;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          payload?: Record<string, unknown>;
          run_at?: string;
          status?: JobStatus;
          attempts?: number;
          failed_permanently?: boolean;
          last_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          payload?: Record<string, unknown>;
          run_at?: string;
          status?: JobStatus;
          attempts?: number;
          failed_permanently?: boolean;
          last_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      email_sequences: {
        Row: {
          id: string;
          trigger_event: string;
          delay_hours: number;
          subject: string;
          template_key: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          trigger_event: string;
          delay_hours?: number;
          subject: string;
          template_key: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          trigger_event?: string;
          delay_hours?: number;
          subject?: string;
          template_key?: string;
          active?: boolean;
        };
        Relationships: [];
      };

      email_logs: {
        Row: {
          id: string;
          user_id: string;
          sequence_id: string | null;
          status: EmailLogStatus;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sequence_id?: string | null;
          status?: EmailLogStatus;
          sent_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sequence_id?: string | null;
          status?: EmailLogStatus;
          sent_at?: string;
        };
        Relationships: [];
      };

      error_logs: {
        Row: {
          id: string;
          context: string;
          error: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          context: string;
          error: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          context?: string;
          error?: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };

      bookings: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string;
          slot_date: string;   // ISO date e.g. '2026-04-15'
          slot_time: string;   // e.g. '10:00'
          status: string;      // 'confirmed' | 'cancelled'
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone: string;
          slot_date: string;
          slot_time: string;
          status?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string;
          slot_date?: string;
          slot_time?: string;
          status?: string;
          notes?: string | null;
        };
        Relationships: [];
      };

      ab_proposals: {
        Row: {
          id: string;
          category: string;
          title: string;
          hypothesis: string;
          variant_a: string;
          variant_b: string;
          metric: string;
          page_or_element: string;
          estimated_traffic: number;
          days_to_significance: number;
          priority: string;
          reasoning: string | null;
          status: string;
          visitors_a: number;
          visitors_b: number;
          conversions_a: number;
          conversions_b: number;
          confidence: number;
          winner: string | null;
          approved_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          title: string;
          hypothesis: string;
          variant_a: string;
          variant_b: string;
          metric: string;
          page_or_element: string;
          estimated_traffic?: number;
          days_to_significance?: number;
          priority?: string;
          reasoning?: string | null;
          status?: string;
          visitors_a?: number;
          visitors_b?: number;
          conversions_a?: number;
          conversions_b?: number;
          confidence?: number;
          winner?: string | null;
          approved_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          title?: string;
          hypothesis?: string;
          variant_a?: string;
          variant_b?: string;
          metric?: string;
          page_or_element?: string;
          estimated_traffic?: number;
          days_to_significance?: number;
          priority?: string;
          reasoning?: string | null;
          status?: string;
          visitors_a?: number;
          visitors_b?: number;
          conversions_a?: number;
          conversions_b?: number;
          confidence?: number;
          winner?: string | null;
          approved_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };

      video_events: {
        Row: {
          id: string;
          user_email: string | null;
          anon_id: string | null;
          video_id: string;
          event_type: string;
          percent_watched: number | null;
          drop_off_second: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email?: string | null;
          anon_id?: string | null;
          video_id: string;
          event_type: string;
          percent_watched?: number | null;
          drop_off_second?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_email?: string | null;
          anon_id?: string | null;
          video_id?: string;
          event_type?: string;
          percent_watched?: number | null;
          drop_off_second?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };

      quiz_results: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string | null;
          answers: Record<string, string>;
          scores: Record<string, number>;
          recommended_product: string;
          second_product: string | null;
          match_percent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          answers?: Record<string, string>;
          scores?: Record<string, number>;
          recommended_product: string;
          second_product?: string | null;
          match_percent?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          answers?: Record<string, string>;
          scores?: Record<string, number>;
          recommended_product?: string;
          second_product?: string | null;
          match_percent?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      v_funnel_stats: {
        Row: {
          leads: number | null;
          engaged: number | null;
          high_intent: number | null;
          buyers: number | null;
          booked: number | null;
          signups_today: number | null;
          signups_week: number | null;
          signups_month: number | null;
        };
        Relationships: [];
      };
      v_ab_results: {
        Row: {
          name: string | null;
          variant_a_label: string | null;
          variant_b_label: string | null;
          visitors_a: number | null;
          visitors_b: number | null;
          conversions_a: number | null;
          conversions_b: number | null;
          cvr_a: number | null;
          cvr_b: number | null;
          winner: AbVariant | null;
          status: ExperimentStatus | null;
        };
        Relationships: [];
      };
      v_recent_errors: {
        Row: {
          id: string | null;
          context: string | null;
          error: string | null;
          payload: Record<string, unknown> | null;
          created_at: string | null;
        };
        Relationships: [];
      };
    };

    Functions: {
      increment_experiment: {
        Args: { p_name: string; p_column: string };
        Returns: undefined;
      };
    };
  };
}
