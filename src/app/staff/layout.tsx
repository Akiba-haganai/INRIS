import { requireStaffPage } from '@/lib/auth'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireStaffPage()
  return <>{children}</>
}
