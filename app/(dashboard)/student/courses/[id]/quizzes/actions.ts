'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitQuizAttempt(
  quizId: string,
  courseId: string,
  answers: Record<string, string>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, points, quiz_choices(id, is_correct)')
    .eq('quiz_id', quizId)

  let score = 0
  let totalPossible = 0

  for (const q of questions ?? []) {
    totalPossible += q.points
    const chosenId = answers[q.id]
    if (chosenId) {
      const chosen = (q.quiz_choices as { id: string; is_correct: boolean }[]).find(c => c.id === chosenId)
      if (chosen?.is_correct) score += q.points
    }
  }

  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .insert({ quiz_id: quizId, student_id: user.id, score, total_possible: totalPossible })
    .select().single()

  if (error || !attempt) {
    redirect(`/student/courses/${courseId}/quizzes/${quizId}/result`)
  }

  const answerRows = Object.entries(answers)
    .filter(([, choiceId]) => choiceId)
    .map(([questionId, choiceId]) => ({
      attempt_id: attempt.id,
      question_id: questionId,
      chosen_choice_id: choiceId,
    }))

  if (answerRows.length > 0) {
    await supabase.from('quiz_answers').insert(answerRows)
  }

  redirect(`/student/courses/${courseId}/quizzes/${quizId}/result`)
}
