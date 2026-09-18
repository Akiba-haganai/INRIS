import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCase } from '@/lib/cases'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { CaseAnalysis } from '@/components/staff/CaseAnalysis'
import { CaseStatusControls } from '@/components/staff/CaseStatusControls'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const row = await getCase(id)
  if (!row) notFound()

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link
            href="/staff"
            className="focus-ring inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to dashboard
          </Link>
          <h1 className="mt-1.5 truncate font-mono text-lg font-semibold tracking-tight md:text-xl">
            {row.case_number}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Opened {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
        <div className="-mx-1 overflow-x-auto scrollbar-none md:mx-0 md:overflow-visible">
          <div className="flex gap-1 px-1 pb-1 md:px-0 md:pb-0">
            <CaseStatusControls caseId={row.id} status={row.status} />
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader title="Case details" />
          <CardBody className="space-y-3 text-sm">
            <Row label="Category" value={row.category} />
            <Row label="Status" value={row.status} />
            <Row label="Priority" value={row.priority} />
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </p>
              <p className="whitespace-pre-wrap text-slate-800">
                {row.description}
              </p>
            </div>
          </CardBody>
        </Card>

        <CaseAnalysis caseId={row.id} initial={row.latest_analysis} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-slate-800">{value}</span>
    </div>
  )
}