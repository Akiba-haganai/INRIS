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
      guidance: {
        Row: {
          id: string
          title: string
          category: string
          content: string
          source: string
          last_verified: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          category: string
          content: string
          source: string
          last_verified?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: string
          content?: string
          source?: string
          last_verified?: string | null
          created_at?: string
        }
      }
      cases: {
        Row: {
          id: string
          case_number: string
          category: string
          description: string
          status: string
          priority: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_number?: string
          category: string
          description: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_number?: string
          category?: string
          description?: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
      }
      case_analysis: {
        Row: {
          id: string
          case_id: string
          summary: string
          issues: string[]
          missing_information: string[]
          suggested_action: string
          confidence: number
          human_review_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          summary: string
          issues?: string[]
          missing_information?: string[]
          suggested_action: string
          confidence: number
          human_review_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          summary?: string
          issues?: string[]
          missing_information?: string[]
          suggested_action?: string
          confidence?: number
          human_review_required?: boolean
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          case_id: string | null
          action: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          case_id?: string | null
          action: string
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          case_id?: string | null
          action?: string
          details?: Json
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}