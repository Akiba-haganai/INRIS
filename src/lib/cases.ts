import { createAdminClient } from '@/lib/supabase/admin'
import type { CaseAnalysisOutput } from '@/lib/validations'

export interface CaseRow {
  id: string; case_number: string; category: string; description: string
  status: string; priority: string; created_at: string; updated_at: string
}

export interface AnalysisRow {
  id: string; case_id: string; case_type: string | null; summary: string
  issues: string[]; missing_information: string[]; relevant_guidance: string[]
  suggested_action: string; confidence: number; human_review_required: boolean
  created_at: string
}

export interface CaseWithAnalysis extends CaseRow {
  latest_analysis: AnalysisRow | null
}

export interface ListCasesFilters {
  status?: string; category?: string; search?: string
  needs_review?: boolean; limit?: number
}

export interface CaseStats {
  total: number; open: number; resolved: number; needs_review: number
  by_category: { category: string; count: number }[]
  common_issues: { issue: string; count: number }[]
}

const ANALYSIS_COLUMNS =
  'id, case_id, case_type, summary, issues, missing_information, relevant_guidance, suggested_action, confidence, human_review_required, created_at'

export async function listCases(filters: ListCasesFilters = {}): Promise<CaseRow[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('cases')
    .select('id, case_number, category, description, status, priority, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100)

  if (filters.status) q = q.eq('status', filters.status)
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.search) {
    const s = filters.search.replace(/[%_,]/g, '')
    q = q.or(`case_number.ilike.%${s}%,description.ilike.%${s}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(`listCases failed: ${error.message}`)
  return data ?? []
}

export async function getCase(id: string): Promise<CaseWithAnalysis | null> {
  const supabase = createAdminClient()

  const { data: caseRow, error } = await supabase
    .from('cases')
    .select('id, case_number, category, description, status, priority, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`getCase failed: ${error.message}`)
  if (!caseRow) return null

  const { data: analyses } = await supabase
    .from('case_analysis')
    .select(ANALYSIS_COLUMNS)
    .eq('case_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  return { ...caseRow, latest_analysis: analyses?.[0] ?? null }
}

export async function createCase(input: {
  category: string; description: string; priority?: string; status?: string
}): Promise<CaseRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cases')
    .insert({
      category: input.category,
      description: input.description,
      priority: input.priority ?? 'normal',
      status: input.status ?? 'open',
    })
    .select('id, case_number, category, description, status, priority, created_at, updated_at')
    .single()

  if (error) throw new Error(`createCase failed: ${error.message}`)
  return data
}

export async function updateCase(
  id: string,
  input: { status?: string; priority?: string; category?: string }
): Promise<CaseRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cases')
    .update(input)
    .eq('id', id)
    .select('id, case_number, category, description, status, priority, created_at, updated_at')
    .maybeSingle()

  if (error) throw new Error(`updateCase failed: ${error.message}`)
  return data ?? null
}

export async function saveAnalysis(
  caseId: string,
  output: CaseAnalysisOutput
): Promise<AnalysisRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('case_analysis')
    .insert({
      case_id: caseId,
      case_type: output.case_type,
      summary: output.summary,
      issues: output.key_issues,
      missing_information: output.missing_information,
      relevant_guidance: output.relevant_guidance,
      suggested_action: output.suggested_next_step,
      confidence: output.confidence,
      human_review_required: output.human_review_required,
    })
    .select(ANALYSIS_COLUMNS)
    .single()

  if (error) throw new Error(`saveAnalysis failed: ${error.message}`)
  return data
}

export async function getCaseStats(): Promise<CaseStats> {
  const supabase = createAdminClient()

  const { data: caseRows, error } = await supabase
    .from('cases')
    .select('id, category, status')

  if (error) throw new Error(`getCaseStats failed: ${error.message}`)
  const rows = caseRows ?? []

  const total = rows.length
  const open = rows.filter((r) => r.status === 'open' || r.status === 'in_review').length
  const resolved = rows.filter((r) => r.status === 'resolved' || r.status === 'closed').length

  const byCategory = new Map<string, number>()
  for (const r of rows) byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1)
  const by_category = [...byCategory.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  if (rows.length === 0) {
    return { total: 0, open: 0, resolved: 0, needs_review: 0, by_category: [], common_issues: [] }
  }

  const ids = rows.map((r) => r.id)
  const { data: analyses } = await supabase
    .from('case_analysis')
    .select('case_id, issues, human_review_required, confidence, created_at')
    .in('case_id', ids)
    .order('created_at', { ascending: false })

  const latest = new Map<string, { issues: string[]; human_review_required: boolean; confidence: number }>()
  for (const a of analyses ?? []) {
    if (!latest.has(a.case_id)) {
      latest.set(a.case_id, {
        issues: a.issues ?? [],
        human_review_required: a.human_review_required,
        confidence: Number(a.confidence),
      })
    }
  }

  const needs_review = rows.filter((r) => {
    const a = latest.get(r.id)
    if (!a) return true
    return a.human_review_required || a.confidence < 0.7
  }).length

  const issueCounts = new Map<string, number>()
  for (const a of latest.values()) {
    for (const issue of a.issues) {
      const key = issue.trim().toLowerCase()
      if (!key) continue
      issueCounts.set(key, (issueCounts.get(key) ?? 0) + 1)
    }
  }
  const common_issues = [...issueCounts.entries()]
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { total, open, resolved, needs_review, by_category, common_issues }
}