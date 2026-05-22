import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EnrollForm from '../_components/EnrollForm'
import CourseGrid, { type CourseWithProgress } from '../_components/CourseGrid'

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

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default async function StudentCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/teacher')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(id, code, name, description, profiles(full_name))')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const courses = (enrollments ?? []).map(e => e.courses).filter(Boolean)
  const courseIds = courses.map(c => c!.id)

  const assignmentsByCourse: Record<string, number> = {}
  const submittedByCourse: Record<string, number> = {}

  if (courseIds.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, course_id')
      .in('course_id', courseIds)

    const assignmentList = assignments ?? []
    for (const a of assignmentList) {
      if (!a.course_id) continue
      assignmentsByCourse[a.course_id] = (assignmentsByCourse[a.course_id] ?? 0) + 1
    }

    const assignmentIds = assignmentList.map(a => a.id)
    if (assignmentIds.length > 0) {
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('student_id', user.id)
        .in('assignment_id', assignmentIds)

      const assignmentToCourse: Record<string, string> = {}
      for (const a of assignmentList) {
        if (a.course_id) assignmentToCourse[a.id] = a.course_id
      }

      for (const s of (submissions ?? [])) {
        const courseId = assignmentToCourse[s.assignment_id]
        if (courseId) {
          submittedByCourse[courseId] = (submittedByCourse[courseId] ?? 0) + 1
        }
      }
    }
  }

  const coursesWithProgress: CourseWithProgress[] = courses.map(c => {
    const total = assignmentsByCourse[c!.id] ?? 0
    const submitted = submittedByCourse[c!.id] ?? 0
    const progress = total > 0 ? Math.round((submitted / total) * 100) : 0
    const code = c!.code ?? ''
    const name = c!.name ?? ''
    const hue = courseHue(code)
    return {
      id: c!.id,
      code,
      name,
      teacher: (c!.profiles as { full_name: string } | null)?.full_name ?? null,
      hue,
      label: courseLabel(name, code),
      progress,
      assignmentCount: total,
    }
  })

  return (
    <div className="min-h-screen">
      {/* Sticky topbar */}
      <div className="sticky top-0 z-10 border-b border-seam px-8 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}>
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary mb-0.5">รายวิชา · นักเรียน</p>
          <h1 className="font-display font-semibold text-[26px] text-ink">วิชาทั้งหมดของฉัน</h1>
        </div>
        <a
          href="#enroll-section"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press flex-shrink-0"
          style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
        >
          <IconPlus className="w-4 h-4" />
          ลงทะเบียนเพิ่ม
        </a>
      </div>

      {/* Main content */}
      <div className="p-8">
        {courses.length === 0 ? (
          <div className="rounded-2xl bg-white border border-seam p-16 text-center mb-8"
            style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
            <p className="text-[15px] text-ink-muted">ยังไม่ได้ลงทะเบียนวิชา</p>
            <p className="text-[13px] mt-1 text-ink-subtle">ขอรหัสวิชาจากคุณครูแล้วลงทะเบียนด้านล่าง</p>
          </div>
        ) : (
          <CourseGrid courses={coursesWithProgress} />
        )}

        <div id="enroll-section" className="mt-8">
          <EnrollForm studentId={user.id} />
        </div>
      </div>
    </div>
  )
}
