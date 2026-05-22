import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ── Helpers ───────────────────────────────────────────────────

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

function studentHue(id: string): number {
  return id.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0) % 360
}

function isThisMonth(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1) return 'เมื่อกี้'
  if (diff < 60) return `${diff} นาทีที่แล้ว`
  const hrs = Math.floor(diff / 60)
  if (hrs < 24) return `${hrs} ชม. ที่แล้ว`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'เมื่อวาน'
  return `${days} วันที่แล้ว`
}

// ── Icons ─────────────────────────────────────────────────────

function IconBook({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
}
function IconUsers({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function IconClock({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
}
function IconCheck({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m5 12 5 5L20 7" /></svg>
}
function IconPaper({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /></svg>
}
function IconUpload({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
}
function IconPlus({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
function IconArrow({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
}

// ── Sub-components ─────────────────────────────────────────────

function CourseGlyph({ hue, label }: { hue: number; label: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-semibold text-[15px] flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 90% 92%), hsl(${hue} 85% 85%))`,
        color: `hsl(${hue} 50% 30%)`,
      }}
    >
      {label}
    </div>
  )
}

function StatTile({
  label, value, icon: Icon, accent, delta, hint,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  accent: 'primary' | 'danger' | 'success' | 'info'
  delta?: string
  hint?: string
}) {
  const colors = {
    primary: { bg: '#DBE7FF', fg: '#1D4ED8' },
    danger:  { bg: '#FEE2E2', fg: '#EF4444' },
    success: { bg: '#D1FAE5', fg: '#10B981' },
    info:    { bg: '#E0E7FF', fg: '#4F46E5' },
  }
  const c = colors[accent]
  return (
    <div className="rounded-2xl p-5 bg-white border border-seam"
      style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.bg, color: c.fg }}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        {delta && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: c.bg, color: c.fg }}>
            {delta}
          </span>
        )}
      </div>
      <p className="font-display font-semibold text-[34px] leading-none text-ink">{value}</p>
      <p className="text-[12px] mt-2 text-ink-muted">{label}</p>
      {hint && <p className="text-[11px] mt-1.5 text-ink-subtle">{hint}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/student')

  const isAdmin = profile?.role === 'admin'

  // Courses with enrollment counts
  const coursesQuery = supabase
    .from('courses')
    .select('id, code, name, enrollments(count)')
    .order('created_at', { ascending: false })
  const { data: courses } = await (isAdmin ? coursesQuery : coursesQuery.eq('teacher_id', user.id))

  const courseList = courses ?? []
  const totalStudents = courseList.reduce((sum, c) => {
    return sum + ((c.enrollments as { count: number }[])?.[0]?.count ?? 0)
  }, 0)

  // Assignment counts per course (separate query since no FK in type definitions)
  const assignmentsQuery = supabase
    .from('assignments')
    .select('id, course_id')
  const { data: teacherAssignments } = await (
    isAdmin ? assignmentsQuery : assignmentsQuery.eq('teacher_id', user.id)
  )
  const assignCountByCourse: Record<string, number> = {}
  for (const a of (teacherAssignments ?? [])) {
    if (a.course_id) {
      assignCountByCourse[a.course_id] = (assignCountByCourse[a.course_id] ?? 0) + 1
    }
  }

  // All submissions for this teacher (stats + queue)
  const subsBase = supabase
    .from('submissions')
    .select('id, status, grade, submitted_at, student_id, text_content, file_url, assignment_id, graded_at, profiles(full_name, classroom), assignments!inner(id, title, course_id, teacher_id)')
    .order('submitted_at', { ascending: false })

  const { data: allSubs } = await (
    isAdmin ? subsBase : subsBase.eq('assignments.teacher_id', user.id)
  )

  const subList = allSubs ?? []
  const pendingCount = subList.filter(s => s.status === 'submitted').length
  const gradedThisMonth = subList.filter(s => s.status === 'graded' && isThisMonth(s.graded_at ?? null)).length
  const queueSubs = subList.slice(0, 8)

  // First pending assignment (for queue header subtitle)
  const firstPending = subList.find(s => s.status === 'submitted')
  const firstPendingAssignment = firstPending?.assignments as { id: string; title: string; course_id: string } | null | undefined

  const courseCodeMap: Record<string, string> = {}
  for (const c of courseList) {
    if (c.id) courseCodeMap[c.id] = c.code ?? ''
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'ครู'

  return (
    <div className="min-h-screen">
      {/* Sticky topbar */}
      <div className="sticky top-0 z-10 border-b border-seam px-8 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}>
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary mb-0.5">แดชบอร์ด · ครู</p>
          <h1 className="font-display font-semibold text-[26px] text-ink">สวัสดี, {firstName}</h1>
        </div>
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press flex-shrink-0"
          style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
        >
          <IconPlus className="w-4 h-4" />
          สร้างวิชาใหม่
        </Link>
      </div>

      <div className="p-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatTile
            label="วิชาที่สอน"
            value={courseList.length}
            icon={IconBook}
            accent="primary"
            delta="ภาคนี้"
          />
          <StatTile
            label="นักเรียนทั้งหมด"
            value={totalStudents}
            icon={IconUsers}
            accent="info"
          />
          <StatTile
            label="รอตรวจ"
            value={pendingCount}
            icon={IconClock}
            accent="danger"
            hint={pendingCount > 0 ? 'ยังไม่ได้ตรวจ' : 'ไม่มีงานค้าง'}
          />
          <StatTile
            label="ตรวจแล้ว · เดือนนี้"
            value={gradedThisMonth}
            icon={IconCheck}
            accent="success"
          />
        </div>

        {/* Main 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Queue card — left 2/3 */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-seam overflow-hidden"
            style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-seam">
              <div>
                <h3 className="font-display font-semibold text-[15px] text-ink">คิวงานที่ต้องตรวจ</h3>
                {firstPendingAssignment && (
                  <p className="text-[11px] mt-0.5 text-ink-muted">
                    {courseCodeMap[firstPendingAssignment.course_id] ?? ''}{' · '}{firstPendingAssignment.title}
                  </p>
                )}
              </div>
              {pendingCount > 0 && (
                <span className="text-[12px] font-medium px-3 py-1 rounded-full"
                  style={{ background: '#FEE2E2', color: '#EF4444' }}>
                  {pendingCount} รอตรวจ
                </span>
              )}
            </div>

            {queueSubs.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-[14px] text-ink-muted">ไม่มีงานรอตรวจ</p>
                <p className="text-[12px] mt-1 text-ink-subtle">เมื่อนักเรียนส่งงานจะปรากฏที่นี่</p>
              </div>
            ) : (
              <ul>
                {queueSubs.map((s, i) => {
                  const assignment = s.assignments as { id: string; title: string; course_id: string } | null
                  const studentProfile = s.profiles as { full_name: string; classroom: string | null } | null
                  const hue = studentHue(s.student_id ?? s.id)
                  const initial = studentProfile?.full_name?.charAt(0) ?? '?'
                  const courseCode = assignment?.course_id ? courseCodeMap[assignment.course_id] : ''
                  const gradeLink = assignment
                    ? `/teacher/courses/${assignment.course_id}/assignments/${assignment.id}`
                    : '/teacher'

                  return (
                    <li key={s.id}
                      className="px-6 py-4 flex items-center gap-4 border-t border-seam hover:bg-surface-soft transition-colors"
                      style={{ borderColor: i === 0 ? 'transparent' : undefined }}>
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-[15px] flex-shrink-0"
                        style={{
                          background: `hsl(${hue} 85% 92%)`,
                          color: `hsl(${hue} 60% 35%)`,
                        }}
                      >
                        {initial}
                      </div>

                      {/* Student + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[13px] font-medium text-ink truncate">
                            {studentProfile?.full_name ?? 'นักเรียน'}
                          </p>
                          {studentProfile?.classroom && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ background: '#DBE7FF', color: '#1D4ED8' }}>
                              {studentProfile.classroom}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-subtle">
                          {courseCode && <span className="font-mono mr-1">{courseCode}</span>}
                          {assignment?.title ?? '—'} · {timeAgo(s.submitted_at ?? null)}
                        </p>
                      </div>

                      {/* Type tags */}
                      {s.status === 'submitted' && (
                        <div className="flex items-center gap-1.5">
                          {s.text_content && (
                            <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded"
                              style={{ background: '#F4F8FF', color: '#5C6B8A' }}>
                              <IconPaper className="w-3 h-3" /> ข้อความ
                            </span>
                          )}
                          {s.file_url && (
                            <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded"
                              style={{ background: '#F4F8FF', color: '#5C6B8A' }}>
                              <IconUpload className="w-3 h-3" /> ไฟล์
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      {s.status === 'submitted' ? (
                        <Link
                          href={gradeLink}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all press flex-shrink-0"
                          style={{ background: '#2563EB', boxShadow: '0 4px 10px -4px #2563EB' }}
                        >
                          ตรวจ
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-display font-semibold text-[18px] tabular-nums"
                            style={{ color: (s.grade ?? 0) >= 85 ? '#10B981' : (s.grade ?? 0) >= 70 ? '#2563EB' : '#D97706' }}>
                            {s.grade ?? '—'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: '#D1FAE5', color: '#10B981' }}>
                            ตรวจแล้ว
                          </span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* "วิชาของฉัน" */}
            <div className="rounded-2xl bg-white border border-seam p-5"
              style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
              <h3 className="font-display font-semibold text-[15px] text-ink mb-4">วิชาของฉัน</h3>
              {courseList.length === 0 ? (
                <p className="text-[13px] text-ink-muted text-center py-4">ยังไม่มีวิชา</p>
              ) : (
                <ul className="space-y-3">
                  {courseList.slice(0, 3).map(c => {
                    const code = c.code ?? ''
                    const name = c.name ?? ''
                    const hue = courseHue(code)
                    const assignCount = assignCountByCourse[c.id] ?? 0
                    return (
                      <li key={c.id} className="flex items-center gap-3">
                        <CourseGlyph hue={hue} label={courseLabel(name, code)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-ink truncate">{name}</p>
                          <p className="text-[11px] text-ink-subtle">
                            {code} · {(c.enrollments as { count: number }[])?.[0]?.count ?? 0} คน
                          </p>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: '#FEF3C7', color: '#D97706' }}>
                          {assignCount} งาน
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
              {courseList.length > 0 && (
                <Link href="/teacher/courses"
                  className="w-full mt-4 text-[12px] font-medium flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-surface-soft transition-colors text-primary">
                  ดูทั้ง {courseList.length} วิชา <IconArrow className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* "สร้างงานใหม่" CTA */}
            <div className="rounded-2xl border border-seam p-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #DBE7FF 0%, #FFFFFF 80%)',
                boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)',
              }}>
              <div className="flex items-center gap-2 mb-2">
                <IconPaper className="w-4 h-4 text-primary" />
                <p className="text-[11px] font-semibold tracking-widest uppercase text-primary">สร้างงานใหม่</p>
              </div>
              <p className="font-display font-semibold text-[16px] leading-tight text-ink mb-2">
                ตั้งงาน · กำหนดวันส่ง · เลือกชั้น
              </p>
              <p className="text-[12px] text-ink-muted mb-4">
                แนบเอกสาร เพิ่มคำอธิบาย และส่งให้ทั้งห้องเห็นพร้อมกัน
              </p>
              <Link
                href="/teacher/courses"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press"
                style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
              >
                <IconPlus className="w-4 h-4" />
                เลือกวิชา
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
