import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminQuizzesPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { q: search, status: statusFilter } = await searchParams
  const admin = createAdminClient()

  const { data: quizzes } = await admin
    .from('quizzes')
    .select('*, courses(id, name, code, profiles(full_name)), quiz_questions(count), quiz_attempts(count)')
    .order('created_at', { ascending: false })

  const rows = quizzes ?? []
  const filtered = rows.filter((q) => {
    if (statusFilter && statusFilter !== 'all' && q.status !== statusFilter) return false
    if (!search) return true
    const course = (q.courses as { name: string } | null)?.name ?? ''
    return (
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      course.toLowerCase().includes(search.toLowerCase())
    )
  })

  const statusColor = (s: string) =>
    s === 'open' ? 'text-verdant border-verdant/30 bg-verdant/5'
    : s === 'closed' ? 'text-crimson border-crimson/30 bg-crimson/5'
    : 'text-ink-muted border-seam'
  const statusLabel = (s: string) =>
    s === 'open' ? 'เปิดสอบ' : s === 'closed' ? 'ปิดสอบ' : 'ร่าง'

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-8">
        <Link href="/admin" className="text-ink-muted text-sm hover:text-rust transition-colors">← แดชบอร์ด</Link>
        <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">Admin</p>
        <h1 className="font-display text-4xl text-ink">ข้อสอบ</h1>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <form method="GET" className="flex-1">
          <input name="status" type="hidden" defaultValue={statusFilter} />
          <input
            name="q"
            defaultValue={search}
            placeholder="ค้นหาชื่อข้อสอบหรือวิชา..."
            className="w-full max-w-sm bg-parchment-dark border border-seam px-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
          />
        </form>
        <div className="flex gap-2">
          {[
            { value: '', label: 'ทั้งหมด' },
            { value: 'draft', label: 'ร่าง' },
            { value: 'open', label: 'เปิดสอบ' },
            { value: 'closed', label: 'ปิดสอบ' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={`/admin/quizzes?status=${opt.value}${search ? `&q=${search}` : ''}`}
              className={`px-3 py-2 text-xs border transition-colors ${
                (statusFilter ?? '') === opt.value
                  ? 'bg-ink text-parchment border-ink'
                  : 'border-seam text-ink-muted hover:border-ink hover:text-ink'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border border-seam">
        <div className="px-5 py-3 bg-parchment-dark border-b border-seam grid grid-cols-12 gap-3 text-xs tracking-widest uppercase text-ink-muted">
          <span className="col-span-4">ชื่อข้อสอบ</span>
          <span className="col-span-3">วิชา</span>
          <span className="col-span-2">ครูผู้สอน</span>
          <span className="col-span-1 text-center">ข้อ</span>
          <span className="col-span-1 text-center">ผู้สอบ</span>
          <span className="col-span-1 text-right">สถานะ</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-muted text-sm">ไม่พบข้อสอบ</p>
        ) : (
          <ul>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filtered.map((q: any, i: number) => {
              const course = q.courses as { id: string; name: string; code: string; profiles?: { full_name: string } | null } | null
              const qCount = (q.quiz_questions as unknown as { count: number }[])?.[0]?.count ?? 0
              const aCount = (q.quiz_attempts as unknown as { count: number }[])?.[0]?.count ?? 0
              return (
                <li key={q.id} className={`grid grid-cols-12 gap-3 px-5 py-4 items-center ${i < filtered.length - 1 ? 'border-b border-seam' : ''}`}>
                  <div className="col-span-4">
                    <Link
                      href={course ? `/teacher/courses/${course.id}/quizzes/${q.id}` : '#'}
                      className="text-sm text-ink hover:text-rust transition-colors font-medium"
                    >
                      {q.title}
                    </Link>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-ink-muted truncate">{course?.name ?? '—'}</p>
                    {course?.code && <span className="text-xs text-rust">{course.code}</span>}
                  </div>
                  <span className="col-span-2 text-xs text-ink-muted truncate">
                    {course?.profiles?.full_name ?? '—'}
                  </span>
                  <span className="col-span-1 text-sm text-ink text-center">{qCount}</span>
                  <span className="col-span-1 text-sm text-ink text-center">{aCount}</span>
                  <span className="col-span-1 flex justify-end">
                    <span className={`text-xs px-1.5 py-0.5 border ${statusColor(q.status)}`}>
                      {statusLabel(q.status)}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
