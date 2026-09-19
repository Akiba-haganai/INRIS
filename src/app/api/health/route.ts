import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/ai/provider'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  // Supabase Anon
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('guidance').select('id').limit(1)
    checks.supabase_anon = error
      ? { ok: false, detail: error.message }
      : { ok: true }
  } catch (err) {
    checks.supabase_anon = {
      ok: false,
      detail: err instanceof Error ? err.message : 'unknown',
    }
  }

  // Supabase Service Role
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { error } = await admin.from('guidance').select('id').limit(1)
    checks.supabase_service_role = error
      ? { ok: false, detail: error.message }
      : { ok: true }
  } catch (err) {
    checks.supabase_service_role = {
      ok: false,
      detail: err instanceof Error ? err.message : 'unknown',
    }
  }

  // AI provider
  try {
    const provider = getProvider()
    if (provider.name === 'gemini' && !process.env.GEMINI_API_KEY) {
      checks.ai = { ok: false, detail: 'GEMINI_API_KEY is not set' }
    } else if (
      provider.name === 'openai-compatible' &&
      !process.env.AI_API_KEY
    ) {
      checks.ai = { ok: false, detail: 'AI_API_KEY is not set' }
    } else {
      checks.ai = { ok: true, detail: provider.name }
    }
  } catch (err) {
    checks.ai = {
      ok: false,
      detail: err instanceof Error ? err.message : 'unknown',
    }
  }

  // Knowledge base
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('guidance')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
    checks.knowledge_base = {
      ok: (count ?? 0) > 0,
      detail: `${count ?? 0} approved guidance entries`,
    }
  } catch (err) {
    checks.knowledge_base = {
      ok: false,
      detail: err instanceof Error ? err.message : 'unknown',
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 503 })
}
