import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function TeacherAssignments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher') redirect('/student')

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, submissions(count)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">จัดการ</p>
          <h1 className="font-display text-4xl text-ink">งานที่มอบหมาย</h1>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="bg-ink text-parchment px-5 py-2.5 text-sm hover:bg-rust transition-colors"
        >
          + มอบหมายงานใหม่
        </Link>
      </div>

      <div className="border border-seam">
        <div className="grid grid-cols-12 px-6 py-3 bg-parchment-dark border-b border-seam">
          <p className="col-span-1 text-xs tracking-widest uppercase text-ink-muted">#</p>
          <p className="col-span-3 text-xs tracking-widest uppercase text-ink-muted">ชื่องาน</p>
          <p className="col-span-2 text-xs tracking-widest uppercase text-ink-muted">วิชา</p>
          <p className="col-span-2 text-xs tracking-widest uppercase text-ink-muted">ชั้น</p>
          <p className="col-span-2 text-xs tracking-widest uppercase text-ink-muted">วันส่ง</p>
          <p className="col-span-1 text-xs tracking-widest uppercase text-ink-muted">ส่ง</p>
          <p className="col-span-1 text-xs tracking-widest uppercase text-ink-muted"></p>
        </div>

        {!assignments || assignments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-ink-muted text-base mb-6">ยังไม่มีงานที่มอบหมาย</p>
            <Link href="/teacher/assignments/new"
              className="inline-block bg-ink text-parchment px-8 py-3 text-sm hover:bg-rust transition-colors">
              สร้างงานชิ้นแรก
            </Link>
          </div>
        ) : (
          assignments.map((a, i) => {
            const subCount = (a.submissions as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link
                key={a.id}
                href={`/teacher/assignments/${a.id}`}
                className={`grid grid-cols-12 px-6 py-4 items-center hover:bg-parchment-dark transition-colors group ${i < assignments.length - 1 ? 'border-b border-seam' : ''}`}
              >
                <span className="col-span-1 font-display italic text-rust text-xs">{i + 1}.</span>
                <span className="col-span-3 text-ink text-sm group-hover:text-rust transition-colors">{a.title}</span>
                <span className="col-span-2 text-ink-muted text-xs">{a.subject ?? '—'}</span>
                <span className="col-span-2">
                  <span className="text-xs px-2 py-0.5 border border-rust/30 text-rust bg-rust/5">
                    {a.grade ?? '—'}
                  </span>
                </span>
                <span className="col-span-2 text-ink-muted text-xs">{formatDate(a.due_date)}</span>
                <span className="col-span-1">
                  <span className={`text-xs px-1.5 py-0.5 border ${subCount > 0 ? 'text-ink border-seam' : 'text-ink-muted border-seam/50'}`}>
                    {subCount}
                  </span>
                </span>
                <span className="col-span-1 text-xs text-rust text-right">ดู →</span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
