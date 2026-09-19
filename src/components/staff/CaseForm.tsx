'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { CASE_CATEGORIES, CASE_PRIORITIES } from '@/lib/validations'
import { Plus } from 'lucide-react'

export function CaseForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const fd = new FormData(e.currentTarget)
    
    // Combine structured fields into the description
    const goal = String(fd.get('goal') || '').trim()
    const issue = String(fd.get('issue') || '').trim()
    const stage = String(fd.get('stage') || '').trim()
    const info = String(fd.get('info') || '').trim()
    const missing = String(fd.get('missing') || '').trim()
    const notes = String(fd.get('notes') || '').trim()
    
    const description = [
      `**Applicant Goal**: ${goal || 'Not specified'}`,
      `**Core Issue**: ${issue || 'Not specified'}`,
      `**Current Stage**: ${stage || 'Not specified'}`,
      `**Available Information/Documents**: ${info || 'None specified'}`,
      `**Missing Information**: ${missing || 'None specified'}`,
      `**Staff Notes**: ${notes || 'None'}`
    ].join('\n\n')

    const payload = {
      category: String(fd.get('category') || ''),
      description,
      priority: String(fd.get('priority') || 'normal'),
    }

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to create case.')
        return
      }
      setOpen(false)
      router.push(`/staff/cases/${data.case.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} fullWidthOnMobile>
        <Plus className="h-4 w-4" />
        New case
      </Button>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm md:max-w-2xl md:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            name="category"
            required
            defaultValue="Lost Passport"
            className="focus-ring h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-foreground md:h-10 md:text-sm"
          >
            {CASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Priority
          </label>
          <select
            name="priority"
            defaultValue="normal"
            className="focus-ring h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-foreground md:h-10 md:text-sm"
          >
            {CASE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">What is the applicant trying to do?</label>
          <Textarea name="goal" required rows={2} placeholder="e.g., Renew passport, replace lost ID..." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">What happened / what is the issue?</label>
          <Textarea name="issue" required rows={2} placeholder="e.g., Application rejected, missing birth certificate..." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">What stage is the case currently at?</label>
          <Textarea name="stage" rows={2} placeholder="e.g., Intake, pending review, waiting for docs..." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">What information or documents are available?</label>
          <Textarea name="info" rows={2} placeholder="e.g., Provided police report, expired passport..." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">What information appears to be missing?</label>
          <Textarea name="missing" rows={2} placeholder="e.g., Needs recent photo, fee payment..." />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Additional staff notes</label>
          <Textarea name="notes" rows={2} placeholder="Any other context..." />
        </div>
      </div>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={submitting}
          fullWidthOnMobile
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting} fullWidthOnMobile>
          Create case
        </Button>
      </div>
    </form>
  )
}
