import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let cached: ReturnType<typeof createClient<Database>> | null = null

/**
 * Service-role Supabase client for server-side case operations.
 * Bypasses RLS — only use in API routes / server code, never in the browser.
 */
export function createAdminClient() {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.'
    )
  }

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return cached
}