import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createDocument, updateDocument, findDocumentBySha } from '@/lib/documents'
import { extractText } from './extract'
import { chunkText } from './chunk'
import { getProvider } from '@/lib/ai/provider'
import { CASE_CATEGORIES } from '@/lib/validations'

export interface IngestInput {
  buffer: Buffer
  filename: string
  mimeType: string
  title?: string
  category?: string // FIX: new — see note below
  uploadedBy: string | null
}

export interface IngestResult {
  documentId: string
  status: 'ready' | 'failed'
  chunkCount: number
  message?: string
}

// Guidance library entries are capped at this many characters. The full
// text remains searchable via guidance_chunks (vector search); this is
// only the coarse "library" copy shown on /guidance.
const GUIDANCE_CONTENT_PREVIEW_CHARS = 6000

export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const sha256 = createHash('sha256').update(input.buffer).digest('hex')

  // Deduplicate by content hash.
  const existing = await findDocumentBySha(sha256)
  if (existing) {
    return {
      documentId: existing.id,
      status: existing.status === 'ready' ? 'ready' : 'failed',
      chunkCount: 0,
      message: 'Identical document already uploaded.',
    }
  }

  const storagePath = `uploads/${sha256.slice(0, 12)}-${sanitiseFilename(input.filename)}`

  // 1. Upload original to storage
  const supabase = createAdminClient()
  const { error: uploadError } = await supabase.storage
    .from('guidance-documents')
    .upload(storagePath, input.buffer, {
      contentType: input.mimeType,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  const title = input.title || stripExtension(input.filename)
  const category = CASE_CATEGORIES.includes(input.category as (typeof CASE_CATEGORIES)[number])
    ? (input.category as string)
    : 'Other'

  // 2. Create the document row
  const doc = await createDocument({
    title,
    original_filename: input.filename,
    storage_path: storagePath,
    mime_type: input.mimeType,
    file_size_bytes: input.buffer.length,
    sha256,
    uploaded_by: input.uploadedBy,
  })

  // 3. Extract → chunk → embed → persist
  try {
    await updateDocument(doc.id, { status: 'processing' })

    const { text, pageCount } = await extractText(
      input.buffer,
      input.mimeType,
      input.filename
    )
    const chunks = chunkText(text)

    if (chunks.length === 0) {
      await updateDocument(doc.id, {
        status: 'failed',
        error_message: 'No extractable text found in document.',
      })
      return { documentId: doc.id, status: 'failed', chunkCount: 0 }
    }

    let embeddings: number[][] = []
    let embeddingError: string | null = null
    try {
      embeddings = await getProvider().embed(chunks.map((c) => c.content))
    } catch (err) {
      embeddingError = err instanceof Error ? err.message : 'Embedding failed'
      console.error('[ingestion] embedding failed:', err)
    }

    if (embeddingError) {
      await updateDocument(doc.id, {
        status: 'failed',
        error_message: `Embedding failed: ${embeddingError}`,
      })
      return { documentId: doc.id, status: 'failed', chunkCount: 0, message: embeddingError }
    }

    const rows = chunks.map((c, i) => ({
      document_id: doc.id,
      chunk_index: c.index,
      content: c.content,
      token_count: c.tokenCount,
      embedding: embeddings[i] ?? null,
    }))

    const { error: chunkError } = await supabase
      .from('guidance_chunks')
      .insert(rows)

    if (chunkError) {
      await updateDocument(doc.id, {
        status: 'failed',
        error_message: `Chunk insert failed: ${chunkError.message}`,
      })
      return { documentId: doc.id, status: 'failed', chunkCount: 0 }
    }

    await updateDocument(doc.id, {
      status: 'ready',
      processed_at: new Date().toISOString(),
      metadata: { page_count: pageCount, chunk_count: chunks.length },
    })

    // FIX: previously ingestion only wrote to `documents` +
    // `guidance_chunks`. It never created a row in the canonical
    // `guidance` table, so uploaded documents were searchable by chat
    // (vector search) but invisible on the public Guidance Library page
    // (FR-11) and never got the version/status/effective_date/verified
    // lifecycle fields the assignment asks for (Section 9). This closes
    // that gap by creating one linked, lifecycle-tagged `guidance` row
    // per successfully-ingested document. Full text stays searchable via
    // guidance_chunks; this row is the library-facing summary copy.
    const { error: guidanceError } = await supabase.from('guidance').insert({
      title,
      category,
      content: text.slice(0, GUIDANCE_CONTENT_PREVIEW_CHARS),
      source: `Uploaded document: ${input.filename}`,
      document_id: doc.id,
      version: '1',
      status: 'approved',
      last_verified: new Date().toISOString(),
    })
    if (guidanceError) {
      // Don't fail the whole ingest over this — the chunks/vectors are
      // already good and chat retrieval still works. Just surface it.
      console.error('[ingestion] failed to create linked guidance row:', guidanceError.message)
    }

    return { documentId: doc.id, status: 'ready', chunkCount: chunks.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown ingestion error'
    await updateDocument(doc.id, { status: 'failed', error_message: message })
    return { documentId: doc.id, status: 'failed', chunkCount: 0, message }
  }
}

function sanitiseFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
}
