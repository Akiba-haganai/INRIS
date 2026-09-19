'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'

import { Badge, type BadgeTone } from '@/components/ui/Badge'

export interface CaseRowLite {
  id: string
  case_number: string
  category: string
  description: string
  status: string
  priority: string
  created_at: string
}

const statusTones: Record<string, BadgeTone> = {
  open: 'info',
  in_review: 'warning',
  resolved: 'success',
  closed: 'neutral',
}

const priorityTones: Record<string, BadgeTone> = {
  low: 'neutral',
  normal: 'neutral',
  high: 'warning',
  urgent: 'error',
}

export function CaseTable({ cases }: { cases: CaseRowLite[] }) {
  if (cases.length === 0) {
    return (
      <Card>
        <p className="p-6 text-center text-sm text-slate-500">
          No cases match the current filters.
        </p>
      </Card>
    )
  }

  return (
    <>
      {/* ── Mobile: card list ─────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {cases.map((c) => (
          <Link
            key={c.id}
            href={`/staff/cases/${c.id}`}
            className="block rounded-xl border border-border bg-white p-4 shadow-sm active:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-brand-800">
                {c.case_number}
              </span>
              <Badge tone={statusTones[c.status] || 'neutral'} size="sm">
                {c.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-900">{c.category}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
              {c.description}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Desktop: table ────────────────────────────────── */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Case</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/staff/cases/${c.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {c.case_number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{c.category}</td>
                  <td className="max-w-md px-4 py-2.5 text-slate-600">
                    <span className="line-clamp-1">{c.description}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTones[c.status] || 'neutral'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={priorityTones[c.priority] || 'neutral'}>
                      {c.priority}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}