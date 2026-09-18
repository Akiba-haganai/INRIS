import { createClient } from '@/lib/supabase/server'

export interface GuidanceRow {
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
  created_at: string
  updated_at: string
}

/**
 * List all approved guidance entries grouped by category.
 * Single read path for the guidance library UI and any server-side consumer.
 */
export async function listGuidance(): Promise<
  { category: string; entries: GuidanceRow[] }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guidance')
    .select(
      'id, title, category, content, source, source_url, version, effective_date, last_verified, status, created_at, updated_at'
    )
    .eq('status', 'approved')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (error) throw new Error(`listGuidance failed: ${error.message}`)

  const byCategory = new Map<string, GuidanceRow[]>()
  for (const row of data ?? []) {
    const list = byCategory.get(row.category) ?? []
    list.push(row)
    byCategory.set(row.category, list)
  }

  return [...byCategory.entries()].map(([category, entries]) => ({
    category,
    entries,
  }))
}
