import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [
    { count: totalUsers },
    { count: totalTeachers },
    { count: totalStudents },
    { count: totalCourses },
    { count: totalSubmissions },
    { count: totalAttempts },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'ผู้ใช้ทั้งหมด', value: totalUsers ?? 0, sub: `ครู ${totalTeachers ?? 0} · นักเรียน ${totalStudents ?? 0}` },
    { label: 'รายวิชา', value: totalCourses ?? 0 },
    { label: 'การส่งงาน', value: totalSubmissions ?? 0 },
    { label: 'การทำข้อสอบ', value: totalAttempts ?? 0 },
  ]

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="mb-8">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">Admin</p>
        <h1 className="font-display text-4xl text-ink">แดชบอร์ด</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="border border-seam p-5 bg-parchment-dark">
            <p className="text-3xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-ink-muted mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="border border-seam">
        <div className="flex items-center justify-between px-5 py-4 border-b border-seam bg-parchment-dark">
          <h2 className="font-display text-lg text-ink">การจัดการ</h2>
        </div>
        <div className="divide-y divide-seam">
          {[
            { href: '/admin/users', label: 'จัดการผู้ใช้', desc: 'สร้าง แก้ไข และลบบัญชีผู้ใช้' },
            { href: '/admin/courses', label: 'จัดการวิชา', desc: 'ดูและลบรายวิชาทั้งหมด' },
            { href: '/admin/submissions', label: 'งานที่ส่ง', desc: 'ตรวจสอบการส่งงานของนักเรียนทั้งหมด' },
            { href: '/admin/quizzes', label: 'ข้อสอบ', desc: 'ดูข้อสอบและผลการทำแบบทดสอบ' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center justify-between px-5 py-4 hover:bg-parchment-dark transition-colors group">
              <div>
                <p className="text-ink text-sm group-hover:text-rust transition-colors">{item.label}</p>
                <p className="text-ink-muted text-xs mt-0.5">{item.desc}</p>
              </div>
              <span className="text-rust text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
