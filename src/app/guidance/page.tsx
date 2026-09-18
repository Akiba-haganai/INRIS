import { listGuidance } from '@/lib/guidance'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function GuidancePage() {
  const grouped = await listGuidance()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display font-semibold tracking-tight">
          Guidance library
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Approved guidance used by the assistant and case analyser.
        </p>
      </div>

      {grouped.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">
              No approved guidance is loaded yet.
            </p>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {grouped.map(({ category, entries }) => (
          <Card key={category}>
            <CardHeader
              title={category}
              subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
            />
            <CardBody className="space-y-4">
              {entries.map((g) => (
                <div key={g.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {g.title}
                  </p>
                  <p className="mt-1 line-clamp-3 text-xs text-slate-600">
                    {g.content}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {g.source}
                    {g.version ? ` · v${g.version}` : ''}
                    {g.last_verified
                      ? ` · verified ${g.last_verified.slice(0, 10)}`
                      : ''}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}