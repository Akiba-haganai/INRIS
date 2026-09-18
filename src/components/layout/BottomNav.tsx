'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquareText, BookOpen, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/',         label: 'Ask',     icon: MessageSquareText },
  { href: '/guidance', label: 'Library', icon: BookOpen },
  { href: '/staff',    label: 'Staff',   icon: LayoutDashboard },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur pb-safe md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          // Highlight '/staff/cases/...' as the Staff tab too
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                active ? 'text-brand-700' : 'text-slate-500'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.25]')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}