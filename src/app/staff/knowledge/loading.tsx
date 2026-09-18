import { Skeleton } from '@/components/ui/Skeleton'
import { Card, CardBody } from '@/components/ui/Card'

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-44" />
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardBody>
      </Card>
    </div>
  )
}
