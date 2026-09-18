import { NextResponse } from 'next/server'
import { getCase, updateCase } from '@/lib/cases'
import { writeAuditLog } from '@/lib/audit'
import { caseUpdateSchema } from '@/lib/validations'
import { requireStaffApi } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffApi()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const { id } = await params
  try {
    const row = await getCase(id)
    if (!row) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
    }
    return NextResponse.json({ case: row })
  } catch (err) {
    console.error('[api/cases/:id GET]', err)
    return NextResponse.json({ error: 'Failed to load case.' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffApi()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = caseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid update.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  try {
    const before = await getCase(id)
    if (!before) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
    }

    const updated = await updateCase(id, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
    }

    await writeAuditLog({
      action: 'case.update',
      case_id: id,
      user_id: user.id,
      details: {
        before: {
          status: before.status,
          priority: before.priority,
          category: before.category,
        },
        after: parsed.data,
      },
    })

    return NextResponse.json({ case: updated })
  } catch (err) {
    console.error('[api/cases/:id PATCH]', err)
    return NextResponse.json({ error: 'Failed to update case.' }, { status: 500 })
  }
}