import { Skeleton } from '@/components/ui/Skeleton'
import { Card, CardBody } from '@/components/ui/Card'

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
