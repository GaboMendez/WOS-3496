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
      alliance_events: {
        Row: {
          alliance_id: string
          days: string | null
          id: string
          name: string
          notes: string | null
          sort_order: number
          utc_time: string | null
        }
        Insert: {
          alliance_id: string
          days?: string | null
          id?: string
          name: string
          notes?: string | null
          sort_order?: number
          utc_time?: string | null
        }
        Update: {
          alliance_id?: string
          days?: string | null
          id?: string
          name?: string
          notes?: string | null
          sort_order?: number
          utc_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alliance_events_alliance_id_fkey"
            columns: ["alliance_id"]
            isOneToOne: false
            referencedRelation: "alliances"
            referencedColumns: ["id"]
          },
        ]
      }
      alliance_leaders: {
        Row: {
          alliance_id: string
          discord_handle: string | null
          id: string
          name: string
          rank_title: string
          sort_order: number
        }
        Insert: {
          alliance_id: string
          discord_handle?: string | null
          id?: string
          name: string
          rank_title?: string
          sort_order?: number
        }
        Update: {
          alliance_id?: string
          discord_handle?: string | null
          id?: string
          name?: string
          rank_title?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "alliance_leaders_alliance_id_fkey"
            columns: ["alliance_id"]
            isOneToOne: false
            referencedRelation: "alliances"
            referencedColumns: ["id"]
          },
        ]
      }
      alliances: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          discord_url: string | null
          hq_coordinates: string | null
          id: string
          name: string
          open_spots: number
          playstyle: string | null
          power: number
          published: boolean
          recruiting_status: string
          short_description: string | null
          slug: string
          sort_rank: number
          svs_contribution: string | null
          tag: string
          timezone_label: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          hq_coordinates?: string | null
          id?: string
          name: string
          open_spots?: number
          playstyle?: string | null
          power?: number
          published?: boolean
          recruiting_status?: string
          short_description?: string | null
          slug: string
          sort_rank?: number
          svs_contribution?: string | null
          tag: string
          timezone_label?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          hq_coordinates?: string | null
          id?: string
          name?: string
          open_spots?: number
          playstyle?: string | null
          power?: number
          published?: boolean
          recruiting_status?: string
          short_description?: string | null
          slug?: string
          sort_rank?: number
          svs_contribution?: string | null
          tag?: string
          timezone_label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string | null
          created_at: string
          id: string
          pinned: boolean
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          avatar_url: string | null
          bio: string | null
          content_type: string | null
          created_at: string
          featured: boolean
          handle: string | null
          id: string
          name: string
          platform: string | null
          published: boolean
          sort_order: number
          updated_at: string
          url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          content_type?: string | null
          created_at?: string
          featured?: boolean
          handle?: string | null
          id?: string
          name: string
          platform?: string | null
          published?: boolean
          sort_order?: number
          updated_at?: string
          url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          content_type?: string | null
          created_at?: string
          featured?: boolean
          handle?: string | null
          id?: string
          name?: string
          platform?: string | null
          published?: boolean
          sort_order?: number
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      governance_documents: {
        Row: {
          created_at: string
          effective_date: string | null
          id: string
          revised_date: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          id?: string
          revised_date?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          id?: string
          revised_date?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      governance_sections: {
        Row: {
          anchor: string
          body: string | null
          document_id: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          anchor: string
          body?: string | null
          document_id: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          anchor?: string
          body?: string | null
          document_id?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "governance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          storage_path?: string | null
          url?: string
        }
        Relationships: []
      }
      operations_content: {
        Row: {
          body: string | null
          created_at: string
          id: string
          published: boolean
          section_key: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          section_key?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          section_key?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      state_settings: {
        Row: {
          current_event: string | null
          disclaimer: string
          discord_url: string | null
          display_name: string
          eligibility_range: string | null
          hero_generation: string | null
          hero_image_url: string | null
          id: string
          launch_date: string | null
          next_event_date: string | null
          power_cap_note: string | null
          recruiting_status: string | null
          social_links: Json
          state_number: number
          tagline: string | null
          timezone: string
          transfer_group: string | null
          transfer_spots: number | null
          updated_at: string
        }
        Insert: {
          current_event?: string | null
          disclaimer?: string
          discord_url?: string | null
          display_name?: string
          eligibility_range?: string | null
          hero_generation?: string | null
          hero_image_url?: string | null
          id?: string
          launch_date?: string | null
          next_event_date?: string | null
          power_cap_note?: string | null
          recruiting_status?: string | null
          social_links?: Json
          state_number?: number
          tagline?: string | null
          timezone?: string
          transfer_group?: string | null
          transfer_spots?: number | null
          updated_at?: string
        }
        Update: {
          current_event?: string | null
          disclaimer?: string
          discord_url?: string | null
          display_name?: string
          eligibility_range?: string | null
          hero_generation?: string | null
          hero_image_url?: string | null
          id?: string
          launch_date?: string | null
          next_event_date?: string | null
          power_cap_note?: string | null
          recruiting_status?: string | null
          social_links?: Json
          state_number?: number
          tagline?: string | null
          timezone?: string
          transfer_group?: string | null
          transfer_spots?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      state_stories: {
        Row: {
          body: string | null
          created_at: string
          featured: boolean
          id: string
          image_url: string | null
          published: boolean
          published_at: string | null
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      svs_cycles: {
        Row: {
          battle_result: string | null
          battle_score: number | null
          created_at: string
          event_date: string | null
          id: string
          image_url: string | null
          opponent: string
          opponent_battle_score: number | null
          opponent_prep_score: number | null
          prep_result: string | null
          prep_score: number | null
          published: boolean
          slug: string
          story_body: string | null
          story_intro: string | null
          story_title: string | null
          updated_at: string
        }
        Insert: {
          battle_result?: string | null
          battle_score?: number | null
          created_at?: string
          event_date?: string | null
          id?: string
          image_url?: string | null
          opponent: string
          opponent_battle_score?: number | null
          opponent_prep_score?: number | null
          prep_result?: string | null
          prep_score?: number | null
          published?: boolean
          slug: string
          story_body?: string | null
          story_intro?: string | null
          story_title?: string | null
          updated_at?: string
        }
        Update: {
          battle_result?: string | null
          battle_score?: number | null
          created_at?: string
          event_date?: string | null
          id?: string
          image_url?: string | null
          opponent?: string
          opponent_battle_score?: number | null
          opponent_prep_score?: number | null
          prep_result?: string | null
          prep_score?: number | null
          published?: boolean
          slug?: string
          story_body?: string | null
          story_intro?: string | null
          story_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      svs_story_metrics: {
        Row: {
          cycle_id: string
          id: string
          label: string
          metric_kind: string
          opponent_value: number | null
          our_value: number | null
          sort_order: number
        }
        Insert: {
          cycle_id: string
          id?: string
          label: string
          metric_kind?: string
          opponent_value?: number | null
          our_value?: number | null
          sort_order?: number
        }
        Update: {
          cycle_id?: string
          id?: string
          label?: string
          metric_kind?: string
          opponent_value?: number | null
          our_value?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "svs_story_metrics_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "svs_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          published: boolean
          server_day: number | null
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          server_day?: number | null
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          server_day?: number | null
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transfer_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          published: boolean
          states: number[]
          updated_at: string
          window_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          published?: boolean
          states?: number[]
          updated_at?: string
          window_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          published?: boolean
          states?: number[]
          updated_at?: string
          window_label?: string | null
        }
        Relationships: []
      }
      transfer_guides: {
        Row: {
          action_kind: string
          body: string | null
          created_at: string
          id: string
          published: boolean
          risk_note: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          action_kind?: string
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          risk_note?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          action_kind?: string
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          risk_note?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transfer_windows: {
        Row: {
          created_at: string
          eligibility_range: string | null
          ends_at: string | null
          id: string
          name: string
          notes: string | null
          open_spots: number | null
          phase: string | null
          power_cap_note: string | null
          published: boolean
          sort_order: number
          starts_at: string | null
          status: string
          transfer_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          eligibility_range?: string | null
          ends_at?: string | null
          id?: string
          name: string
          notes?: string | null
          open_spots?: number | null
          phase?: string | null
          power_cap_note?: string | null
          published?: boolean
          sort_order?: number
          starts_at?: string | null
          status?: string
          transfer_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          eligibility_range?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          open_spots?: number | null
          phase?: string | null
          power_cap_note?: string | null
          published?: boolean
          sort_order?: number
          starts_at?: string | null
          status?: string
          transfer_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "editor", "viewer"],
    },
  },
} as const
