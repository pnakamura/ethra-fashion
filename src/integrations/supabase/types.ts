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
      external_garments: {
        Row: {
          created_at: string
          detected_category: string | null
          id: string
          name: string | null
          original_image_url: string
          processed_image_url: string | null
          source_type: string
          source_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detected_category?: string | null
          id?: string
          name?: string | null
          original_image_url: string
          processed_image_url?: string | null
          source_type: string
          source_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detected_category?: string | null
          id?: string
          name?: string | null
          original_image_url?: string
          processed_image_url?: string | null
          source_type?: string
          source_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outfits: {
        Row: {
          created_at: string
          id: string
          items: string[] | null
          name: string
          occasion: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: string[] | null
          name: string
          occasion?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: string[] | null
          name?: string
          occasion?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          color_analysis: Json | null
          color_season: string | null
          created_at: string
          id: string
          onboarding_complete: boolean | null
          style_archetype: string | null
          style_preferences: Json | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          color_analysis?: Json | null
          color_season?: string | null
          created_at?: string
          id?: string
          onboarding_complete?: boolean | null
          style_archetype?: string | null
          style_preferences?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          color_analysis?: Json | null
          color_season?: string | null
          created_at?: string
          id?: string
          onboarding_complete?: boolean | null
          style_archetype?: string | null
          style_preferences?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          destination: string
          end_date: string
          id: string
          packed_items: string[] | null
          start_date: string
          trip_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          end_date: string
          id?: string
          packed_items?: string[] | null
          start_date: string
          trip_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          packed_items?: string[] | null
          start_date?: string
          trip_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      try_on_results: {
        Row: {
          avatar_id: string | null
          created_at: string
          error_message: string | null
          garment_id: string | null
          garment_image_url: string
          garment_source: string
          id: string
          processing_time_ms: number | null
          result_image_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          error_message?: string | null
          garment_id?: string | null
          garment_image_url: string
          garment_source: string
          id?: string
          processing_time_ms?: number | null
          result_image_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          error_message?: string | null
          garment_id?: string | null
          garment_image_url?: string
          garment_source?: string
          id?: string
          processing_time_ms?: number | null
          result_image_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "try_on_results_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "user_avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      user_avatars: {
        Row: {
          body_type: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          body_type?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          body_type?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          category: string
          color_code: string | null
          created_at: string
          id: string
          image_url: string
          is_favorite: boolean | null
          last_worn: string | null
          name: string | null
          occasion: string | null
          season_tag: string | null
          user_id: string
        }
        Insert: {
          category: string
          color_code?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_favorite?: boolean | null
          last_worn?: string | null
          name?: string | null
          occasion?: string | null
          season_tag?: string | null
          user_id: string
        }
        Update: {
          category?: string
          color_code?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_favorite?: boolean | null
          last_worn?: string | null
          name?: string | null
          occasion?: string | null
          season_tag?: string | null
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
