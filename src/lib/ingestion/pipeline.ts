import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProvider } from '@/lib/ai/provider'

export interface IngestInput {
  buffer: Buffer
  filename: string
  mimeType: string
  title?: string
  uploadedBy: string | null
}

export interface IngestResult {
  documentId: string
  status: 'ready' | 'error'
  chunkCount?: number
  error?: string
}

/**
 * Full pipeline: upload file to Storage → insert document record →
 * extract text → embed → store chunks.
 * Called directly from the POST /api/documents route.
 */
export async function ingestDocument(input: IngestInput): Promise<IngestResult> {
  const supabase = createAdminClient()

  const sha256 = crypto
    .createHash('sha256')
    .update(input.buffer)
    .digest('hex')

  // De-dupe by content hash
  const { data: existing } = await supabase
    .from('documents')
    .select('id, status')
    .eq('sha256', sha256)
    .maybeSingle()

  if (existing) {
    return { documentId: existing.id, status: 'ready', chunkCount: 0 }
  }

  const ext = input.filename.split('.').pop() ?? 'bin'
  const storagePath = `${Date.now()}-${sha256.slice(0, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('guidance-docs')
    .upload(storagePath, input.buffer, { contentType: input.mimeType })

  if (uploadError) {
    return {
      documentId: '',
      status: 'error',
      error: `Storage upload failed: ${uploadError.message}`,
    }
  }

  const { data: docRow, error: insertError } = await supabase
    .from('documents')
    .insert({
      title: input.title ?? input.filename,
      original_filename: input.filename,
      storage_path: storagePath,
      mime_type: input.mimeType,
      file_size_bytes: input.buffer.byteLength,
      sha256,
      uploaded_by: input.uploadedBy,
      status: 'processing',
    } as never)
    .select('id')
    .single()

  if (insertError || !docRow) {
    return {
      documentId: '',
      status: 'error',
      error: `DB insert failed: ${insertError?.message ?? 'unknown'}`,
    }
  }

  const documentId: string = docRow.id
  const result = await processDocument(documentId, input.buffer, input.mimeType)

  return {
    documentId,
    status: result.status === 'completed' ? 'ready' : 'error',
    chunkCount: result.chunksCreated,
    error: result.errorMessage,
  }
}

/**
 * Processing step: text extraction → chunking → embedding → DB insert.
 * Can also be called standalone with a document ID when the file is already in Storage.
 */
export async function processDocument(
  documentId: string,
  bufferOrNull?: Buffer,
  mimeTypeHint?: string
): Promise<{ documentId: string; status: 'completed' | 'error'; chunksCreated?: number; errorMessage?: string }> {
  const supabase = createAdminClient()

  const update = (patch: Record<string, unknown>) =>
    supabase.from('documents').update(patch as never).eq('id', documentId)

  await update({ status: 'processing', updated_at: new Date().toISOString() })

  try {
    let text: string

    if (bufferOrNull && mimeTypeHint) {
      // Copy into a guaranteed ArrayBuffer (avoids SharedArrayBuffer TS issue)
      const ab = new Uint8Array(bufferOrNull).buffer as ArrayBuffer
      text = await extractText(new Blob([ab]), mimeTypeHint)
    } else {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('storage_path, mime_type')
        .eq('id', documentId)
        .single()

      if (docError || !doc) throw new Error('Document not found')

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('guidance-docs')
        .download((doc as { storage_path: string }).storage_path)

      if (downloadError) throw new Error(`Download failed: ${downloadError.message}`)

      text = await extractText(fileData, (doc as { mime_type: string }).mime_type)
    }

    const chunks = chunkText(text)
    const provider = getProvider()
    const embeddings = await provider.embed(chunks)

    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} vs ${chunks.length}`)
    }

    const { error: insertError } = await supabase
      .from('guidance_chunks')
      .insert(
        chunks.map((content, i) => ({
          document_id: documentId,
          chunk_index: i,
          content,
          embedding: embeddings[i],
        })) as never
      )

    if (insertError) throw new Error(`Chunk insert failed: ${insertError.message}`)

    await update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return { documentId, status: 'completed', chunksCreated: chunks.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error'
    await update({
      status: 'error',
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    return { documentId, status: 'error', errorMessage: message }
  }
}

async function extractText(blob: Blob, mimeType: string): Promise<string> {
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return blob.text()
  }
  throw new Error(`Unsupported MIME type for text extraction: ${mimeType}`)
}

function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let currentChunk = ''

  for (const p of paragraphs) {
    if (currentChunk.length + p.length > 1000) {
      if (currentChunk) chunks.push(currentChunk)
      currentChunk = p
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${p}` : p
    }
  }
  if (currentChunk) chunks.push(currentChunk)

  return chunks
}
