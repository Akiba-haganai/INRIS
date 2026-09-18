'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Trash2, FileText, Loader2 } from 'lucide-react'
import type { DocumentRow } from '@/lib/documents'

const statusColours: Record<string, string> = {
  uploaded: 'bg-slate-100 text-slate-700',
  processing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  retired: 'bg-slate-200 text-slate-700',
}

export function DocumentList({ documents }: { documents: DocumentRow[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function remove(id: string) {
    if (!confirm('Delete this document and all its indexed chunks?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Delete failed.')
        return
      }
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No documents yet. Upload one above to populate the knowledge base.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {documents.map((d) => (
        <li key={d.id} className="flex items-start gap-3 py-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {d.title}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColours[d.status] || 'bg-slate-100'}`}
              >
                {d.status}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {d.original_filename} · {(d.file_size_bytes / 1024).toFixed(0)} KB
              {typeof d.metadata?.chunk_count === 'number'
                ? ` · ${d.metadata.chunk_count} chunks`
                : ''}
            </p>
            {d.error_message && (
              <p className="mt-1 text-xs text-red-600">{d.error_message}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => remove(d.id)}
            disabled={deleting === d.id}
            aria-label="Delete"
          >
            {deleting === d.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </li>
      ))}
    </ul>
  )
}
