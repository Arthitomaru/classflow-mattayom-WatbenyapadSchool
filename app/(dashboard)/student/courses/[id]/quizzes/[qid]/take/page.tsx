import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TakeQuizForm from './_components/TakeQuizForm'

export default async function TakeQuizPage({
  params,
}: { params: Promise<{ id: string; qid: string }> }) {
  const { id: courseId, qid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('course_id', courseId).eq('student_id', user.id).single()
  if (!enrollment) notFound()

  const { data: quiz } = await supabase
    .from('quizzes').select('*').eq('id', qid).eq('course_id', courseId).single()
  if (!quiz) notFound()
  if (quiz.status !== 'open') redirect(`/student/courses/${courseId}`)

  const { data: existing } = await supabase
    .from('quiz_attempts').select('id').eq('quiz_id', qid).eq('student_id', user.id).single()
  if (existing) redirect(`/student/courses/${courseId}/quizzes/${qid}/result`)

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, question_text, points, quiz_choices(id, choice_text, choice_order)')
    .eq('quiz_id', qid)
    .order('created_at', { ascending: true })

  if (!questions || questions.length === 0) {
    redirect(`/student/courses/${courseId}`)
  }

  const safeQuestions = questions.map(q => ({
    ...q,
    quiz_choices: (q.quiz_choices as { id: string; choice_text: string; choice_order: number }[])
      .sort((a, b) => a.choice_order - b.choice_order),
  }))

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">ข้อสอบ</p>
        <h1 className="font-display text-3xl text-ink">{quiz.title}</h1>
        {quiz.description && <p className="text-ink-muted text-sm mt-2">{quiz.description}</p>}
        <p className="text-xs text-ink-muted mt-3">{questions.length} ข้อ · ทำได้ 1 ครั้งเท่านั้น</p>
      </div>
      <TakeQuizForm quizId={qid} courseId={courseId} questions={safeQuestions} />
    </div>
  )
}
