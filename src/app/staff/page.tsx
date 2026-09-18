import Link from 'next/link'
import { listCases, getCaseStats } from '@/lib/cases'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { CaseTable } from '@/components/staff/CaseTable'
import { CaseForm } from '@/components/staff/CaseForm'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Inbox, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>
}

export default async function StaffDashboard({ searchParams }: Props) {
  const sp = await searchParams

  const [cases, stats] = await Promise.all([
    listCases({
      status: sp.status,
      category: sp.category,
      search: sp.search,
      limit: 50,
    }),
    getCaseStats(),
  ])

  const maxCategory = stats.by_category[0]?.count || 1

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display font-semibold tracking-tight">
              Case Intelligence
            </h1>
            <Link
              href="/staff/knowledge"
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <BookOpen className="h-3 w-3" />
              Knowledge base
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            All AI output is advisory and editable by staff.
          </p>
        </div>
        <CaseForm />
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total cases" value={stats.total} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Resolved" value={stats.resolved} />
        <Stat label="Needs review" value={stats.needs_review} accent />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Cases by category" />
          <CardBody>
            {stats.by_category.length === 0 ? (
              <p className="text-sm text-slate-500">
                No cases recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.by_category.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="text-slate-700">{c.category}</span>
                      <span className="font-medium text-slate-900">
                        {c.count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out"
                        style={{
                          width: `${(c.count / maxCategory) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Common issues"
            subtitle="Aggregated from the latest analysis per case"
          />
          <CardBody>
            {stats.common_issues.length === 0 ? (
              <p className="text-sm text-slate-500">
                No analysed cases yet. Open a case and run analysis to populate
                this.
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.common_issues.map((i) => (
                  <li
                    key={i.issue}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <span className="line-clamp-2 text-slate-700">
                      {i.issue}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      {i.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardBody>
          <form
            className="flex flex-col gap-3 md:flex-row md:items-end"
            method="GET"
          >
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Search
              </label>
              <Input
                name="search"
                defaultValue={sp.search || ''}
                placeholder="Case number or description"
              />
            </div>
            <div className="md:w-40">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                name="status"
                defaultValue={sp.status || ''}
                className="focus-ring h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-foreground md:h-10 md:text-sm"
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="in_review">In review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" fullWidthOnMobile>
                Apply filters
              </Button>
              <Link
                href="/staff"
                className="focus-ring touch-target inline-flex items-center rounded-lg px-3 text-xs text-slate-500 transition-colors hover:text-slate-800"
              >
                Clear
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>

      {cases.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title={
            sp.search || sp.status || sp.category
              ? 'No cases match the current filters'
              : 'No cases yet'
          }
          description={
            sp.search || sp.status || sp.category
              ? 'Try adjusting or clearing the filters above.'
              : 'Create the first case to begin tracking passport enquiries.'
          }
        />
      ) : (
        <CaseTable cases={cases} />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  const highlight = accent && value > 0
  return (
    <Card>
      <CardBody>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p
          className={`mt-1.5 text-2xl font-semibold tabular-nums ${
            highlight ? 'text-amber-700' : 'text-foreground'
          }`}
        >
          {value}
        </p>
      </CardBody>
    </Card>
  )
}