'use client'

import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export function Sheet({
  open,
  onClose,
  title,
  side = 'right',
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  side?: 'left' | 'right' | 'bottom'
  children: ReactNode
}) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const slideClasses = {
    right:  'inset-y-0 right-0 w-[min(85vw,20rem)] animate-slide-right',
    left:   'inset-y-0 left-0  w-[min(85vw,20rem)] animate-slide-left',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl animate-slide-bottom',
  }[side]

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Menu'}
        className={cn(
          'absolute bg-white shadow-xl',
          slideClasses,
          side !== 'bottom' && 'flex flex-col'
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">{title || 'Menu'}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="touch-target -mr-2 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}