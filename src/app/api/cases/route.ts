import { NextResponse } from 'next/server'
import { listCases, createCase } from '@/lib/cases'
import { writeAuditLog } from '@/lib/audit'
import { caseCreateSchema } from '@/lib/validations'
import { requireStaffApi } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const user = await requireStaffApi()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  const url = new URL(req.url)
  try {
    const rows = await listCases({
      status: url.searchParams.get('status') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      limit: Number(url.searchParams.get('limit')) || 100,
    })
    return NextResponse.json({ cases: rows })
  } catch (err) {
    console.error('[api/cases GET]', err)
    return NextResponse.json({ error: 'Failed to list cases.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await requireStaffApi()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = caseCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid case.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const created = await createCase(parsed.data)

    await writeAuditLog({
      action: 'case.create',
      case_id: created.id,
      user_id: user.id,
      details: {
        case_number: created.case_number,
        category: created.category,
        priority: created.priority,
      },
    })

    return NextResponse.json({ case: created }, { status: 201 })
  } catch (err) {
    console.error('[api/cases POST]', err)
    return NextResponse.json({ error: 'Failed to create case.' }, { status: 500 })
  }
}