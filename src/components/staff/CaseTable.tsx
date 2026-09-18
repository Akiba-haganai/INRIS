'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export interface CaseRowLite {
  id: string
  case_number: string
  category: string
  description: string
  status: string
  priority: string
  created_at: string
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_review: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-slate-200 text-slate-700',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-slate-100 text-slate-600',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
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
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  statusColors[c.status] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.status}
              </span>
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[c.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        priorityColors[c.priority] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.priority}
                    </span>
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