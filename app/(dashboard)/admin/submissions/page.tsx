import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDateTime } from '@/lib/utils'

export default async function AdminSubmissionsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { q: search, status: statusFilter } = await searchParams
  const admin = createAdminClient()

  const { data: submissions } = await admin
    .from('submissions')
    .select('*, profiles(full_name, grade, classroom), assignments(id, title, due_date, course_id, courses(id, name, code))')
    .order('submitted_at', { ascending: false })

  const rows = submissions ?? []
  const filtered = rows.filter((s) => {
    if (statusFilter && statusFilter !== 'all' && s.status !== statusFilter) return false
    if (!search) return true
    const student = (s.profiles as { full_name: string } | null)?.full_name ?? ''
    const assignment = (s.assignments as { title: string } | null)?.title ?? ''
    const course = (s.assignments as unknown as { courses?: { name: string } | null } | null)?.courses?.name ?? ''
    return (
      student.toLowerCase().includes(search.toLowerCase()) ||
      assignment.toLowerCase().includes(search.toLowerCase()) ||
      course.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <Link href="/admin" className="text-ink-muted text-sm hover:text-rust transition-colors">← แดชบอร์ด</Link>
        <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">Admin</p>
        <h1 className="font-display text-4xl text-ink">งานที่ส่ง</h1>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <form method="GET" className="flex gap-2 flex-1">
          <input name="status" type="hidden" defaultValue={statusFilter} />
          <input
            name="q"
            defaultValue={search}
            placeholder="ค้นหานักเรียน งาน หรือวิชา..."
            className="flex-1 max-w-sm bg-parchment-dark border border-seam px-4 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
          />
        </form>
        <div className="flex gap-2">
          {[
            { value: '', label: 'ทั้งหมด' },
            { value: 'submitted', label: 'รอตรวจ' },
            { value: 'graded', label: 'ตรวจแล้ว' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={`/admin/submissions?status=${opt.value}${search ? `&q=${search}` : ''}`}
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
          <span className="col-span-2">นักเรียน</span>
          <span className="col-span-3">งาน</span>
          <span className="col-span-2">วิชา</span>
          <span className="col-span-2">ส่งเมื่อ</span>
          <span className="col-span-1">สถานะ</span>
          <span className="col-span-1 text-center">คะแนน</span>
          <span className="col-span-1 text-right">ดู</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-muted text-sm">ไม่พบรายการ</p>
        ) : (
          <ul>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filtered.map((s: any, i: number) => {
              const student = s.profiles as { full_name: string; grade: string | null; classroom: string | null } | null
              const assignment = s.assignments as unknown as { id: string; title: string; due_date: string | null; course_id: string; courses?: { id: string; name: string; code: string } | null } | null
              const isLate = assignment?.due_date && new Date(s.submitted_at as string) > new Date(assignment.due_date)
              return (
                <li key={s.id} className={`grid grid-cols-12 gap-3 px-5 py-4 items-center ${i < filtered.length - 1 ? 'border-b border-seam' : ''} ${isLate ? 'bg-crimson/3' : ''}`}>
                  <div className="col-span-2">
                    <p className="text-sm text-ink font-medium truncate">{student?.full_name ?? '—'}</p>
                    <p className="text-xs text-ink-muted">{student?.grade ?? ''}{student?.classroom ? ` · ${student.classroom}` : ''}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-ink truncate">{assignment?.title ?? '—'}</p>
                    {isLate && (
                      <span className="text-xs text-crimson">ส่งล่าช้า</span>
                    )}
                  </div>
                  <span className="col-span-2 text-xs text-ink-muted truncate">
                    {assignment?.courses?.name ?? '—'}
                  </span>
                  <span className="col-span-2 text-xs text-ink-muted">{formatDateTime(s.submitted_at)}</span>
                  <span className="col-span-1">
                    <span className={`text-xs px-1.5 py-0.5 border ${
                      s.status === 'graded'
                        ? 'text-verdant border-verdant/30 bg-verdant/5'
                        : 'text-rust border-rust/30 bg-rust/5'
                    }`}>
                      {s.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ'}
                    </span>
                  </span>
                  <span className="col-span-1 text-sm text-ink text-center font-semibold">
                    {s.grade !== null ? s.grade : '—'}
                  </span>
                  <span className="col-span-1 text-right">
                    {assignment?.courses?.id && assignment?.course_id && (
                      <Link
                        href={`/teacher/courses/${assignment.courses.id}/assignments/${assignment.id}`}
                        className="text-xs text-rust hover:text-rust-dark transition-colors"
                      >
                        ดู →
                      </Link>
                    )}
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
