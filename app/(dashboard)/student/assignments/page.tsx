import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

function letterGrade(s: number): string {
  return s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s >= 50 ? 'D' : 'F'
}

function dueDiffDays(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
}

export default async function StudentAssignments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, grade').eq('id', user.id).single()
  if (profile?.role !== 'student') redirect('/teacher')

  const { data: assignments } = profile?.grade
    ? await supabase
        .from('assignments')
        .select('*')
        .eq('grade', profile.grade)
        .order('due_date', { ascending: true })
    : { data: [] }

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', user.id)

  const submissionMap = new Map((mySubmissions ?? []).map(s => [s.assignment_id, s]))

  const assignmentList = assignments ?? []
  const pendingCount = assignmentList.filter(a => !submissionMap.get(a.id)).length
  const gradedCount = assignmentList.filter(a => submissionMap.get(a.id)?.status === 'graded').length

  return (
    <div className="min-h-screen">
      {/* Sticky topbar */}
      <div
        className="sticky top-0 z-10 border-b border-seam px-8 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-primary mb-0.5">งานของฉัน</p>
          <h1 className="font-display font-semibold text-[26px] text-ink">รายการงาน</h1>
        </div>
        {profile?.grade && (
          <div className="flex items-center gap-3">
            <span
              className="text-[11px] font-medium px-3 py-1.5 rounded-full"
              style={{ background: '#F4F8FF', color: '#5C6B8A', border: '1px solid #E1E8F3' }}
            >
              ชั้น {profile.grade}
            </span>
            {pendingCount > 0 && (
              <span
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}
              >
                รอส่ง {pendingCount} งาน
              </span>
            )}
            {gradedCount > 0 && (
              <span
                className="text-[11px] font-medium px-3 py-1.5 rounded-full"
                style={{ background: '#F0FDF4', color: '#10B981', border: '1px solid #6EE7B7' }}
              >
                ตรวจแล้ว {gradedCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-8">
        {!profile?.grade ? (
          <div
            className="rounded-2xl bg-white border border-seam p-12 text-center"
            style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}
          >
            <div className="text-[32px] mb-3">⚠️</div>
            <p className="font-display font-semibold text-[16px] text-ink mb-1">ยังไม่ได้ตั้งระดับชั้น</p>
            <p className="text-[13px] text-ink-muted">ติดต่อคุณครูเพื่อตั้งค่าระดับชั้น (ม.1 / ม.2 / ม.3 / ป.4 / ป.5)</p>
          </div>
        ) : assignmentList.length === 0 ? (
          <div
            className="rounded-2xl bg-white border border-seam p-16 text-center"
            style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}
          >
            <p className="text-[15px] text-ink-muted">ยังไม่มีงานสำหรับชั้น {profile.grade}</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {assignmentList.map(a => {
              const submission = submissionMap.get(a.id)
              const isGraded = submission?.status === 'graded'
              const isSubmitted = submission?.status === 'submitted'
              const isPending = !submission
              const isOverdue = isPending && a.due_date !== null && dueDiffDays(a.due_date) < 0
              const daysLeft = a.due_date ? dueDiffDays(a.due_date) : null

              let chipStyle: React.CSSProperties
              let chipLabel: string
              if (isGraded) {
                chipStyle = { background: '#F0FDF4', color: '#10B981', border: '1px solid #6EE7B7' }
                chipLabel = 'ตรวจแล้ว'
              } else if (isSubmitted) {
                chipStyle = { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }
                chipLabel = 'รอตรวจ'
              } else if (isOverdue) {
                chipStyle = { background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }
                chipLabel = 'เลยกำหนด'
              } else {
                chipStyle = { background: '#F4F8FF', color: '#5C6B8A', border: '1px solid #E1E8F3' }
                chipLabel = 'ยังไม่ส่ง'
              }

              return (
                <div
                  key={a.id}
                  className="rounded-2xl bg-white border overflow-hidden"
                  style={{
                    borderColor: isOverdue ? '#FCA5A5' : '#E1E8F3',
                    boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)',
                  }}
                >
                  <div className="p-5 flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {a.subject && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: '#F4F8FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
                          >
                            {a.subject}
                          </span>
                        )}
                        <span
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                          style={chipStyle}
                        >
                          {chipLabel}
                        </span>
                      </div>

                      <h2 className="font-display font-semibold text-[17px] text-ink mb-1 leading-snug">
                        {a.title}
                      </h2>

                      {a.description && (
                        <p className="text-[13px] text-ink-muted leading-relaxed mb-3 line-clamp-2">
                          {a.description}
                        </p>
                      )}

                      {a.due_date && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[12px] text-ink-muted">
                            กำหนดส่ง: <span className="text-ink font-medium">{formatDate(a.due_date)}</span>
                          </span>
                          {isPending && daysLeft !== null && (
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: isOverdue ? '#EF4444' : daysLeft <= 3 ? '#D97706' : '#10B981' }}
                            >
                              {isOverdue
                                ? `เลยกำหนด ${Math.abs(daysLeft)} วัน`
                                : daysLeft === 0
                                ? 'วันนี้!'
                                : `อีก ${daysLeft} วัน`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {isGraded && submission.grade !== null && (
                        <div className="text-right mb-1">
                          <span
                            className="font-display font-semibold text-[36px] leading-none tabular-nums"
                            style={{ color: '#2563EB' }}
                          >
                            {submission.grade}
                          </span>
                          <span
                            className="font-display font-semibold text-[18px] ml-1.5"
                            style={{ color: '#10B981' }}
                          >
                            {letterGrade(submission.grade)}
                          </span>
                        </div>
                      )}

                      {isPending ? (
                        <Link
                          href={`/student/submit/${a.id}`}
                          className="py-2 px-5 rounded-xl text-[13px] font-semibold text-white transition-all press"
                          style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
                        >
                          ส่งงาน →
                        </Link>
                      ) : (
                        <Link
                          href={`/student/submit/${a.id}`}
                          className="text-[12px] font-medium hover:underline transition-colors"
                          style={{ color: '#2563EB' }}
                        >
                          ดูงาน →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Teacher feedback */}
                  {isGraded && submission.feedback && (
                    <div
                      className="px-5 pb-5 pt-4 border-t"
                      style={{ borderColor: '#E1E8F3', background: '#F4F8FF' }}
                    >
                      <p className="text-[10px] tracking-[0.2em] uppercase text-ink-subtle mb-2">
                        ความเห็นจากคุณครู
                      </p>
                      <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
