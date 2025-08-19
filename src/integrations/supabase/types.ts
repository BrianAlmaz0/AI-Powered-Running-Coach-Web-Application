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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          average_heartrate: number | null
          average_speed: number | null
          created_at: string
          distance: number
          elapsed_time: number
          id: string
          max_heartrate: number | null
          max_speed: number | null
          moving_time: number
          name: string
          start_date: string
          strava_activity_id: number
          total_elevation_gain: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          average_heartrate?: number | null
          average_speed?: number | null
          created_at?: string
          distance: number
          elapsed_time: number
          id?: string
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time: number
          name: string
          start_date: string
          strava_activity_id: number
          total_elevation_gain?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          average_heartrate?: number | null
          average_speed?: number | null
          created_at?: string
          distance?: number
          elapsed_time?: number
          id?: string
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time?: number
          name?: string
          start_date?: string
          strava_activity_id?: number
          total_elevation_gain?: number | null
          user_id?: string
        }
        Relationships: []
      }
      coaching_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          insight_type: string
          is_read: boolean | null
          priority: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          priority?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          priority?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          fitness_level: string | null
          id: string
          preferred_units: string | null
          strava_access_token: string | null
          strava_expires_at: string | null
          strava_refresh_token: string | null
          strava_user_id: string | null
          updated_at: string
          user_id: string
          weekly_mileage_goal: number | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          fitness_level?: string | null
          id?: string
          preferred_units?: string | null
          strava_access_token?: string | null
          strava_expires_at?: string | null
          strava_refresh_token?: string | null
          strava_user_id?: string | null
          updated_at?: string
          user_id: string
          weekly_mileage_goal?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          fitness_level?: string | null
          id?: string
          preferred_units?: string | null
          strava_access_token?: string | null
          strava_expires_at?: string | null
          strava_refresh_token?: string | null
          strava_user_id?: string | null
          updated_at?: string
          user_id?: string
          weekly_mileage_goal?: number | null
        }
        Relationships: []
      }
      training_plans: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          current_week: number | null
          description: string | null
          id: string
          is_active: boolean | null
          plan_type: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
          weeks_duration: number
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          current_week?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          plan_type: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
          weeks_duration: number
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          current_week?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          plan_type?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          weeks_duration?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          activity_id: string | null
          completed: boolean | null
          created_at: string
          description: string | null
          distance_target: number | null
          duration_target: number | null
          id: string
          notes: string | null
          pace_target: number | null
          scheduled_date: string
          title: string
          training_plan_id: string
          updated_at: string
          user_id: string
          week_number: number
          workout_type: string
        }
        Insert: {
          activity_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          distance_target?: number | null
          duration_target?: number | null
          id?: string
          notes?: string | null
          pace_target?: number | null
          scheduled_date: string
          title: string
          training_plan_id: string
          updated_at?: string
          user_id: string
          week_number: number
          workout_type: string
        }
        Update: {
          activity_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          distance_target?: number | null
          duration_target?: number | null
          id?: string
          notes?: string | null
          pace_target?: number | null
          scheduled_date?: string
          title?: string
          training_plan_id?: string
          updated_at?: string
          user_id?: string
          week_number?: number
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
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