import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import AddStudentForm from '@/app/(dashboard)/teacher/courses/_components/AddStudentForm'
import AddTopicForm from '@/app/(dashboard)/teacher/courses/_components/AddTopicForm'
import ContentItemActions from '@/app/(dashboard)/teacher/courses/[id]/content/_components/ContentItemActions'
import DeleteAssignmentButton from '@/app/(dashboard)/teacher/courses/[id]/assignments/_components/DeleteAssignmentButton'

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/student')

  const isAdmin = profile?.role === 'admin'
  const db = isAdmin ? createAdminClient() : supabase

  const { data: course } = await (isAdmin
    ? db.from('courses').select('*').eq('id', id).single()
    : db.from('courses').select('*').eq('id', id).eq('teacher_id', user.id).single()
  )
  if (!course) notFound()

  const [assignmentsRes, enrollmentsRes, topicsRes, quizzesRes] = await Promise.all([
    db.from('assignments')
      .select('*, submissions(count)')
      .eq('course_id', id)
      .order('created_at', { ascending: false }),
    db.from('enrollments')
      .select('*, profiles(full_name, grade, classroom, avatar_url)')
      .eq('course_id', id)
      .order('created_at', { ascending: true }),
    db.from('topics')
      .select('*, content_items(*)')
      .eq('course_id', id)
      .order('created_at', { ascending: true }),
    db.from('quizzes')
      .select('id, title, status, quiz_questions(count)')
      .eq('course_id', id)
      .order('created_at', { ascending: false }),
  ])

  const assignments = assignmentsRes.data ?? []
  const enrollments = enrollmentsRes.data ?? []
  const topics = topicsRes.data ?? []
  const quizzes = quizzesRes.data ?? []

  const assignmentIds = assignments.map(a => a.id)
  let pendingGrading = 0
  if (assignmentIds.length > 0) {
    const { count } = await db
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .in('assignment_id', assignmentIds)
      .eq('status', 'submitted')
    pendingGrading = count ?? 0
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-6">
        <Link href={isAdmin ? '/admin/courses' : '/teacher/courses'}
          className="text-ink-muted text-sm hover:text-rust transition-colors">
          {isAdmin ? '← จัดการวิชา' : '← วิชาของฉัน'}
        </Link>
      </div>

      {/* Course header */}
      <div className="border border-seam p-6 mb-8 bg-parchment-dark">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs px-2 py-0.5 border border-rust/30 text-rust bg-rust/5 mb-2 inline-block">{course.code}</span>
            <h1 className="font-display text-3xl text-ink mb-2">{course.name}</h1>
            {course.description && (
              <p className="text-ink-muted text-sm leading-relaxed max-w-xl">{course.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-6 mt-6 pt-6 border-t border-seam">
          <div>
            <p className="text-2xl font-semibold text-ink">{enrollments.length}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted">นักเรียน</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-ink">{assignments.length}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted">งาน</p>
          </div>
          {pendingGrading > 0 && (
            <div>
              <p className="text-2xl font-semibold text-rust">{pendingGrading}</p>
              <p className="text-xs tracking-widest uppercase text-ink-muted">รอตรวจ</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assignments (left 2/3) */}
        <div className="col-span-1 md:col-span-2">
          <div className="border border-seam">
            <div className="flex items-center justify-between px-5 py-4 border-b border-seam bg-parchment-dark">
              <h2 className="font-display text-lg text-ink">งานที่มอบหมาย</h2>
              <Link href={`/teacher/courses/${id}/assignments/new`}
                className="text-sm text-rust hover:text-rust-dark transition-colors">
                + มอบหมายงานใหม่
              </Link>
            </div>

            {assignments.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-ink-muted text-sm mb-4">ยังไม่มีงาน</p>
                <Link href={`/teacher/courses/${id}/assignments/new`}
                  className="inline-block bg-ink text-parchment px-5 py-2 text-sm hover:bg-rust transition-colors">
                  สร้างงานแรก
                </Link>
              </div>
            ) : (
              <ul>
                {assignments.map((a, i) => {
                  const subCount = (a.submissions as unknown as { count: number }[])?.[0]?.count ?? 0
                  return (
                    <li key={a.id} className={`flex items-center ${i < assignments.length - 1 ? 'border-b border-seam' : ''}`}>
                      <Link
                        href={`/teacher/courses/${id}/assignments/${a.id}`}
                        className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-parchment-dark transition-colors group"
                      >
                        <div>
                          <p className="text-ink text-sm group-hover:text-rust transition-colors">{a.title}</p>
                          <p className="text-ink-muted text-xs mt-0.5">
                            {a.due_date ? `กำหนดส่ง: ${formatDate(a.due_date)}` : 'ไม่กำหนดวันส่ง'}
                            {subCount > 0 && ` · ส่งแล้ว ${subCount} คน`}
                          </p>
                        </div>
                        <span className="text-xs text-rust">ดูงาน →</span>
                      </Link>
                      <div className="pr-3 flex-shrink-0">
                        <DeleteAssignmentButton assignmentId={a.id} courseId={id} title={a.title} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Students (right 1/3) */}
        <div className="col-span-1">
          <div className="border border-seam">
            <div className="px-5 py-4 border-b border-seam bg-parchment-dark">
              <h2 className="font-display text-lg text-ink">นักเรียน ({enrollments.length})</h2>
            </div>

            <div className="p-4 border-b border-seam">
              <AddStudentForm courseId={id} />
            </div>

            {enrollments.length === 0 ? (
              <p className="px-5 py-8 text-center text-ink-muted text-sm">ยังไม่มีนักเรียน</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {enrollments.map((e, i) => (
                  <li key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i < enrollments.length - 1 ? 'border-b border-seam' : ''}`}>
                    {(e.profiles as { avatar_url?: string | null } | null)?.avatar_url ? (
                      <Image
                        src={(e.profiles as { avatar_url: string }).avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rust/10 border border-rust/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-rust">
                          {(e.profiles?.full_name ?? '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-ink text-sm">{e.profiles?.full_name ?? '—'}</p>
                      <p className="text-ink-muted text-xs">
                        {e.profiles?.grade ?? ''}
                        {e.profiles?.classroom ? ` · ${e.profiles.classroom}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Topics & Content */}
      <div className="mt-6 border border-seam">
        <div className="flex items-center justify-between px-5 py-4 border-b border-seam bg-parchment-dark">
          <h2 className="font-display text-lg text-ink">เนื้อหาบทเรียน</h2>
          {topics.length > 0 && (
            <Link
              href={`/teacher/courses/${id}/content/new`}
              className="text-sm text-rust hover:text-rust-dark transition-colors"
            >
              + เพิ่มเนื้อหา
            </Link>
          )}
        </div>

        {topics.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-ink-muted text-sm mb-4">ยังไม่มีหัวข้อ — สร้างหัวข้อแรกก่อน</p>
            <div className="max-w-sm mx-auto">
              <AddTopicForm courseId={id} />
            </div>
          </div>
        ) : (
          <div>
            {topics.map((topic, ti) => {
              const items = (topic.content_items ?? []) as Array<{
                id: string; title: string; description: string | null
                type: string; url: string | null; file_path: string | null
              }>
              return (
                <div key={topic.id} className={ti < topics.length - 1 ? 'border-b border-seam' : ''}>
                  <div className="flex items-center justify-between px-5 py-3 bg-parchment-dark/50">
                    <div className="flex items-center gap-3">
                      <span className="font-display italic text-rust text-sm">{ti + 1}.</span>
                      <h3 className="font-semibold text-ink text-sm">{topic.title}</h3>
                      <span className="text-xs text-ink-muted">{items.length} รายการ</span>
                    </div>
                    <Link
                      href={`/teacher/courses/${id}/content/new?topic_id=${topic.id}`}
                      className="text-xs text-rust hover:text-rust-dark transition-colors"
                    >
                      + เพิ่ม
                    </Link>
                  </div>
                  {items.length > 0 && (
                    <ul>
                      {items.map((item, ii) => (
                        <li key={item.id} className={ii < items.length - 1 ? 'border-b border-seam/50' : ''}>
                          <ContentItemActions item={item} courseId={id} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
            <div className="px-5 py-4 border-t border-seam bg-parchment-dark/30">
              <AddTopicForm courseId={id} />
            </div>
          </div>
        )}
      </div>
      {/* Quizzes */}
      <div className="mt-6 border border-seam">
        <div className="flex items-center justify-between px-5 py-4 border-b border-seam bg-parchment-dark">
          <h2 className="font-display text-lg text-ink">ข้อสอบ</h2>
          <Link href={`/teacher/courses/${id}/quizzes/new`}
            className="text-sm text-rust hover:text-rust-dark transition-colors">
            + สร้างข้อสอบ
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-ink-muted text-sm mb-3">ยังไม่มีข้อสอบ</p>
            <Link href={`/teacher/courses/${id}/quizzes/new`}
              className="inline-block bg-ink text-parchment px-5 py-2 text-sm hover:bg-rust transition-colors">
              สร้างข้อสอบแรก
            </Link>
          </div>
        ) : (
          <ul>
            {quizzes.map((q, i) => {
              const qCount = (q.quiz_questions as unknown as { count: number }[])?.[0]?.count ?? 0
              const statusColor = q.status === 'open' ? 'text-verdant border-verdant/30 bg-verdant/5'
                : q.status === 'closed' ? 'text-crimson border-crimson/30 bg-crimson/5'
                : 'text-ink-muted border-seam'
              const statusLabel = q.status === 'open' ? 'เปิดสอบ' : q.status === 'closed' ? 'ปิดสอบ' : 'ร่าง'
              return (
                <li key={q.id} className={i < quizzes.length - 1 ? 'border-b border-seam' : ''}>
                  <Link href={`/teacher/courses/${id}/quizzes/${q.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-parchment-dark transition-colors group">
                    <div>
                      <p className="text-ink text-sm group-hover:text-rust transition-colors">{q.title}</p>
                      <p className="text-ink-muted text-xs mt-0.5">{qCount} คำถาม</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 border ${statusColor}`}>{statusLabel}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
