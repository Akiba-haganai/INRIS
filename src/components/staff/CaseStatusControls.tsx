'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CASE_STATUSES } from '@/lib/validations'

const LABELS: Record<string, string> = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
  closed: 'Closed',
}

export function CaseStatusControls({
  caseId,
  status,
}: {
  caseId: string
  status: string
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function update(next: string) {
    if (next === current || loading) return
    setLoading(next)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Update failed.')
        return
      }
      setCurrent(data.case.status)
      router.refresh()
    } catch {
      setError('Network error.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {CASE_STATUSES.map((s) => {
        const active = current === s
        return (
          <button
            key={s}
            type="button"
            onClick={() => update(s)}
            disabled={active || !!loading}
            className={cn(
              'focus-ring touch-target inline-flex items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors',
              active
                ? 'bg-brand-700 text-white'
                : 'border border-border bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700',
              loading && loading !== s && 'opacity-60',
              'disabled:cursor-default'
            )}
          >
            {loading === s && <Loader2 className="h-3 w-3 animate-spin" />}
            {LABELS[s] ?? s}
          </button>
        )
      })}
      {error && (
        <span className="ml-1 text-[11px] text-red-600">{error}</span>
      )}
    </div>
  )
}