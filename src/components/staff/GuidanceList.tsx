'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Book, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import type { GuidanceRecord } from '@/lib/documents'

const statusTones: Record<string, BadgeTone> = {
  demo: 'neutral',
  draft: 'info',
  approved: 'success',
  retired: 'error',
}

export function GuidanceList({ guidance }: { guidance: GuidanceRecord[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(id: string, action: 'approve' | 'retire') {
    if (!confirm(`Are you sure you want to ${action} this guidance?`)) return
    setLoading(id)
    try {
      const res = await fetch(`/api/guidance/${id}/${action}`, { method: 'POST' })
      if (!res.ok) {
        alert(`${action} failed.`)
        return
      }
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  if (guidance.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No guidance records found. Upload a document to create one.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {guidance.map((g) => (
        <li key={g.id} className="flex items-start justify-between gap-3 py-3">
          <div className="flex gap-3">
            <Book className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {g.title}
                </span>
                <Badge tone={statusTones[g.status] || 'neutral'} size="sm">
                  {g.status}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {g.category}
                {g.last_verified ? ` · Verified: ${new Date(g.last_verified).toLocaleDateString()}` : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {g.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStatus(g.id, 'approve')}
                disabled={loading === g.id}
                aria-label="Approve"
                className="text-green-600 hover:text-green-700"
              >
                {loading === g.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Approve
              </Button>
            )}
            {(g.status === 'approved' || g.status === 'draft') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStatus(g.id, 'retire')}
                disabled={loading === g.id}
                aria-label="Retire"
                className="text-red-600 hover:text-red-700"
              >
                {loading === g.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Retire
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
