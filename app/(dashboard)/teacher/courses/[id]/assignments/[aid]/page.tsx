import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDateTime } from '@/lib/utils'
import GradePanel from '@/app/(dashboard)/_components/GradePanel'

export default async function CourseAssignmentDetail({
  params,
}: {
  params: Promise<{ id: string; aid: string }>
}) {
  const { id: courseId, aid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/student')

  const isAdmin = profile?.role === 'admin'
  const { data: assignment } = await (isAdmin
    ? supabase.from('assignments').select('*').eq('id', aid).single()
    : supabase.from('assignments').select('*').eq('id', aid).eq('teacher_id', user.id).single()
  )
  if (!assignment) notFound()

  const [submissionsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from('submissions')
      .select('*, profiles(full_name)')
      .eq('assignment_id', aid)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('student_id, profiles(full_name, grade, classroom)')
      .eq('course_id', courseId),
  ])

  const submissions = submissionsRes.data ?? []
  const enrollments = enrollmentsRes.data ?? []

  const submittedIds = new Set(submissions.map(s => s.student_id))
  const notSubmitted = enrollments.filter(e => !submittedIds.has(e.student_id))

  const graded = submissions.filter(s => s.status === 'graded').length
  const pending = submissions.length - graded

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-6">
        <Link href={`/teacher/courses/${courseId}`}
          className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← กลับไปวิชา
        </Link>
      </div>

      {/* Assignment header */}
      <div className="border border-seam p-6 mb-8 bg-parchment-dark">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 border border-rust/30 text-rust bg-rust/5">{assignment.grade ?? '—'}</span>
              <p className="text-rust text-xs tracking-[0.25em] uppercase">งาน</p>
            </div>
            <h1 className="font-display text-3xl text-ink mb-3">{assignment.title}</h1>
            {assignment.description && (
              <p className="text-ink-muted text-sm leading-relaxed max-w-xl">{assignment.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-8">
            {assignment.due_date && (
              <div>
                <p className="text-xs tracking-widest uppercase text-ink-muted mb-1">วันส่ง</p>
                <p className="text-ink text-sm">{formatDate(assignment.due_date)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 mt-6 pt-6 border-t border-seam">
          <div>
            <p className="text-2xl font-semibold text-ink">{submissions.length}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted">ส่งแล้ว</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-verdant">{graded}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted">ตรวจแล้ว</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-rust">{pending}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted">รอตรวจ</p>
          </div>
          {notSubmitted.length > 0 && (
            <div>
              <p className="text-2xl font-semibold text-crimson">{notSubmitted.length}</p>
              <p className="text-xs tracking-widest uppercase text-ink-muted">ยังไม่ส่ง</p>
            </div>
          )}
        </div>
      </div>

      {/* Not submitted */}
      {notSubmitted.length > 0 && (
        <div className="border border-crimson/30 mb-6">
          <div className="px-6 py-4 border-b border-crimson/20 bg-crimson/5 flex items-center justify-between">
            <h2 className="font-display text-xl text-crimson">ยังไม่ส่งงาน</h2>
            <span className="text-sm text-crimson font-semibold">{notSubmitted.length} คน</span>
          </div>
          <div className="divide-y divide-seam/50">
            {notSubmitted.map((e) => {
              const profile = e.profiles as { full_name: string; grade: string | null; classroom: string | null } | null
              return (
                <div key={e.student_id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-crimson/10 border border-crimson/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-crimson">
                        {(profile?.full_name ?? '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <p className="text-ink text-sm">{profile?.full_name ?? '—'}</p>
                  </div>
                  <p className="text-ink-muted text-xs">
                    {profile?.grade ?? ''}{profile?.classroom ? ` · ${profile.classroom}` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Submissions */}
      <div className="border border-seam">
        <div className="px-6 py-4 border-b border-seam bg-parchment-dark">
          <h2 className="font-display text-xl text-ink">งานที่นักเรียนส่ง</h2>
        </div>

        {!submissions || submissions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-ink-muted text-base">ยังไม่มีนักเรียนส่งงาน</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-12 px-6 py-3 bg-parchment-dark/50 border-b border-seam/50">
              <p className="col-span-4 text-xs tracking-widest uppercase text-ink-muted">ชื่อนักเรียน</p>
              <p className="col-span-3 text-xs tracking-widest uppercase text-ink-muted">ส่งเมื่อ</p>
              <p className="col-span-2 text-xs tracking-widest uppercase text-ink-muted">สถานะ</p>
              <p className="col-span-1 text-xs tracking-widest uppercase text-ink-muted">คะแนน</p>
              <p className="col-span-2 text-xs tracking-widest uppercase text-ink-muted"></p>
            </div>

            {submissions.map((sub, i) => {
              const isLate = assignment.due_date && new Date(sub.submitted_at) > new Date(assignment.due_date)
              return (
                <div key={sub.id} className={`grid grid-cols-12 px-6 py-4 items-center ${i < submissions.length - 1 ? 'border-b border-seam' : ''}`}>
                  <span className="col-span-4 text-ink text-sm font-medium">
                    {sub.profiles?.full_name ?? 'ไม่ระบุ'}
                  </span>
                  <div className="col-span-3">
                    <p className="text-ink-muted text-xs">{formatDateTime(sub.submitted_at)}</p>
                    {isLate && (
                      <span className="text-xs text-crimson font-medium">ส่งล่าช้า</span>
                    )}
                  </div>
                  <span className="col-span-2">
                    <span className={`text-xs px-2 py-0.5 border ${
                      sub.status === 'graded'
                        ? 'text-verdant border-verdant/30 bg-verdant/5'
                        : 'text-rust border-rust/30 bg-rust-subtle'
                    }`}>
                      {sub.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ'}
                    </span>
                  </span>
                  <span className="col-span-1 text-ink text-sm font-semibold">
                    {sub.grade !== null ? `${sub.grade}` : '—'}
                  </span>
                  <span className="col-span-2">
                    <GradePanel submission={sub} />
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
