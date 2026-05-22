import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewUserForm from './_components/NewUserForm'

export default async function NewUserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="p-6 md:p-10 max-w-lg">
      <div className="mb-8">
        <Link href="/admin/users" className="text-ink-muted text-sm hover:text-rust transition-colors">← ผู้ใช้</Link>
        <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">Admin</p>
        <h1 className="font-display text-4xl text-ink">สร้างผู้ใช้ใหม่</h1>
      </div>
      <NewUserForm />
    </div>
  )
}
