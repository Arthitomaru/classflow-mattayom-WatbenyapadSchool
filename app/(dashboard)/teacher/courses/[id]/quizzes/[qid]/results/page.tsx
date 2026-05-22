import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function QuizResultsPage({
  params,
}: { params: Promise<{ id: string; qid: string }> }) {
  const { id, qid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/student')

  const isAdmin = profile?.role === 'admin'
  const { data: course } = await (isAdmin
    ? supabase.from('courses').select('id, name').eq('id', id).single()
    : supabase.from('courses').select('id, name').eq('id', id).eq('teacher_id', user.id).single()
  )
  if (!course) notFound()

  const { data: quiz } = await supabase
    .from('quizzes').select('*').eq('id', qid).single()
  if (!quiz) notFound()

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*, quiz_choices(*)')
    .eq('quiz_id', qid)
    .order('created_at', { ascending: true })

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*, profiles(full_name, classroom)')
    .eq('quiz_id', qid)
    .order('score', { ascending: false })

  const { data: allAnswers } = await supabase
    .from('quiz_answers')
    .select('*, quiz_choices(choice_text, is_correct), quiz_questions(question_text)')
    .in('attempt_id', (attempts ?? []).map(a => a.id))

  const answersByAttempt = new Map<string, typeof allAnswers>()
  for (const ans of allAnswers ?? []) {
    if (!answersByAttempt.has(ans.attempt_id)) answersByAttempt.set(ans.attempt_id, [])
    answersByAttempt.get(ans.attempt_id)!.push(ans)
  }

  const totalPoints = (questions ?? []).reduce((s, q) => s + q.points, 0)
  const avgScore = attempts && attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="mb-6">
        <Link href={`/teacher/courses/${id}/quizzes/${qid}`} className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← {quiz.title}
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">ผลสอบ</p>
        <h1 className="font-display text-3xl text-ink">{quiz.title}</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'ผู้เข้าสอบ', value: attempts?.length ?? 0 },
          { label: 'คะแนนเต็ม', value: totalPoints },
          { label: 'คะแนนเฉลี่ย', value: avgScore },
        ].map(s => (
          <div key={s.label} className="border border-seam p-4 bg-parchment-dark text-center">
            <p className="text-3xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {!attempts || attempts.length === 0 ? (
        <div className="border border-seam p-12 text-center">
          <p className="text-ink-muted">ยังไม่มีนักเรียนส่งคำตอบ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map(attempt => {
            const answers = answersByAttempt.get(attempt.id) ?? []
            return (
              <div key={attempt.id} className="border border-seam">
                <div className="flex items-center justify-between px-5 py-4 bg-parchment-dark border-b border-seam">
                  <div>
                    <p className="font-semibold text-ink text-sm">{attempt.profiles?.full_name ?? '—'}</p>
                    {attempt.profiles?.classroom && (
                      <p className="text-xs text-ink-muted">{attempt.profiles.classroom}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl text-rust font-semibold">{attempt.score}</span>
                    <span className="text-ink-muted text-sm"> / {attempt.total_possible}</span>
                  </div>
                </div>
                {/* Per-question breakdown */}
                <div className="divide-y divide-seam/50">
                  {(questions ?? []).map((q, qi) => {
                    const ans = answers.find(a => a.question_id === q.id)
                    const isCorrect = ans?.quiz_choices?.is_correct ?? false
                    return (
                      <div key={q.id} className="px-5 py-3 flex items-start gap-3">
                        <span className={`text-xs px-1.5 py-0.5 border flex-shrink-0 mt-0.5 ${isCorrect ? 'text-verdant border-verdant/30 bg-verdant/5' : 'text-crimson border-crimson/30 bg-crimson/5'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink-muted mb-0.5">ข้อ {qi + 1}: {q.question_text}</p>
                          <p className="text-sm text-ink">
                            ตอบ: {ans?.quiz_choices?.choice_text ?? '—'}
                          </p>
                          {!isCorrect && (
                            <p className="text-xs text-verdant mt-0.5">
                              เฉลย: {(q.quiz_choices ?? []).find((c: { is_correct: boolean; choice_text: string }) => c.is_correct)?.choice_text ?? '—'}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-ink-muted flex-shrink-0">{isCorrect ? q.points : 0}/{q.points}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
