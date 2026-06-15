import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, daysRemaining, gradeToLetter } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

function courseHue(code: string): number {
  const prefix = code.replace(/\d/g, '').substring(0, 3).toUpperCase()
  const map: Record<string, number> = {
    SCI: 200, WAT: 200, PHY: 210, CHE: 190, BIO: 180,
    MAT: 340, KHN: 340,
    THA: 150, PHA: 150,
    ENG: 30,  ANG: 30,
    SOC: 270, SAN: 270, HIS: 260,
    ART: 0,   TAT: 0,
    HEA: 120, PHE: 120,
  }
  return map[prefix] ?? code.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0)
}

function courseLabel(name: string, code: string): string {
  const thai = name.replace(/[a-zA-Z0-9\s·\-–—]/g, '')
  if (thai.length >= 2) return thai.substring(0, 2)
  return code.substring(0, 2).toUpperCase()
}

// ── Icons ─────────────────────────────────────────────────────

function IconClock({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
}
function IconCheck({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m5 12 5 5L20 7" /></svg>
}
function IconArrow({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
}
function IconFile({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
}
function IconLink({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
}
function IconPlay({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="m8 5 13 7-13 7V5z" /></svg>
}

// ── Sub-components ─────────────────────────────────────────────

function CourseGlyph({ hue, label }: { hue: number; label: string }) {
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-semibold text-[24px] flex-shrink-0 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 90% 92%), hsl(${hue} 85% 85%))`,
        color: `hsl(${hue} 50% 30%)`,
      }}
    >
      <span className="relative z-10">{label}</span>
      <span className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full opacity-35"
        style={{ background: `hsl(${hue} 95% 75%)` }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default async function StudentCourseView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id: courseId } = await params
  const { tab = 'content' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, grade').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/teacher')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*, courses(id, code, name, description, profiles(full_name))')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .single()
  if (!enrollment) notFound()

  const course = enrollment.courses!

  const [assignmentsRes, mySubsRes, topicsRes, quizzesRes, attemptsRes] = await Promise.all([
    supabase.from('assignments').select('*').eq('course_id', courseId).order('due_date', { ascending: true }),
    supabase.from('submissions').select('*').eq('student_id', user.id),
    supabase.from('topics').select('*, content_items(*)').eq('course_id', courseId).order('topic_order', { ascending: true }),
    supabase.from('quizzes').select('id, title, description, status, quiz_questions(count)').eq('course_id', courseId).eq('status', 'open').order('created_at', { ascending: false }),
    supabase.from('quiz_attempts').select('quiz_id, score, total_possible').eq('student_id', user.id),
  ])

  const assignments = assignmentsRes.data ?? []
  const mySubmissions = mySubsRes.data ?? []
  const topics = topicsRes.data ?? []
  const quizzes = quizzesRes.data ?? []
  const attemptsMap: Record<string, { score: number; totalPossible: number }> = {}
  for (const a of (attemptsRes.data ?? [])) {
    attemptsMap[a.quiz_id] = { score: a.score, totalPossible: a.total_possible }
  }

  const subMap: Record<string, typeof mySubmissions[0]> = {}
  for (const s of mySubmissions) {
    subMap[s.assignment_id] = s
  }

  const submittedCount = assignments.filter(a => subMap[a.id]).length
  const totalAssignments = assignments.length
  const progress = totalAssignments > 0 ? Math.round(submittedCount / totalAssignments * 100) : 0

  const gradedSubs = mySubmissions.filter(s => s.status === 'graded' && s.grade !== null)
  const avgScore = gradedSubs.length > 0
    ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubs.length)
    : null

  const hue = courseHue(course.code ?? '')
  const label = courseLabel(course.name ?? '', course.code ?? '')
  const teacherName = (course.profiles as { full_name: string } | null)?.full_name ?? null

  // First pending assignment (for content tab right column)
  const firstPending = assignments.find(a => !subMap[a.id])

  const tabLinks = [
    { id: 'content', label: 'เนื้อหา' },
    { id: 'assignments', label: `งาน · ${totalAssignments}` },
    { id: 'quizzes', label: `แบบทดสอบ · ${quizzes.length}` },
    { id: 'grades', label: 'คะแนน' },
  ]

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="sticky top-0 z-10 border-b border-seam px-8 py-4"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 text-[12px] text-ink-muted mb-1">
          <Link href="/student/courses" className="hover:text-primary transition-colors">รายวิชา</Link>
          <span>/</span>
          <span className="font-mono text-primary">{course.code}</span>
        </div>
        <h1 className="font-display font-semibold text-[22px] text-ink leading-tight">{course.name}</h1>
      </div>

      <div className="p-8">
        {/* Course header card */}
        <div className="rounded-2xl bg-white border border-seam p-6 mb-6 relative overflow-hidden"
          style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full"
            style={{ background: `hsl(${hue} 85% 90%)`, filter: 'blur(8px)', opacity: 0.6 }} />
          <div className="relative flex items-start gap-5">
            <CourseGlyph hue={hue} label={label} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded"
                  style={{ background: '#EAF2FE', color: '#1D4ED8' }}>
                  {course.code}
                </span>
                {profile?.grade && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#FEF3C7', color: '#D97706' }}>
                    {profile.grade}
                  </span>
                )}
              </div>
              <p className="font-display font-semibold text-[22px] text-ink mb-0.5">{course.name}</p>
              {teacherName && (
                <p className="text-[13px] text-ink-muted">สอนโดย ครู{teacherName}</p>
              )}
              <div className="flex items-center gap-6 mt-4 flex-wrap">
                {avgScore !== null && (
                  <>
                    <div>
                      <p className="text-[11px] tracking-widest uppercase text-ink-subtle">คะแนนเฉลี่ย</p>
                      <p className="font-display font-semibold text-[22px] text-ink tabular-nums">
                        {avgScore}<span className="text-[14px] text-ink-muted">/100</span>
                        <span className="ml-2 text-[18px]" style={{ color: avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#2563EB' : '#D97706' }}>
                          {gradeToLetter(avgScore)}
                        </span>
                      </p>
                    </div>
                    <div className="w-px h-10 bg-seam" />
                  </>
                )}
                <div className="flex-1 min-w-[160px]">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="tracking-widest uppercase text-ink-subtle">ความก้าวหน้า</span>
                    <span className="font-medium tabular-nums text-ink">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E1E8F3' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: `hsl(${hue} 70% 55%)` }} />
                  </div>
                  <p className="text-[11px] mt-1 text-ink-muted">ส่งงานแล้ว {submittedCount} / {totalAssignments} ชิ้น</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 p-1 rounded-2xl w-fit mb-6"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #E1E8F3' }}>
          {tabLinks.map(t => (
            <Link
              key={t.id}
              href={`/student/courses/${courseId}?tab=${t.id}`}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={tab === t.id
                ? { background: '#2563EB', color: '#fff' }
                : { color: '#5C6B8A' }
              }
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* ── Tab: เนื้อหา ── */}
        {tab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Topics list */}
            <div className="lg:col-span-2 rounded-2xl bg-white border border-seam overflow-hidden"
              style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-seam">
                <h3 className="font-display font-semibold text-[15px] text-ink">หัวข้อการเรียน</h3>
                <span className="text-[12px] text-ink-muted">{topics.length} หัวข้อ</span>
              </div>
              {topics.length === 0 ? (
                <p className="px-6 py-10 text-center text-[13px] text-ink-muted">ยังไม่มีเนื้อหา</p>
              ) : (
                <ul>
                  {topics.map((topic, ti) => {
                    const items = ((topic.content_items ?? []) as Array<{
                      id: string; title: string; description: string | null
                      type: string; url: string | null; file_path: string | null; item_order: number
                    }>).sort((a, b) => a.item_order - b.item_order)

                    return (
                      <li key={topic.id} className="border-t border-seam first:border-t-0">
                        {/* Topic row */}
                        <div className="px-6 py-4 flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-semibold text-[14px] flex-shrink-0"
                            style={{ background: `hsl(${hue} 90% 92%)`, color: `hsl(${hue} 50% 30%)` }}>
                            {ti + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-ink">{topic.title}</p>
                            <p className="text-[12px] text-ink-muted mt-0.5">{items.length} รายการ</p>
                          </div>
                        </div>
                        {/* Content items */}
                        {items.length > 0 && (
                          <div className="px-6 pb-4 space-y-2 ml-13">
                            {items.map(item => {
                              const ytId = item.type === 'youtube' && item.url ? extractYoutubeId(item.url) : null
                              const typeColor = item.type === 'youtube'
                                ? { bg: '#FEE2E2', fg: '#EF4444' }
                                : item.type === 'file'
                                ? { bg: '#D1FAE5', fg: '#10B981' }
                                : { bg: '#EAF2FE', fg: '#2563EB' }
                              const TypeIcon = item.type === 'youtube' ? IconPlay : item.type === 'file' ? IconFile : IconLink

                              return (
                                <div key={item.id} className="ml-13">
                                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-soft">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ background: typeColor.bg, color: typeColor.fg }}>
                                      <TypeIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium text-ink truncate">{item.title}</p>
                                      {item.description && (
                                        <p className="text-[11px] text-ink-muted mt-0.5 truncate">{item.description}</p>
                                      )}
                                    </div>
                                    {item.type !== 'youtube' && (item.file_path || item.url) && (() => {
                                      const href = item.file_path ?? item.url ?? '#'
                                      const isHtml = item.file_path?.toLowerCase().endsWith('.html')
                                      const label = item.type === 'file' ? (isHtml ? 'เปิด' : 'ดาวน์โหลด') : 'เปิด'
                                      return (
                                        <a href={href} target="_blank" rel="noopener noreferrer"
                                          className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                                          style={{ background: typeColor.bg, color: typeColor.fg }}>
                                          {label}
                                        </a>
                                      )
                                    })()}
                                  </div>
                                  {ytId && (
                                    <div className="mt-2 aspect-video w-full rounded-xl overflow-hidden">
                                      <iframe
                                        src={`https://www.youtube.com/embed/${ytId}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen className="w-full h-full border-0"
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Right: urgent assignment */}
            <div className="space-y-4">
              {firstPending ? (
                <div className="rounded-2xl border border-seam p-5 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 80%)',
                    boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full mb-3"
                    style={{ background: '#F59E0B', color: '#fff' }}>
                    <IconClock className="w-3 h-3" /> งานค้างส่ง
                  </span>
                  <p className="font-display font-semibold text-[16px] text-ink leading-tight mb-1">{firstPending.title}</p>
                  {firstPending.due_date && (
                    <p className="text-[12px] text-ink-muted mb-4">
                      กำหนดส่ง: {formatDate(firstPending.due_date)}
                      {' · '}
                      <span className="font-medium text-accent-dark">{daysRemaining(firstPending.due_date)}</span>
                    </p>
                  )}
                  <Link href={`/student/submit/${firstPending.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press"
                    style={{ background: '#F59E0B', boxShadow: '0 8px 18px -8px #F59E0B' }}>
                    ส่งงาน
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-seam p-5 text-center"
                  style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: '#D1FAE5', color: '#10B981' }}>
                    <IconCheck className="w-5 h-5" />
                  </div>
                  <p className="text-[13px] font-medium text-ink">ส่งงานครบแล้ว!</p>
                  <p className="text-[12px] text-ink-muted mt-1">ไม่มีงานค้างส่ง</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: งาน ── */}
        {tab === 'assignments' && (
          <>
            {assignments.length === 0 ? (
              <div className="rounded-2xl bg-white border border-seam p-16 text-center"
                style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
                <p className="text-[14px] text-ink-muted">ยังไม่มีงาน</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map(a => {
                  const sub = subMap[a.id]
                  const status = !sub ? 'pending' : sub.status
                  const isOverdue = a.due_date && new Date(a.due_date) < new Date() && status === 'pending'
                  const statusStyle = status === 'graded'
                    ? { bg: '#D1FAE5', fg: '#10B981', label: 'ตรวจแล้ว' }
                    : status === 'submitted'
                    ? { bg: '#DBE7FF', fg: '#2563EB', label: 'รอตรวจ' }
                    : isOverdue
                    ? { bg: '#FEE2E2', fg: '#EF4444', label: 'เลยกำหนด' }
                    : { bg: '#F4F8FF', fg: '#5C6B8A', label: 'ยังไม่ส่ง' }

                  return (
                    <div key={a.id} className="rounded-2xl bg-white border border-seam p-5"
                      style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)',
                        borderColor: isOverdue ? '#FECACA' : undefined }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: '#EAF2FE', color: '#1D4ED8' }}>
                          {course.code}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.fg }}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="font-display font-semibold text-[15px] text-ink leading-snug mb-2">{a.title}</p>
                      {a.due_date && (
                        <div className="flex items-center gap-1.5 text-[12px] text-ink-muted mb-4">
                          <IconClock className="w-3.5 h-3.5 flex-shrink-0" />
                          {formatDate(a.due_date)}
                          {status === 'pending' && (
                            <span className="font-medium ml-1"
                              style={{ color: isOverdue ? '#EF4444' : '#D97706' }}>
                              · {daysRemaining(a.due_date)}
                            </span>
                          )}
                        </div>
                      )}
                      {sub?.status === 'graded' && sub.grade !== null && (
                        <div className="flex items-baseline gap-1.5 mb-3">
                          <span className="font-display font-semibold text-[28px] tabular-nums"
                            style={{ color: sub.grade >= 80 ? '#10B981' : sub.grade >= 60 ? '#2563EB' : '#D97706' }}>
                            {sub.grade}
                          </span>
                          <span className="text-[14px] text-ink-muted">/100</span>
                          <span className="ml-1 text-[16px] font-semibold"
                            style={{ color: sub.grade >= 80 ? '#10B981' : sub.grade >= 60 ? '#2563EB' : '#D97706' }}>
                            {gradeToLetter(sub.grade)}
                          </span>
                        </div>
                      )}
                      {status === 'pending' ? (
                        <Link href={`/student/submit/${a.id}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press"
                          style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}>
                          ส่งงาน <IconArrow className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link href={`/student/submit/${a.id}`}
                          className="w-full flex items-center justify-center gap-1 py-2.5 rounded-xl text-[13px] font-medium border border-seam hover:bg-surface-soft transition-colors text-primary">
                          ดูงาน <IconArrow className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {sub?.status === 'graded' && sub.feedback && (
                        <div className="mt-3 pt-3 border-t border-seam">
                          <p className="text-[11px] tracking-widest uppercase text-ink-subtle mb-1">ความเห็นจากครู</p>
                          <p className="text-[12px] text-ink leading-relaxed whitespace-pre-line line-clamp-3">
                            {sub.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Tab: แบบทดสอบ ── */}
        {tab === 'quizzes' && (
          <>
            {quizzes.length === 0 ? (
              <div className="rounded-2xl bg-white border border-seam p-16 text-center"
                style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
                <p className="text-[14px] text-ink-muted">ยังไม่มีแบบทดสอบ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map(q => {
                  const attempt = attemptsMap[q.id]
                  const qCount = (q.quiz_questions as unknown as { count: number }[])?.[0]?.count ?? 0
                  return (
                    <div key={q.id} className="rounded-2xl bg-white border border-seam flex items-center justify-between px-6 py-5"
                      style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
                      <div>
                        <p className="font-display font-semibold text-[15px] text-ink">{q.title}</p>
                        <p className="text-[12px] text-ink-muted mt-0.5">{qCount} ข้อ{q.description ? ` · ${q.description}` : ''}</p>
                      </div>
                      {attempt ? (
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-[11px] text-ink-muted mb-0.5">คะแนนที่ได้</p>
                          <p className="font-display font-semibold text-[20px] tabular-nums text-primary">
                            {attempt.score}<span className="text-[14px] text-ink-muted">/{attempt.totalPossible}</span>
                          </p>
                          <Link href={`/student/courses/${courseId}/quizzes/${q.id}/result`}
                            className="text-[12px] text-primary hover:underline">
                            ดูผล →
                          </Link>
                        </div>
                      ) : (
                        <Link href={`/student/courses/${courseId}/quizzes/${q.id}/take`}
                          className="ml-4 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press flex-shrink-0"
                          style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}>
                          เริ่มสอบ
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Tab: คะแนน ── */}
        {tab === 'grades' && (
          <div className="rounded-2xl bg-white border border-seam overflow-hidden"
            style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-seam">
              <h3 className="font-display font-semibold text-[15px] text-ink">ผลคะแนน</h3>
              {avgScore !== null && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] text-ink-muted">เฉลี่ย</span>
                  <span className="font-display font-semibold text-[20px] tabular-nums"
                    style={{ color: avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#2563EB' : '#D97706' }}>
                    {avgScore}
                  </span>
                  <span className="text-[12px] text-ink-muted">/100</span>
                </div>
              )}
            </div>
            {gradedSubs.length === 0 ? (
              <p className="px-6 py-14 text-center text-[13px] text-ink-muted">ยังไม่มีงานที่ตรวจแล้ว</p>
            ) : (
              <ul>
                {gradedSubs.map((s, i) => {
                  const assignment = assignments.find(a => a.id === s.assignment_id)
                  return (
                    <li key={s.id} className="px-6 py-4 flex items-center gap-4 border-t border-seam"
                      style={{ borderColor: i === 0 ? 'transparent' : undefined }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-ink truncate">{assignment?.title ?? '—'}</p>
                        {s.feedback && (
                          <p className="text-[12px] text-ink-muted mt-0.5 line-clamp-1">{s.feedback}</p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 flex-shrink-0">
                        <span className="font-display font-semibold text-[24px] tabular-nums"
                          style={{ color: (s.grade ?? 0) >= 80 ? '#10B981' : (s.grade ?? 0) >= 60 ? '#2563EB' : '#D97706' }}>
                          {s.grade}
                        </span>
                        <span className="text-[12px] text-ink-muted">/100</span>
                        <span className="ml-1 text-[16px] font-semibold"
                          style={{ color: (s.grade ?? 0) >= 80 ? '#10B981' : (s.grade ?? 0) >= 60 ? '#2563EB' : '#D97706' }}>
                          {gradeToLetter(s.grade ?? 0)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
