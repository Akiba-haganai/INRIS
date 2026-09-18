import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

interface AuditInput {
  action: string
  case_id?: string | null
  user_id?: string | null
  details?: Record<string, unknown>
}

/**
 * Fire-and-forget audit log writer. Audit failures must never break the
 * user-facing request, so we swallow errors and log them to the server console.
 */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('audit_logs').insert({
      action: input.action,
      case_id: input.case_id ?? null,
      user_id: input.user_id ?? null,
      details: (input.details ?? {}) as Json,
    })
    if (error) {
      console.error('[audit] insert failed:', error.message)
    }
  } catch (err) {
    console.error('[audit] unexpected failure:', err)
  }
}