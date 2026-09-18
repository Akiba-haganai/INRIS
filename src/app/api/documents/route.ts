import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/auth'
import { listDocuments } from '@/lib/documents'
import { ingestDocument } from '@/lib/ingestion/pipeline'
import { writeAuditLog } from '@/lib/audit'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export async function GET() {
  const user = await requireStaffApi()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  try {
    const docs = await listDocuments()
    return NextResponse.json({ documents: docs })
  } catch (err) {
    console.error('[api/documents GET]', err)
    return NextResponse.json({ error: 'Failed to list documents.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await requireStaffApi()
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data.' }, { status: 400 })
  }

  const file = form.get('file')
  const title = (form.get('title') as string | null) ?? undefined

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" field.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_BYTES / 1024 / 1024} MB limit.` },
      { status: 413 }
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await ingestDocument({
      buffer,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      title,
      uploadedBy: user.id,
    })

    await writeAuditLog({
      action: 'document.ingest',
      user_id: user.id,
      details: {
        document_id: result.documentId,
        filename: file.name,
        status: result.status,
        chunk_count: result.chunkCount,
      },
    })

    return NextResponse.json(result, { status: result.status === 'ready' ? 201 : 422 })
  } catch (err) {
    console.error('[api/documents POST]', err)
    const message = err instanceof Error ? err.message : 'Ingestion failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
