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
      family_groups: {
        Row: {
          id: string
          created_at: string
          name: string
          invite_code: string
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          invite_code: string
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          invite_code?: string
          created_by?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          id: string
          created_at: string
          user_id: string
          family_group_id: string
          display_name: string
          native_language: string
          photo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          family_group_id: string
          display_name: string
          native_language?: string
          photo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          family_group_id?: string
          display_name?: string
          native_language?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          created_at: string
          family_group_id: string
          title: string
          sort_order: number
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          family_group_id: string
          title: string
          sort_order?: number
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          family_group_id?: string
          title?: string
          sort_order?: number
          created_by?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          id: string
          created_at: string
          family_group_id: string
          chapter_id: string | null
          created_by: string | null
          title: string
          original_language: string
          audio_url: string | null
          transcript_original: string | null
          transcript_english: string | null
          ai_suggested_chapter: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          created_at?: string
          family_group_id: string
          chapter_id?: string | null
          created_by?: string | null
          title: string
          original_language: string
          audio_url?: string | null
          transcript_original?: string | null
          transcript_english?: string | null
          ai_suggested_chapter?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          created_at?: string
          family_group_id?: string
          chapter_id?: string | null
          created_by?: string | null
          title?: string
          original_language?: string
          audio_url?: string | null
          transcript_original?: string | null
          transcript_english?: string | null
          ai_suggested_chapter?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      story_prompts: {
        Row: {
          id: string
          created_at: string
          category: string
          prompt_text: string
        }
        Insert: {
          id?: string
          created_at?: string
          category: string
          prompt_text: string
        }
        Update: {
          id?: string
          created_at?: string
          category?: string
          prompt_text?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience types
export type FamilyGroup = Database['public']['Tables']['family_groups']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
export type Story = Database['public']['Tables']['stories']['Row']
export type StoryPrompt = Database['public']['Tables']['story_prompts']['Row']
