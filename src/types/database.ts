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
        Row: { id: string; title: string; category: string; content: string; source: string; source_url: string | null; version: string | null; effective_date: string | null; last_verified: string | null; status: string; document_id: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; title: string; category: string; content: string; source: string; source_url?: string | null; version?: string | null; effective_date?: string | null; last_verified?: string | null; status?: string; document_id?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; title?: string; category?: string; content?: string; source?: string; source_url?: string | null; version?: string | null; effective_date?: string | null; last_verified?: string | null; status?: string; document_id?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      cases: {
        Row: { id: string; case_number: string; category: string; description: string; status: string; priority: string; created_at: string; updated_at: string }
        Insert: { id?: string; case_number?: string; category: string; description: string; status?: string; priority?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; case_number?: string; category?: string; description?: string; status?: string; priority?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      case_analysis: {
        Row: { id: string; case_id: string; case_type: string | null; summary: string; issues: string[]; missing_information: string[]; relevant_guidance: string[]; suggested_action: string; confidence: number; human_review_required: boolean; created_at: string }
        Insert: { id?: string; case_id: string; case_type?: string | null; summary: string; issues?: string[]; missing_information?: string[]; relevant_guidance?: string[]; suggested_action: string; confidence: number; human_review_required?: boolean; created_at?: string }
        Update: { id?: string; case_id?: string; case_type?: string | null; summary?: string; issues?: string[]; missing_information?: string[]; relevant_guidance?: string[]; suggested_action?: string; confidence?: number; human_review_required?: boolean; created_at?: string }
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; user_id: string | null; case_id: string | null; action: string; details: Json; created_at: string }
        Insert: { id?: string; user_id?: string | null; case_id?: string | null; action: string; details?: Json; created_at?: string }
        Update: { id?: string; user_id?: string | null; case_id?: string | null; action?: string; details?: Json; created_at?: string }
        Relationships: []
      }
      documents: {
        Row: { id: string; title: string; original_filename: string; storage_path: string; mime_type: string; file_size_bytes: number; sha256: string; version: number; status: string; uploaded_by: string | null; uploaded_at: string; processed_at: string | null; error_message: string | null; metadata: Json }
        Insert: { id?: string; title: string; original_filename: string; storage_path: string; mime_type: string; file_size_bytes: number; sha256: string; version?: number; status?: string; uploaded_by?: string | null; uploaded_at?: string; processed_at?: string | null; error_message?: string | null; metadata?: Json }
        Update: { id?: string; title?: string; original_filename?: string; storage_path?: string; mime_type?: string; file_size_bytes?: number; sha256?: string; version?: number; status?: string; uploaded_by?: string | null; uploaded_at?: string; processed_at?: string | null; error_message?: string | null; metadata?: Json }
        Relationships: []
      }
      guidance_chunks: {
        Row: { id: string; document_id: string; guidance_id: string | null; chunk_index: number; content: string; token_count: number | null; embedding: number[] | null; created_at: string }
        Insert: { id?: string; document_id: string; guidance_id?: string | null; chunk_index: number; content: string; token_count?: number | null; embedding?: number[] | null; created_at?: string }
        Update: { id?: string; document_id?: string; guidance_id?: string | null; chunk_index?: number; content?: string; token_count?: number | null; embedding?: number[] | null; created_at?: string }
        Relationships: []
      }
      users: {
        Row: { id: string; email: string; full_name: string | null; role: string; created_at: string; updated_at: string }
        Insert: { id: string; email: string; full_name?: string | null; role?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; email?: string; full_name?: string | null; role?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      match_guidance_chunks: {
        Args: { query_embedding: number[]; match_threshold?: number; match_count?: number }
        Returns: { id: string; document_id: string; content: string; similarity: number; document_title: string }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}