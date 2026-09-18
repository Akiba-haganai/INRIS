import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        // 48px tall on mobile for easy tapping, 40px on desktop
        'h-12 w-full rounded-lg border border-border bg-white px-3.5 text-base text-foreground',
        'placeholder:text-muted/70',
        'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
        'disabled:bg-surface-muted md:h-10 md:text-sm',
        className
      )}
      {...rest}
    />
  )
}