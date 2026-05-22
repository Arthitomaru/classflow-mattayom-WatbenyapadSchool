import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

export default async function TeacherCourses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/student')

  const isAdmin = profile?.role === 'admin'
  const { data: courses } = await (isAdmin
    ? supabase.from('courses').select('*, enrollments(count)').order('created_at', { ascending: false })
    : supabase.from('courses').select('*, enrollments(count)').eq('teacher_id', user.id).order('created_at', { ascending: false })
  )

  const courseList = courses ?? []
  const totalStudents = courseList.reduce((sum, c) => {
    const count = (c.enrollments as unknown as { count: number }[])?.[0]?.count ?? 0
    return sum + count
  }, 0)

  return (
    <div className="min-h-screen">
      {/* Sticky topbar */}
      <div
        className="sticky top-0 z-10 border-b border-seam px-8 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary mb-0.5">
            {isAdmin ? 'ผู้ดูแลระบบ' : 'จัดการ'}
          </p>
          <h1 className="font-display font-semibold text-[26px] text-ink">วิชาของฉัน</h1>
        </div>
        <div className="flex items-center gap-3">
          {courseList.length > 0 && (
            <span
              className="text-[11px] font-medium px-3 py-1.5 rounded-full hidden sm:block"
              style={{ background: '#F4F8FF', color: '#5C6B8A', border: '1px solid #E1E8F3' }}
            >
              {courseList.length} วิชา · {totalStudents} คน
            </span>
          )}
          <Link
            href="/teacher/courses/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press flex-shrink-0"
            style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            สร้างวิชาใหม่
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {courseList.length === 0 ? (
          <div
            className="rounded-2xl bg-white border border-seam p-16 text-center"
            style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}
          >
            <div className="text-[48px] mb-4">📚</div>
            <p className="font-display font-semibold text-[18px] text-ink mb-2">ยังไม่มีวิชา</p>
            <p className="text-[13px] text-ink-muted mb-6">สร้างวิชาแรกเพื่อเริ่มต้น</p>
            <Link
              href="/teacher/courses/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold text-white transition-all press"
              style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
            >
              สร้างวิชาแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courseList.map(c => {
              const enrollCount = (c.enrollments as unknown as { count: number }[])?.[0]?.count ?? 0
              const hue = courseHue(c.code ?? '')
              const label = courseLabel(c.name ?? '', c.code ?? '')

              return (
                <Link
                  key={c.id}
                  href={`/teacher/courses/${c.id}`}
                  className="block rounded-2xl bg-white border border-seam overflow-hidden hover:-translate-y-1 transition-transform press"
                  style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}
                >
                  {/* Gradient header */}
                  <div
                    className="h-24 relative"
                    style={{ background: `linear-gradient(135deg, hsl(${hue} 90% 88%) 0%, hsl(${hue} 80% 70%) 100%)` }}
                  >
                    <div className="absolute inset-0 dot-burst opacity-30" />
                    {/* Glyph */}
                    <div
                      className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl flex items-center justify-center font-display font-semibold text-[22px]"
                      style={{
                        background: '#FFFFFF',
                        color: `hsl(${hue} 60% 35%)`,
                        boxShadow: '0 8px 18px -8px rgba(0,0,0,.15)',
                      }}
                    >
                      {label}
                    </div>
                    {/* Code badge */}
                    <span
                      className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,.85)', color: `hsl(${hue} 60% 25%)` }}
                    >
                      {c.code}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 pt-9">
                    <p className="font-display font-semibold text-[16px] mb-1 text-ink">{c.name}</p>
                    {c.description && (
                      <p className="text-[12px] text-ink-muted mb-4 line-clamp-2">{c.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {enrollCount} คน
                      </div>
                      <span className="text-[12px] font-medium flex items-center gap-1 text-primary">
                        เข้าชั้นเรียน
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
