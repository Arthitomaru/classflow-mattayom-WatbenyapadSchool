import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './_components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <div className="p-6 md:p-10 max-w-lg">
      <div className="mb-8">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">บัญชีของฉัน</p>
        <h1 className="font-display text-4xl text-ink">โปรไฟล์</h1>
      </div>

      <ProfileForm profile={profile} />

      <div className="mt-6 pt-6 border-t border-seam">
        <Link
          href="/change-password"
          className="text-sm text-ink-muted hover:text-rust transition-colors"
        >
          เปลี่ยนรหัสผ่าน →
        </Link>
      </div>
    </div>
  )
}
