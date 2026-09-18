import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/auth'
import { getDocument, deleteDocument } from '@/lib/documents'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/audit'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffApi()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const { id } = await params
  const doc = await getDocument(id)
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const supabase = createAdminClient()
  const { data: chunks } = await supabase
    .from('guidance_chunks')
    .select('id, chunk_index, content, token_count')
    .eq('document_id', id)
    .order('chunk_index', { ascending: true })

  return NextResponse.json({ document: doc, chunks: chunks ?? [] })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffApi()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const { id } = await params
  const doc = await getDocument(id)
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  try {
    const supabase = createAdminClient()
    await supabase.storage.from('guidance-documents').remove([doc.storage_path])
    await deleteDocument(id)

    await writeAuditLog({
      action: 'document.delete',
      user_id: user.id,
      details: { document_id: id, filename: doc.original_filename },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/documents/:id DELETE]', err)
    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })
  }
}
