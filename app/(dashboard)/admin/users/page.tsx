import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DeleteUserButton from './_components/DeleteUserButton'
import UsersFilter from './_components/UsersFilter'

export default async function AdminUsersPage({
  searchParams,
}: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { role: roleFilter, q: search } = await searchParams

  const admin = createAdminClient()
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (roleFilter && roleFilter !== 'all') query = query.eq('role', roleFilter)
  const { data: profiles } = await query

  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? '']))

  const filtered = (profiles ?? []).filter(p =>
    !search || p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (emailMap.get(p.id) ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/admin" className="text-ink-muted text-sm hover:text-rust transition-colors">← แดชบอร์ด</Link>
          <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">Admin</p>
          <h1 className="font-display text-4xl text-ink">จัดการผู้ใช้</h1>
        </div>
        <Link href="/admin/users/new"
          className="bg-ink text-parchment px-5 py-3 text-sm hover:bg-rust transition-colors">
          + สร้างผู้ใช้
        </Link>
      </div>

      <UsersFilter currentRole={roleFilter} currentSearch={search} />

      <div className="border border-seam mt-4">
        <div className="px-5 py-3 bg-parchment-dark border-b border-seam grid grid-cols-12 gap-3 text-xs tracking-widest uppercase text-ink-muted">
          <span className="col-span-3">ชื่อ</span>
          <span className="col-span-3">อีเมล</span>
          <span className="col-span-2">บทบาท</span>
          <span className="col-span-2">ชั้น/ห้อง</span>
          <span className="col-span-2 text-right">จัดการ</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-muted text-sm">ไม่พบผู้ใช้</p>
        ) : (
          <ul>
            {filtered.map((p, i) => (
              <li key={p.id} className={`grid grid-cols-12 gap-3 px-5 py-4 items-center ${i < filtered.length - 1 ? 'border-b border-seam' : ''}`}>
                <span className="col-span-3 text-sm text-ink font-medium truncate">{p.full_name}</span>
                <span className="col-span-3 text-sm text-ink-muted truncate">{emailMap.get(p.id) ?? '—'}</span>
                <span className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 border ${
                    p.role === 'teacher' ? 'text-rust border-rust/30 bg-rust/5'
                    : p.role === 'admin' ? 'text-verdant border-verdant/30 bg-verdant/5'
                    : 'text-ink-muted border-seam'
                  }`}>{p.role}</span>
                </span>
                <span className="col-span-2 text-xs text-ink-muted truncate">
                  {p.grade ?? ''}{p.classroom ? ` · ${p.classroom}` : ''}
                </span>
                <div className="col-span-2 flex justify-end gap-3">
                  <Link href={`/admin/users/${p.id}/edit`}
                    className="text-xs text-ink-muted hover:text-rust transition-colors">แก้ไข</Link>
                  <DeleteUserButton userId={p.id} name={p.full_name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
