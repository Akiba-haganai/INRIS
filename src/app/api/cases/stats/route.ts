import { NextResponse } from 'next/server'
import { getCaseStats } from '@/lib/cases'
import { requireStaffApi } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const user = await requireStaffApi()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  try {
    const stats = await getCaseStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[api/cases/stats]', err)
    return NextResponse.json({ error: 'Failed to load stats.' }, { status: 500 })
  }
}