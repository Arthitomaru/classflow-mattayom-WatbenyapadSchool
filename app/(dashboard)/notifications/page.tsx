import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/database'
import NotificationList from './_components/NotificationList'

// ── Deadline helpers ──────────────────────────────────────────

type DeadlineItem = {
  id: string
  title: string
  due_date: string
  course_name: string
  link: string
  daysLeft: number
}

function daysUntil(dateStr: string) {
  const now = new Date()
  const due = new Date(dateStr)
  return Math.ceil((due.getTime() - now.getTime()) / 86400000)
}

function deadlineLabel(days: number) {
  if (days < 0) return 'เลยกำหนดแล้ว'
  if (days === 0) return 'วันนี้!'
  if (days === 1) return 'พรุ่งนี้'
  return `อีก ${days} วัน`
}

// ── Page ──────────────────────────────────────────────────────

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // ── Fetch stored notifications ────────────────────────────
  const { data: rawNotifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (rawNotifs ?? []) as Notification[]
  const hasUnread = notifications.some(n => !n.is_read)

  // ── Fetch upcoming deadlines (student only, ≤ 7 days) ────
  let deadlines: DeadlineItem[] = []

  if (profile?.role === 'student') {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString()

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, courses(id, name)')
      .eq('student_id', user.id)

    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map(e => e.course_id)

      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, due_date, course_id')
        .in('course_id', courseIds)
        .not('due_date', 'is', null)
        .lte('due_date', in7Days)
        .order('due_date', { ascending: true })

      if (assignments) {
        const courseMap = Object.fromEntries(
          (enrollments ?? []).map(e => [e.course_id, (e.courses as { id: string; name: string } | null)?.name ?? ''])
        )

        deadlines = assignments
          .filter(a => a.due_date)
          .map(a => ({
            id: a.id,
            title: a.title,
            due_date: a.due_date!,
            course_name: courseMap[a.course_id ?? ''] ?? '',
            link: `/student/courses/${a.course_id}`,
            daysLeft: daysUntil(a.due_date!),
          }))
          .filter(d => d.daysLeft >= -1) // include 1 day overdue
      }
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">ระบบ</p>
        <h1 className="font-display text-4xl text-ink">การแจ้งเตือน</h1>
      </div>

      {/* Upcoming deadlines (student only) */}
      {deadlines.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-3">
            ⏰ งาน/แบบทดสอบใกล้ถึงกำหนด
          </h2>
          <div className="border border-seam bg-parchment">
            {deadlines.map(d => {
              const urgent = d.daysLeft <= 1
              return (
                <a
                  key={d.id}
                  href={d.link}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-seam-light last:border-0 hover:bg-rust-subtle transition-colors"
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${urgent ? 'text-crimson' : 'text-ink'}`}>
                      {d.title}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">{d.course_name}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-4 ${
                      urgent
                        ? 'bg-crimson/10 text-crimson'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {deadlineLabel(d.daysLeft)}
                  </span>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* Stored notifications */}
      <section>
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-3">
          🔔 การแจ้งเตือนทั้งหมด
        </h2>
        <div className="border border-seam bg-parchment">
          <NotificationList notifications={notifications} hasUnread={hasUnread} />
        </div>
      </section>
    </div>
  )
}
