import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true'

export async function proxy(request: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next()

  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isStaffRoute = pathname.startsWith('/staff')
  const isAuthRoute = pathname === '/login'

  if (isStaffRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/staff'
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
