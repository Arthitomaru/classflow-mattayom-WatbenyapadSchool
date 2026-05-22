import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EditUserForm from './_components/EditUserForm'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const { data: { user: authUser } } = await admin.auth.admin.getUserById(id)

  return (
    <div className="p-6 md:p-10 max-w-lg">
      <div className="mb-8">
        <Link href="/admin/users" className="text-ink-muted text-sm hover:text-rust transition-colors">← ผู้ใช้</Link>
        <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">Admin</p>
        <h1 className="font-display text-4xl text-ink">แก้ไขผู้ใช้</h1>
        <p className="text-ink-muted text-sm mt-1">{authUser?.email ?? ''}</p>
      </div>
      <EditUserForm profile={profile} />
    </div>
  )
}
