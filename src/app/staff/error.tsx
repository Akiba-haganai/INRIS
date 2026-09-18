'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Card>
      <CardBody className="space-y-3 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertCircle className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          The dashboard couldn't load.
        </p>
        <p className="text-xs text-slate-500">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <Button variant="secondary" size="sm" onClick={reset}>
          Try again
        </Button>
      </CardBody>
    </Card>
  )
}
