import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EnrollForm from './_components/EnrollForm'
import { daysRemaining, gradeToLetter } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────

function courseHue(code: string): number {
  const prefix = code.replace(/\d/g, '').substring(0, 3).toUpperCase()
  const map: Record<string, number> = {
    SCI: 200, WAT: 200, PHY: 210, CHE: 190, BIO: 180,
    MAT: 340, KHN: 340,
    THA: 150, PHA: 150,
    ENG: 30, ANG: 30,
    SOC: 270, SAN: 270, HIS: 260,
    ART: 0, TAT: 0,
    HEA: 120, PHE: 120,
  }
  return map[prefix] ?? code.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0)
}

function courseLabel(name: string, code: string): string {
  const thai = name.replace(/[a-zA-Z0-9\s·\-–—]/g, '')
  if (thai.length >= 2) return thai.substring(0, 2)
  return code.substring(0, 2).toUpperCase()
}

function urgency(dueDate: string | null): 'high' | 'med' | 'low' {
  if (!dueDate) return 'low'
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
  return diff <= 1 ? 'high' : diff <= 3 ? 'med' : 'low'
}

function dueDiffDays(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
}

// ── Icons ─────────────────────────────────────────────────────

function IconBook({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
}
function IconClock({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
}
function IconCheck({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m5 12 5 5L20 7" /></svg>
}
function IconStar({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><path d="m12 3 2.7 5.8 6.3.7-4.7 4.4 1.3 6.4L12 17l-5.6 3.3 1.3-6.4L3 9.5l6.3-.7z" /></svg>
}
function IconArrow({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
}
function IconSpark({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" /></svg>
}
function IconSearch({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
}
function IconBell({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>
}

// ── CourseGlyph ───────────────────────────────────────────────

function CourseGlyph({ hue, label }: { hue: number; label: string }) {
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-semibold text-[18px] flex-shrink-0 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 90% 92%), hsl(${hue} 85% 85%))`,
        color: `hsl(${hue} 50% 30%)`,
      }}
    >
      <span className="relative z-10">{label}</span>
      <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full opacity-35"
        style={{ background: `hsl(${hue} 95% 75%)` }} />
    </div>
  )
}

// ── StatTile ──────────────────────────────────────────────────

function StatTile({
  label, value, icon: Icon, accent = 'primary', delta, hint,
}: {
  label: string
  value: string | number
  icon: React.FC<{ className?: string }>
  accent?: 'primary' | 'danger' | 'success' | 'accent'
  delta?: string
  hint?: string
}) {
  const colors = {
    primary: { bg: '#DBE7FF', fg: '#1D4ED8' },
    danger:  { bg: '#FEE2E2', fg: '#EF4444' },
    success: { bg: '#D1FAE5', fg: '#10B981' },
    accent:  { bg: '#FEF3C7', fg: '#D97706' },
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

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role !== 'student') redirect('/teacher')

  // Enrollments + courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(id, code, name, profiles(full_name))')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const courses = (enrollments ?? []).map(e => e.courses).filter(Boolean)
  const courseIds = courses.map(c => c!.id)

  // Course code lookup (enrollments already fetched)
  const courseCodeMap: Record<string, string> = {}
  for (const c of courses) {
    if (c) courseCodeMap[c.id] = c.code ?? ''
  }

  // My submissions (include grade info for avg + activity)
  const { data: allSubs } = await supabase
    .from('submissions')
    .select('id, assignment_id, grade, status, graded_at, assignments(title, profiles(full_name))')
    .eq('student_id', user.id)
    .order('graded_at', { ascending: false })

  const submittedSet = new Set((allSubs ?? []).map(s => s.assignment_id))
  const gradedSubs = (allSubs ?? []).filter(s => s.status === 'graded' && s.grade !== null)
  const avgGrade = gradedSubs.length > 0
    ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubs.length)
    : null

  // Pending + upcoming assignments
  let pendingCount = 0
  let weekPending = 0
  let upcoming: Array<{ id: string; title: string; due_date: string | null; course_id: string | null }> = []

  if (courseIds.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, due_date, course_id')
      .in('course_id', courseIds)
      .order('due_date', { ascending: true })

    const unsubmitted = (assignments ?? []).filter(a => !submittedSet.has(a.id))
    pendingCount = unsubmitted.length
    weekPending = unsubmitted.filter(a => a.due_date !== null && dueDiffDays(a.due_date) >= 0 && dueDiffDays(a.due_date) <= 7).length
    upcoming = unsubmitted.slice(0, 4)
  }

  const recentActivity = gradedSubs.slice(0, 3)
  const firstName = profile.full_name.split(' ')[0]
  const mostUrgent = upcoming[0]
  const todayStr = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Topbar ── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-4 px-8 py-5 border-b border-seam"
        style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[11px] tracking-[0.28em] uppercase text-primary mb-1">หน้าหลัก · นักเรียน</p>
          <h1 className="font-display font-semibold text-[26px] leading-tight text-ink">
            สวัสดี, {firstName}
          </h1>
        </div>
        <div className="relative hidden sm:block">
          <input
            placeholder="ค้นหา..."
            readOnly
            className="pl-9 pr-3 py-2 rounded-xl text-[13px] w-[220px] bg-white border border-seam text-ink outline-none"
          />
          <IconSearch className="w-4 h-4 absolute left-3 top-2.5 text-ink-subtle" />
        </div>
        <button className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-seam text-ink-muted hover:bg-surface-soft transition-colors">
          <IconBell className="w-[18px] h-[18px]" />
          {pendingCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger" />
          )}
        </button>
        <Link
          href="/student/assignments"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all press"
          style={{ background: '#F59E0B', color: '#1B1100', boxShadow: '0 8px 18px -8px #F59E0B' }}
        >
          <IconSpark className="w-4 h-4" />
          <span className="hidden sm:inline">เข้าวิชาล่าสุด</span>
        </Link>
      </div>

      {/* ── Content ── */}
      <div className="p-8 flex-1">

        {/* ── Hero banner ── */}
        <div
          className="relative rounded-3xl p-7 mb-7 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 70%)', color: '#fff' }}
        >
          <div className="dot-burst absolute inset-0 opacity-20 pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: '#F59E0B', opacity: 0.2, filter: 'blur(24px)' }} />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] tracking-[0.25em] uppercase opacity-80">ภารกิจวันนี้</span>
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span className="text-[12px] opacity-80">{todayStr}</span>
            </div>
            <h2 className="font-display font-semibold text-[28px] mb-1 leading-tight">
              มี{' '}
              <span style={{ color: '#FBBF24' }}>{weekPending} งาน</span>
              {' '}ต้องส่งสัปดาห์นี้
            </h2>
            <p className="opacity-85 text-[14px]">
              {mostUrgent
                ? `งานเร่งด่วน: ${mostUrgent.title} · ${daysRemaining(mostUrgent.due_date)}`
                : pendingCount === 0 ? 'ไม่มีงานค้างส่ง ยอดเยี่ยม!' : 'ยังไม่มีงานครบกำหนดในสัปดาห์นี้'}
            </p>
            <div className="flex gap-2 mt-5">
              <Link
                href="/student/assignments"
                className="rounded-xl px-4 py-2 text-[13px] font-semibold transition-all press"
                style={{ background: '#FBBF24', color: '#1B1100' }}
              >
                ดูทั้งหมด
              </Link>
              <button
                className="rounded-xl px-4 py-2 text-[13px] font-medium transition-all"
                style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)' }}
              >
                เลื่อนแจ้งเตือน
              </button>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-1.jpg"
            alt=""
            className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 rounded-3xl object-cover"
            style={{ width: 176, height: 176, boxShadow: '0 24px 50px -16px rgba(0,0,0,.4)', border: '4px solid rgba(255,255,255,.25)' }}
          />
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatTile label="วิชาที่ลงทะเบียน" value={courses.length} icon={IconBook} accent="primary" delta="ภาคนี้" />
          <StatTile
            label="งานค้างส่ง"
            value={pendingCount}
            icon={IconClock}
            accent="danger"
            hint={pendingCount > 0 ? `${weekPending} งาน ส่งสัปดาห์นี้` : undefined}
          />
          <StatTile label="งานส่งแล้ว" value={(allSubs ?? []).length} icon={IconCheck} accent="success" />
          <StatTile
            label="คะแนนเฉลี่ย"
            value={avgGrade ?? '—'}
            icon={IconStar}
            accent="accent"
            delta={avgGrade ? gradeToLetter(avgGrade) : undefined}
            hint={gradedSubs.length > 0 ? `จาก ${gradedSubs.length} งาน` : undefined}
          />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left col: courses + enroll ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Course list */}
            <div className="rounded-2xl bg-white border border-seam overflow-hidden"
              style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-seam">
                <h3 className="font-display font-semibold text-[16px] text-ink">รายวิชาของฉัน</h3>
                <Link href="/student/courses" className="text-[12px] font-medium flex items-center gap-1 text-primary hover:underline">
                  ดูทั้งหมด <IconArrow className="w-3 h-3" />
                </Link>
              </div>

              {courses.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-ink-muted mb-1">ยังไม่ได้ลงทะเบียนวิชา</p>
                  <p className="text-[13px] text-ink-subtle">ขอรหัสวิชาจากคุณครูแล้วลงทะเบียนด้านล่าง</p>
                </div>
              ) : (
                <ul>
                  {courses.slice(0, 4).map((c, i) => {
                    const hue = courseHue(c!.code)
                    const label = courseLabel(c!.name, c!.code)
                    return (
                      <li key={c!.id} className={i > 0 ? 'border-t border-seam' : ''}>
                        <Link
                          href={`/student/courses/${c!.id}`}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-surface-soft transition-colors group"
                        >
                          <CourseGlyph hue={hue} label={label} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-tint text-primary-dark">
                                {c!.code}
                              </span>
                              <span className="text-[14px] font-medium text-ink group-hover:text-primary transition-colors truncate">
                                {c!.name}
                              </span>
                            </div>
                            {c!.profiles?.full_name && (
                              <p className="text-[12px] text-ink-muted">ครู{c!.profiles.full_name}</p>
                            )}
                          </div>
                          <IconArrow className="w-4 h-4 text-ink-subtle flex-shrink-0" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Enroll form */}
            <EnrollForm studentId={user.id} />
          </div>

          {/* ── Right col: upcoming + activity ── */}
          <div className="space-y-5">

            {/* Upcoming assignments */}
            <div className="rounded-2xl bg-white border border-seam overflow-hidden"
              style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-seam">
                <h3 className="font-display font-semibold text-[15px] text-ink">งานที่ใกล้ครบกำหนด</h3>
                {pendingCount > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: '#FEE2E2', color: '#EF4444' }}>
                    {pendingCount} ค้าง
                  </span>
                )}
              </div>
              {upcoming.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-ink-subtle">ไม่มีงานค้างส่ง 🎉</p>
              ) : (
                <ul>
                  {upcoming.map((a, i) => {
                    const u = urgency(a.due_date)
                    const dotColor = u === 'high' ? '#EF4444' : u === 'med' ? '#F59E0B' : '#10B981'
                    return (
                      <li key={a.id} className={`px-5 py-3 ${i > 0 ? 'border-t border-seam' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-mono text-ink-subtle">{a.course_id ? courseCodeMap[a.course_id] : ''}</span>
                            </div>
                            <p className="text-[13px] font-medium text-ink truncate">{a.title}</p>
                            <p className="text-[11px] mt-0.5 font-medium" style={{ color: dotColor }}>
                              {daysRemaining(a.due_date)}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Activity feed */}
            {recentActivity.length > 0 && (
              <div className="rounded-2xl bg-white border border-seam overflow-hidden"
                style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
                <div className="px-5 py-4 border-b border-seam">
                  <h3 className="font-display font-semibold text-[15px] text-ink">ความเคลื่อนไหว</h3>
                </div>
                <ul className="px-5 py-3 space-y-3">
                  {recentActivity.map((s, i) => {
                    const grade = s.grade ?? 0
                    const color = grade >= 80 ? '#10B981' : grade >= 60 ? '#F59E0B' : '#EF4444'
                    type AssignmentRef = {
                      title: string
                      profiles: { full_name: string } | null
                    }
                    const asgn = s.assignments as AssignmentRef | null
                    return (
                      <li key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `color-mix(in oklab, ${color} 15%, white)`, color }}>
                          <IconStar className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-ink">
                            <span className="font-medium">
                              {asgn?.profiles?.full_name ? `ครู${asgn.profiles.full_name}` : 'คุณครู'}
                            </span>{' '}
                            ตรวจงานแล้ว
                          </p>
                          <p className="text-[12px] font-semibold mt-0.5" style={{ color }}>
                            {grade}/100{grade >= 80 ? ' · ดีมาก!' : grade >= 60 ? ' · ผ่าน' : ''}
                          </p>
                          <p className="text-[11px] mt-0.5 text-ink-subtle truncate">{asgn?.title}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
