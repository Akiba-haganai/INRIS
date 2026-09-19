import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidthOnMobile?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-300',
  secondary:
    'bg-white text-brand-800 border border-border hover:bg-brand-50 active:bg-brand-100 disabled:text-muted',
  ghost:
    'bg-transparent text-brand-800 hover:bg-brand-50 active:bg-brand-100',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
}

// Minimum 44px height on mobile, tighter on desktop
const sizes: Record<Size, string> = {
  sm: 'h-11 md:h-9 px-3 text-sm',
  md: 'h-12 md:h-10 px-4 text-sm',
  lg: 'h-13 md:h-11 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidthOnMobile = false,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-150',
        'focus-ring',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidthOnMobile && 'w-full md:w-auto',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {children}
    </button>
  )
}