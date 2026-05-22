import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import DeleteCourseButton from './_components/DeleteCourseButton'

export default async function AdminCoursesPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { q: search } = await searchParams
  const admin = createAdminClient()

  const { data: courses } = await admin
    .from('courses')
    .select('*, profiles(full_name), enrollments(count), assignments(count)')
    .order('created_at', { ascending: false })

  const filtered = (courses ?? []).filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.profiles as { full_name: string } | null)?.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/admin" className="text-ink-muted text-sm hover:text-rust transition-colors">← แดชบอร์ด</Link>
          <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">Admin</p>
          <h1 className="font-display text-4xl text-ink">จัดการวิชา</h1>
        </div>
      </div>

      <form method="GET" className="mb-4">
        <input
          name="q"
          defaultValue={search}
          placeholder="ค้นหาชื่อวิชา รหัส หรือครูผู้สอน..."
          className="w-full max-w-sm bg-parchment-dark border border-seam px-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
        />
      </form>

      <div className="border border-seam">
        <div className="px-5 py-3 bg-parchment-dark border-b border-seam grid grid-cols-12 gap-3 text-xs tracking-widest uppercase text-ink-muted">
          <span className="col-span-1">รหัส</span>
          <span className="col-span-4">ชื่อวิชา</span>
          <span className="col-span-3">ครูผู้สอน</span>
          <span className="col-span-1 text-center">นักเรียน</span>
          <span className="col-span-1 text-center">งาน</span>
          <span className="col-span-2 text-right">จัดการ</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-muted text-sm">ไม่พบวิชา</p>
        ) : (
          <ul>
            {filtered.map((c, i) => {
              const enrollCount = (c.enrollments as unknown as { count: number }[])?.[0]?.count ?? 0
              const assignCount = (c.assignments as unknown as { count: number }[])?.[0]?.count ?? 0
              const teacher = (c.profiles as { full_name: string } | null)?.full_name ?? '—'
              return (
                <li key={c.id} className={`grid grid-cols-12 gap-3 px-5 py-4 items-center ${i < filtered.length - 1 ? 'border-b border-seam' : ''}`}>
                  <span className="col-span-1 text-xs px-1.5 py-0.5 border border-rust/30 text-rust bg-rust/5 w-fit">{c.code}</span>
                  <div className="col-span-4">
                    <p className="text-sm text-ink font-medium truncate">{c.name}</p>
                    <p className="text-xs text-ink-muted">{formatDate(c.created_at)}</p>
                  </div>
                  <span className="col-span-3 text-sm text-ink-muted truncate">{teacher}</span>
                  <span className="col-span-1 text-sm text-ink text-center">{enrollCount}</span>
                  <span className="col-span-1 text-sm text-ink text-center">{assignCount}</span>
                  <div className="col-span-2 flex justify-end gap-3 items-center">
                    <Link href={`/teacher/courses/${c.id}`}
                      className="text-xs text-ink-muted hover:text-rust transition-colors">จัดการ</Link>
                    <DeleteCourseButton courseId={c.id} name={c.name} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
