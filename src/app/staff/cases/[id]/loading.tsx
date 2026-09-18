import { Skeleton } from '@/components/ui/Skeleton'
import { Card, CardBody } from '@/components/ui/Card'

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardBody className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
