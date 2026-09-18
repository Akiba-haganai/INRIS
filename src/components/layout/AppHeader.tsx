'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, MessageSquareText, BookOpen, LayoutDashboard, LogOut, Database } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hasAI, setHasAI] = useState(true)
  const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true'
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHasAI(d?.checks?.ai?.ok ?? false))
      .catch(() => setHasAI(false))
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const nav = [
    { href: '/', label: 'Guidance', icon: MessageSquareText },
    { href: '/guidance', label: 'Library', icon: BookOpen },
    ...(user ? [
      { href: '/staff', label: 'Staff', icon: LayoutDashboard },
      { href: '/staff/knowledge', label: 'Knowledge', icon: Database }
    ] : []),
  ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur pt-safe">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-brand-800">
              INRIS Assistant
            </span>
            <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-700">
              MVP
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ href, label }) => {
              const active =
                href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-brand-50 font-medium text-brand-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {label}
                </Link>
              )
            })}
            {authEnabled && (
              user ? (
                <button
                  onClick={signOut}
                  className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="ml-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Sign in
                </Link>
              )
            )}
          </nav>

          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="touch-target -mr-2 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {!hasAI && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-[11px] text-amber-800 md:hidden">
            AI provider not configured — chat will not respond
          </div>
        )}
      </header>

      <Sheet open={open} onClose={() => setOpen(false)} title="Navigate" side="right">
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'touch-target flex items-center gap-3 rounded-lg px-3 py-3 text-sm',
                  active
                    ? 'bg-brand-50 font-medium text-brand-800'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
          {authEnabled && (
            user ? (
              <button
                onClick={signOut}
                className="touch-target flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="touch-target flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
              >
                Sign in
              </Link>
            )
          )}
        </nav>
      </Sheet>
    </>
  )
}
