import { cn } from '@/lib/utils'
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-base text-foreground',
        'placeholder:text-muted/70',
        'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
        'disabled:bg-surface-muted md:text-sm',
        className
      )}
      {...rest}
    />
  )
}