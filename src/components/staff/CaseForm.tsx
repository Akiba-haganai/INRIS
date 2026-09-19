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
    const payload = {
      category: String(fd.get('category') || ''),
      description: String(fd.get('description') || ''),
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
      // FIX: this used to just close the form and silently refresh the
      // list — no confirmation the case was actually created, no visible
      // moment showing its new INRIS-##### number unless the user spotted
      // it themselves in the list. Landing on the case's own detail page
      // is the confirmation: the number is right there in the header.
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
      className="w-full space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm md:max-w-xl md:p-5"
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

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Description
        </label>
        <Textarea
          name="description"
          required
          minLength={10}
          rows={4}
          placeholder="Describe the case. Do not enter real citizen data — use structured test records during development."
        />
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
