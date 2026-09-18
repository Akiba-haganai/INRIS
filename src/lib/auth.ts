import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true'

export interface AppUser {
  id: string
  email: string
  role: 'public' | 'staff' | 'admin'
  full_name: string | null
}

// Development placeholder used while AUTH_ENABLED=false.
const DEV_USER: AppUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@localhost',
  role: 'admin',
  full_name: 'Development User',
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!AUTH_ENABLED) return DEV_USER

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  return profile as AppUser | null
}

export async function requireStaffPage(): Promise<AppUser> {
  if (!AUTH_ENABLED) return DEV_USER
  const user = await getCurrentUser()
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    redirect('/login?next=/staff')
  }
  return user
}

export async function requireStaffApi(): Promise<AppUser | null> {
  if (!AUTH_ENABLED) return DEV_USER
  const user = await getCurrentUser()
  if (!user) return null
  if (user.role !== 'staff' && user.role !== 'admin') return null
  return user
}

export const isAuthEnabled = () => AUTH_ENABLED
