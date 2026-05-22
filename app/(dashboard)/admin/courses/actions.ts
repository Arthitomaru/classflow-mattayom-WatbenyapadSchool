'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteCourse(courseId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'ไม่มีสิทธิ์' }

  const admin = createAdminClient()

  const { data: assignments } = await admin.from('assignments').select('id').eq('course_id', courseId)
  if (assignments && assignments.length > 0) {
    const ids = assignments.map(a => a.id)
    await admin.from('submissions').delete().in('assignment_id', ids)
    await admin.from('assignments').delete().in('id', ids)
  }

  const { data: quizzes } = await admin.from('quizzes').select('id').eq('course_id', courseId)
  if (quizzes && quizzes.length > 0) {
    const qids = quizzes.map(q => q.id)
    const { data: questions } = await admin.from('quiz_questions').select('id').in('quiz_id', qids)
    if (questions && questions.length > 0) {
      const qnids = questions.map(q => q.id)
      await admin.from('quiz_choices').delete().in('question_id', qnids)
      await admin.from('quiz_questions').delete().in('quiz_id', qids)
    }
    const { data: attempts } = await admin.from('quiz_attempts').select('id').in('quiz_id', qids)
    if (attempts && attempts.length > 0) {
      await admin.from('quiz_answers').delete().in('attempt_id', attempts.map(a => a.id))
      await admin.from('quiz_attempts').delete().in('quiz_id', qids)
    }
    await admin.from('quizzes').delete().in('id', qids)
  }

  const { data: topics } = await admin.from('topics').select('id').eq('course_id', courseId)
  if (topics && topics.length > 0) {
    await admin.from('content_items').delete().in('topic_id', topics.map(t => t.id))
    await admin.from('topics').delete().eq('course_id', courseId)
  }

  await admin.from('enrollments').delete().eq('course_id', courseId)

  const { error } = await admin.from('courses').delete().eq('id', courseId)
  if (error) return { error: error.message }

  revalidatePath('/admin/courses')
  return {}
}
