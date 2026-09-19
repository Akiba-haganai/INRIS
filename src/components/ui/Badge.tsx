import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type BadgeTone = 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'brand'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: BadgeSize
  children: ReactNode
}

const toneMap: Record<BadgeTone, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200/60',
  success: 'bg-green-100 text-green-800 border-green-200/60',
  warning: 'bg-amber-100 text-amber-800 border-amber-200/60',
  error: 'bg-red-100 text-red-800 border-red-200/60',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/60',
  brand: 'bg-brand-50 text-brand-800 border-brand-200/60',
}

const sizeMap: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({ tone = 'neutral', size = 'md', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide',
        toneMap[tone],
        sizeMap[size],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
