// FIX: this type previously only declared guidance / cases / case_analysis /
// audit_logs — the schema as of migration 001. It is used to generically
// type the admin Supabase client in src/lib/supabase/admin.ts, which is
// then used by src/lib/documents.ts and src/lib/ingestion/pipeline.ts to
// call .from('documents') and .from('guidance_chunks') — tables that
// didn't exist in this type at all (added by migration 004). Under
// tsconfig's "strict": true that is a real type error at exactly the
// point where type-safety matters most (ingestion). Brought back in sync
// with migrations 001-004 below; regenerate with the Supabase CLI
// (`supabase gen types typescript`) going forward so this doesn't drift
// again.

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
          source_url: string | null
          version: string | null
          effective_date: string | null
          last_verified: string | null
          status: string
          document_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          category: string
          content: string
          source: string
          source_url?: string | null
          version?: string | null
          effective_date?: string | null
          last_verified?: string | null
          status?: string
          document_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: string
          content?: string
          source?: string
          source_url?: string | null
          version?: string | null
          effective_date?: string | null
          last_verified?: string | null
          status?: string
          document_id?: string | null
          created_at?: string
          updated_at?: string
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
          case_type: string | null
          summary: string
          issues: string[]
          missing_information: string[]
          relevant_guidance: string[]
          suggested_action: string
          confidence: number
          human_review_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          case_type?: string | null
          summary: string
          issues?: string[]
          missing_information?: string[]
          relevant_guidance?: string[]
          suggested_action: string
          confidence: number
          human_review_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          case_type?: string | null
          summary?: string
          issues?: string[]
          missing_information?: string[]
          relevant_guidance?: string[]
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
      documents: {
        Row: {
          id: string
          title: string
          original_filename: string
          storage_path: string
          mime_type: string
          file_size_bytes: number
          sha256: string
          version: number
          status: string
          uploaded_by: string | null
          uploaded_at: string
          processed_at: string | null
          error_message: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          title: string
          original_filename: string
          storage_path: string
          mime_type: string
          file_size_bytes: number
          sha256: string
          version?: number
          status?: string
          uploaded_by?: string | null
          uploaded_at?: string
          processed_at?: string | null
          error_message?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          title?: string
          original_filename?: string
          storage_path?: string
          mime_type?: string
          file_size_bytes?: number
          sha256?: string
          version?: number
          status?: string
          uploaded_by?: string | null
          uploaded_at?: string
          processed_at?: string | null
          error_message?: string | null
          metadata?: Json
        }
      }
      guidance_chunks: {
        Row: {
          id: string
          document_id: string
          guidance_id: string | null
          chunk_index: number
          content: string
          token_count: number | null
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          guidance_id?: string | null
          chunk_index: number
          content: string
          token_count?: number | null
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          guidance_id?: string | null
          chunk_index?: number
          content?: string
          token_count?: number | null
          embedding?: number[] | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_guidance_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          content: string
          similarity: number
          document_title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
