import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

type Tone = 'info' | 'success' | 'warning' | 'error'

const tones: Record<Tone, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'border-brand-200 bg-brand-50 text-brand-900',
    icon: <Info className="h-3.5 w-3.5" />,
  },
  success: {
    wrapper: 'border-green-200 bg-green-50 text-green-900',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-900',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
}

export function InlineAlert({
  tone = 'info',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  const t = tones[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
        t.wrapper
      )}
    >
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
