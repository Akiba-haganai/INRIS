import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'

export const metadata: Metadata = {
  title: 'INRIS Assistant — Passport Guidance & Case Intelligence',
  description:
    'AI-assisted passport guidance and case intelligence. Advisory only.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2a4e7a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-surface-muted text-foreground antialiased">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 py-5 pb-24 md:py-8 md:pb-8">
          {children}
        </main>
        <footer className="mx-auto hidden max-w-6xl px-4 pb-6 text-center text-xs text-slate-400 md:block">
          Prototype only. AI output is advisory and is not an official
          government decision.
        </footer>
        <BottomNav />
      </body>
    </html>
  )
}