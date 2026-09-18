import { createClient } from '@/lib/supabase/server'
import { getProvider } from '@/lib/ai/provider'

export interface GuidanceResult {
  id: string
  title: string
  category: string
  content: string
  source: string
  last_verified: string | null
  score: number
}

const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','so','to','of','in','on','at','for','with',
  'is','are','was','were','be','been','being','do','does','did','can','could','should',
  'would','will','shall','may','might','must','i','me','my','we','our','you','your','it',
  'this','that','these','those','what','which','who','whom','how','when','where','why',
  'need','needs','want','get','got','about','from','have','has','had','not','no','please',
  'help','tell','know','there','here','also','any','all','some',
])

export function buildSearchTerms(query: string, max = 6): string[] {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
  return Array.from(new Set(terms)).slice(0, max)
}

export async function retrieveGuidance(
  query: string,
  limit = 6
): Promise<GuidanceResult[]> {
  const supabase = await createClient()

  // ---- 1. vector search over uploaded documents ---------------------
  let vectorResults: GuidanceResult[] = []
  try {
    const [queryVector] = await getProvider().embed([query])
    if (queryVector) {
      const { data, error } = await supabase.rpc('match_guidance_chunks', {
        query_embedding: queryVector as unknown as string,
        match_threshold: 0.5,
        match_count: limit,
      })
      if (error) throw error
      vectorResults = (data ?? []).map((row: {
        id: string
        document_id: string
        content: string
        similarity: number
        document_title: string
      }) => ({
        id: row.id,
        title: row.document_title,
        category: 'Knowledge base',
        content: row.content,
        source: 'Uploaded guidance document',
        last_verified: null,
        score: Math.round(row.similarity * 100),
      }))
    }
  } catch (err) {
    console.warn('[rag] vector search failed, falling back to keyword:', err)
  }

  // ---- 2. keyword search over curated guidance rows -----------------
  const terms = buildSearchTerms(query)
  let keywordResults: GuidanceResult[] = []

  if (terms.length > 0) {
    const filter = terms
      .flatMap((t) => [
        `title.ilike.%${t}%`,
        `content.ilike.%${t}%`,
        `category.ilike.%${t}%`,
      ])
      .join(',')

    const { data, error } = await supabase
      .from('guidance')
      .select('id, title, category, content, source, last_verified, status')
      .eq('status', 'approved')
      .or(filter)
      .limit(40)

    if (error) throw new Error(`Guidance retrieval failed: ${error.message}`)

    keywordResults = (data ?? []).map((row) => {
      const title = row.title.toLowerCase()
      const category = row.category.toLowerCase()
      const content = row.content.toLowerCase()
      let score = 0
      for (const t of terms) {
        if (title.includes(t)) score += 3
        if (category.includes(t)) score += 2
        if (content.includes(t)) score += 1
      }
      return { ...row, score }
    })
  }

  // ---- 3. merge, dedupe, cap ----------------------------------------
  const seen = new Set<string>()
  const merged: GuidanceResult[] = []
  for (const r of [...vectorResults, ...keywordResults]) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    merged.push(r)
  }

  return merged
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function formatGuidanceContext(results: GuidanceResult[]): string {
  return results
    .map((g, i) => {
      const verified = g.last_verified
        ? new Date(g.last_verified).toISOString().slice(0, 10)
        : 'not recorded'
      return [
        `[${i + 1}] ${g.title}`,
        `Category: ${g.category}`,
        `Source: ${g.source}`,
        `Last verified: ${verified}`,
        `Content: ${g.content}`,
      ].join('\n')
    })
    .join('\n\n---\n\n')
}