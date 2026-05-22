import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function StudentQuizResultPage({
  params,
}: { params: Promise<{ id: string; qid: string }> }) {
  const { id: courseId, qid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quiz } = await supabase
    .from('quizzes').select('title, description').eq('id', qid).single()
  if (!quiz) notFound()

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('score, total_possible, submitted_at')
    .eq('quiz_id', qid).eq('student_id', user.id)
    .single()
  if (!attempt) redirect(`/student/courses/${courseId}`)

  const pct = attempt.total_possible > 0
    ? Math.round((attempt.score / attempt.total_possible) * 100)
    : 0

  return (
    <div className="p-6 md:p-10 max-w-lg">
      <div className="mb-8">
        <Link href={`/student/courses/${courseId}`} className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← กลับ
        </Link>
        <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">ผลการสอบ</p>
        <h1 className="font-display text-3xl text-ink">{quiz.title}</h1>
      </div>

      <div className="border border-seam p-10 text-center bg-parchment-dark mb-6">
        <p className="text-ink-muted text-sm mb-4">คะแนนของคุณ</p>
        <div className="flex items-end justify-center gap-2 mb-2">
          <span className="font-display text-7xl text-rust font-semibold leading-none">{attempt.score}</span>
          <span className="font-display text-3xl text-ink-muted mb-2">/ {attempt.total_possible}</span>
        </div>
        <p className="text-ink-muted text-2xl font-semibold">{pct}%</p>
      </div>

      <Link
        href={`/student/courses/${courseId}`}
        className="block w-full text-center bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors"
      >
        กลับสู่วิชา
      </Link>
    </div>
  )
}
