import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { QuizQuestion, QuizChoice } from '@/types/database'
import QuizStatusControl from '../_components/QuizStatusControl'
import AddQuestionForm from '../_components/AddQuestionForm'
import QuestionItem from '../_components/QuestionItem'
import ImportGoogleFormButton from '../_components/ImportGoogleFormButton'

export default async function QuizDetailPage({
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
    .from('quizzes').select('*').eq('id', qid).eq('course_id', id).single()
  if (!quiz) notFound()

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*, quiz_choices(*)')
    .eq('quiz_id', qid)
    .order('created_at', { ascending: true })

  const { count: attemptCount } = await supabase
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', qid)

  const totalPoints = (questions ?? []).reduce((s, q) => s + q.points, 0)

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-6">
        <Link href={`/teacher/courses/${id}`} className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← {course.name}
        </Link>
      </div>

      {/* Quiz header */}
      <div className="border border-seam p-6 mb-6 bg-parchment-dark">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">ข้อสอบ</p>
            <h1 className="font-display text-3xl text-ink">{quiz.title}</h1>
            {quiz.description && <p className="text-ink-muted text-sm mt-2">{quiz.description}</p>}
          </div>
          <QuizStatusControl quizId={qid} courseId={id} status={quiz.status as 'draft' | 'open' | 'closed'} />
        </div>
        <div className="flex gap-6 pt-4 border-t border-seam">
          <div>
            <p className="text-xl font-semibold text-ink">{(questions ?? []).length}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted">คำถาม</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-ink">{totalPoints}</p>
            <p className="text-xs tracking-widest uppercase text-ink-muted">คะแนนรวม</p>
          </div>
          {(attemptCount ?? 0) > 0 && (
            <div>
              <p className="text-xl font-semibold text-rust">{attemptCount}</p>
              <p className="text-xs tracking-widest uppercase text-ink-muted">ผู้เข้าสอบ</p>
            </div>
          )}
          {(attemptCount ?? 0) > 0 && (
            <div className="ml-auto self-end">
              <Link href={`/teacher/courses/${id}/quizzes/${qid}/results`}
                className="text-sm text-rust hover:text-rust-dark transition-colors">
                ดูผลสอบ →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">คำถาม</h2>
          <ImportGoogleFormButton quizId={qid} courseId={id} />
        </div>
        {(questions ?? []).length === 0 ? (
          <p className="text-ink-muted text-sm mb-4">ยังไม่มีคำถาม</p>
        ) : (
          (questions ?? []).map((q, i) => (
            <QuestionItem
              key={q.id}
              question={q as QuizQuestion & { quiz_choices: QuizChoice[] }}
              quizId={qid}
              courseId={id}
              index={i + 1}
            />
          ))
        )}
        <AddQuestionForm quizId={qid} courseId={id} />
      </div>
    </div>
  )
}
