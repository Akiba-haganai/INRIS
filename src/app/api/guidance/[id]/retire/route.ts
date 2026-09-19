import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/auth'
import { updateGuidanceStatus } from '@/lib/documents'
import { writeAuditLog } from '@/lib/audit'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffApi()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  try {
    await updateGuidanceStatus(id, 'retired')
    await writeAuditLog({
      action: 'guidance.retire',
      user_id: user.id,
      details: { guidance_id: id },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/guidance/retire]', err)
    return NextResponse.json({ error: 'Failed to retire guidance' }, { status: 500 })
  }
}
