import { createAdminClient } from '@/lib/supabase/admin'

export interface DocumentRow {
  id: string
  title: string
  original_filename: string
  storage_path: string
  mime_type: string
  file_size_bytes: number
  sha256: string
  version: number
  status: 'uploaded' | 'processing' | 'ready' | 'failed' | 'retired'
  uploaded_by: string | null
  uploaded_at: string
  processed_at: string | null
  error_message: string | null
  metadata: Record<string, unknown>
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false })
  if (error) throw new Error(`listDocuments failed: ${error.message}`)
  return (data ?? []) as DocumentRow[]
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getDocument failed: ${error.message}`)
  return (data as DocumentRow) ?? null
}

export async function createDocument(input: {
  title: string
  original_filename: string
  storage_path: string
  mime_type: string
  file_size_bytes: number
  sha256: string
  uploaded_by: string | null
}): Promise<DocumentRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('documents')
    .insert(input)
    .select('*')
    .single()
  if (error) throw new Error(`createDocument failed: ${error.message}`)
  return data as DocumentRow
}

export async function updateDocument(
  id: string,
  patch: Partial<DocumentRow>
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('documents').update(patch as never).eq('id', id)
  if (error) throw new Error(`updateDocument failed: ${error.message}`)
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw new Error(`deleteDocument failed: ${error.message}`)
}

export async function findDocumentBySha(
  sha256: string
): Promise<DocumentRow | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('sha256', sha256)
    .maybeSingle()
  return (data as DocumentRow) ?? null
}
