'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Loader2, Upload } from 'lucide-react'
import { CASE_CATEGORIES } from '@/lib/validations'

export function DocumentUpload() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  // FIX: category previously wasn't collected at all, so every uploaded
  // document's linked guidance row defaulted to "Other" regardless of
  // what it actually covered (see FR-03).
  const [category, setCategory] = useState<string>(CASE_CATEGORIES[0])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  async function onSubmit() {
    setError(null)
    setSuccess(null)
    if (!file) {
      setError('Choose a file first.')
      return
    }
    setLoading(true)

    const fd = new FormData()
    fd.append('file', file)
    if (title) fd.append('title', title)
    fd.append('category', category)

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Upload failed.')
        return
      }
      setSuccess(
        data.status === 'ready'
          ? `Indexed ${data.chunkCount} chunks. Added to the ${category} guidance library.`
          : data.message || 'Document uploaded but not fully processed.'
      )
      setFile(null)
      setTitle('')
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch {
      setError('Network error during upload.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Passport Application Requirements 2025"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="focus-ring h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-foreground md:h-10 md:text-sm"
          >
            {CASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          File
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          onChange={onFileChange}
          className="focus-ring block w-full cursor-pointer rounded-lg border border-border bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="mt-1.5 text-[11px] text-slate-500">
          PDF, DOCX, TXT or Markdown. Maximum 20 MB.
        </p>
      </div>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}
      {success && <InlineAlert tone="success">{success}</InlineAlert>}

      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          loading={loading}
          disabled={!file}
          fullWidthOnMobile
        >
          {!loading && <Upload className="h-4 w-4" />}
          {loading ? 'Uploading and indexing' : 'Upload and index'}
        </Button>
      </div>
    </div>
  )
}
