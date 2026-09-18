'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { SkeletonText } from '@/components/ui/Skeleton'
import { Loader2, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'

interface Analysis {
  id: string
  summary: string
  issues: string[]
  missing_information: string[]
  suggested_action: string
  confidence: number
  human_review_required: boolean
  created_at: string
}

interface GuidanceRef {
  id: string
  title: string
  category: string
  source: string
}

export function CaseAnalysis({
  caseId,
  initial,
}: {
  caseId: string
  initial: Analysis | null
}) {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(initial)
  const [guidance, setGuidance] = useState<GuidanceRef[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cases/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || 'Analysis failed.')
        return
      }
      setAnalysis(data.analysis)
      setGuidance(data.guidance || [])
      router.refresh()
    } catch {
      setError('Network error during analysis.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="AI Case Analysis"
        subtitle="Advisory only. A staff member makes the decision."
        action={
          <Button size="sm" onClick={runAnalysis} disabled={loading}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {analysis ? 'Re-run' : 'Run analysis'}
          </Button>
        }
      />
      <CardBody className="space-y-4">
        {error && <InlineAlert tone="error">{error}</InlineAlert>}

        {!analysis && !loading && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface/60 px-6 py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No analysis yet
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Run the analysis to generate a structured summary, missing
              information, and a suggested next step grounded in the knowledge
              base.
            </p>
          </div>
        )}

        {loading && !analysis && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analysing case
            </div>
            <SkeletonText lines={4} />
          </div>
        )}

        {analysis && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                  analysis.human_review_required
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {analysis.human_review_required ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {analysis.human_review_required
                  ? 'Human review required'
                  : 'No review flagged'}
              </span>
              <span className="text-slate-500">
                Confidence{' '}
                <span className="font-medium tabular-nums text-slate-700">
                  {(analysis.confidence * 100).toFixed(0)}%
                </span>
              </span>
            </div>

            <Field label="Summary">{analysis.summary}</Field>

            {analysis.issues.length > 0 && (
              <Field label="Key issues">
                <BulletList items={analysis.issues} />
              </Field>
            )}

            {analysis.missing_information.length > 0 && (
              <Field label="Missing information">
                <BulletList items={analysis.missing_information} />
              </Field>
            )}

            <Field label="Suggested next step">
              {analysis.suggested_action}
            </Field>

            {guidance.length > 0 && (
              <Field label="Relevant guidance">
                <ul className="space-y-1">
                  {guidance.map((g) => (
                    <li
                      key={g.id}
                      className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-600"
                    >
                      <span className="font-medium text-slate-800">
                        {g.title}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{g.category}</span>
                    </li>
                  ))}
                </ul>
              </Field>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-foreground">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}