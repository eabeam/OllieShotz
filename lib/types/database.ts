export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      child_profiles: {
        Row: {
          id: string
          owner_id: string
          name: string
          team_name: string | null
          primary_color: string
          secondary_color: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          team_name?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          team_name?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          child_id: string
          user_id: string | null
          email: string
          status: 'pending' | 'accepted'
          role: 'owner' | 'editor' | 'viewer'
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          child_id: string
          user_id?: string | null
          email: string
          status?: 'pending' | 'accepted'
          role?: 'owner' | 'editor' | 'viewer'
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          child_id?: string
          user_id?: string | null
          email?: string
          status?: 'pending' | 'accepted'
          role?: 'owner' | 'editor' | 'viewer'
          invited_at?: string
          accepted_at?: string | null
        }
      }
      games: {
        Row: {
          id: string
          child_id: string
          game_date: string
          opponent: string
          periods: string[]
          status: 'upcoming' | 'live' | 'completed'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          child_id: string
          game_date: string
          opponent: string
          periods?: string[]
          status?: 'upcoming' | 'live' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          game_date?: string
          opponent?: string
          periods?: string[]
          status?: 'upcoming' | 'live' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          game_id: string
          event_type: 'save' | 'goal'
          period: string
          recorded_at: string
          synced: boolean
          created_by: string | null
        }
        Insert: {
          id?: string
          game_id: string
          event_type: 'save' | 'goal'
          period: string
          recorded_at?: string
          synced?: boolean
          created_by?: string | null
        }
        Update: {
          id?: string
          game_id?: string
          event_type?: 'save' | 'goal'
          period?: string
          recorded_at?: string
          synced?: boolean
          created_by?: string | null
        }
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
  }
}

// Convenience types
export type ChildProfile = Database['public']['Tables']['child_profiles']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type GameEvent = Database['public']['Tables']['events']['Row']

export type NewChildProfile = Database['public']['Tables']['child_profiles']['Insert']
export type NewGame = Database['public']['Tables']['games']['Insert']
export type NewGameEvent = Database['public']['Tables']['events']['Insert']
