'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function revalidate(courseId: string) {
  revalidatePath(`/teacher/courses/${courseId}`)
}

export async function createQuiz(courseId: string, data: {
  title: string; description: string | null; topic_id: string | null
}) {
  const supabase = await createClient()
  const { data: quiz, error } = await supabase
    .from('quizzes').insert({ course_id: courseId, ...data, status: 'draft' }).select().single()
  if (error || !quiz) return
  revalidate(courseId)
  redirect(`/teacher/courses/${courseId}/quizzes/${quiz.id}`)
}

export async function updateQuizStatus(quizId: string, courseId: string, status: string) {
  const supabase = await createClient()
  await supabase.from('quizzes').update({ status: status as 'draft' | 'open' | 'closed' }).eq('id', quizId)
  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
}

export async function deleteQuiz(quizId: string, courseId: string) {
  const supabase = await createClient()
  await supabase.from('quizzes').delete().eq('id', quizId)
  revalidate(courseId)
  redirect(`/teacher/courses/${courseId}`)
}

export async function addQuestion(quizId: string, courseId: string, data: {
  question_text: string; points: number
}) {
  const supabase = await createClient()
  await supabase.from('quiz_questions').insert({ quiz_id: quizId, ...data, question_order: 0 })
  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
}

export async function updateQuestion(questionId: string, quizId: string, courseId: string, data: {
  question_text: string; points: number
}) {
  const supabase = await createClient()
  await supabase.from('quiz_questions').update(data).eq('id', questionId)
  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
}

export async function deleteQuestion(questionId: string, quizId: string, courseId: string) {
  const supabase = await createClient()
  await supabase.from('quiz_questions').delete().eq('id', questionId)
  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
}

export async function addChoice(questionId: string, quizId: string, courseId: string, data: {
  choice_text: string; is_correct: boolean
}) {
  const supabase = await createClient()
  if (data.is_correct) {
    await supabase.from('quiz_choices').update({ is_correct: false }).eq('question_id', questionId)
  }
  await supabase.from('quiz_choices').insert({ question_id: questionId, ...data, choice_order: 0 })
  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
}

export async function setCorrectChoice(choiceId: string, questionId: string, quizId: string, courseId: string) {
  const supabase = await createClient()
  await supabase.from('quiz_choices').update({ is_correct: false }).eq('question_id', questionId)
  await supabase.from('quiz_choices').update({ is_correct: true }).eq('id', choiceId)
  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
}

export async function deleteChoice(choiceId: string, quizId: string, courseId: string) {
  const supabase = await createClient()
  await supabase.from('quiz_choices').delete().eq('id', choiceId)
  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
}

export async function importFromGoogleForms(
  formUrl: string,
  quizId: string,
  courseId: string
): Promise<{ error?: string; imported?: number }> {
  const formIdMatch = formUrl.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/)
  if (!formIdMatch) return { error: 'URL ไม่ถูกต้อง' }

  let html: string
  try {
    const res = await fetch(
      `https://docs.google.com/forms/d/${formIdMatch[1]}/viewform`,
      { headers: { 'Accept-Language': 'en-US' }, next: { revalidate: 0 } }
    )
    if (!res.ok) return { error: `เข้าถึง form ไม่ได้ (${res.status}) — ตรวจสอบว่า form เป็น public` }
    html = await res.text()
  } catch {
    return { error: 'fetch form ไม่สำเร็จ' }
  }

  const match = html.match(/FB_PUBLIC_LOAD_DATA_ = ([\s\S]*?);\s*<\/script>/)
  if (!match) return { error: 'parse form ไม่สำเร็จ — อาจต้องตั้งค่า form เป็น public' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any
  try { data = JSON.parse(match[1]) } catch { return { error: 'parse JSON ไม่สำเร็จ' } }

  const items: unknown[] = data?.[1]?.[1]
  if (!Array.isArray(items)) return { error: 'ไม่พบคำถามใน form' }

  const parsed: { title: string; choices: string[] }[] = []

  for (const item of items) {
    if (!Array.isArray(item)) continue
    const title = item[1]
    const qData = item[4]
    if (typeof title !== 'string' || !Array.isArray(qData)) continue

    try {
      // Multiple choice choices are nested at qData[0][0][1]
      const choicesRaw = qData?.[0]?.[0]?.[1]
      if (!Array.isArray(choicesRaw)) continue
      const choices = choicesRaw
        .map((c: unknown[]) => (typeof c[0] === 'string' ? c[0] : null))
        .filter(Boolean) as string[]
      if (choices.length >= 2) parsed.push({ title, choices })
    } catch { continue }
  }

  if (parsed.length === 0) return { error: 'ไม่พบคำถาม multiple choice ใน form' }

  const supabase = await createClient()
  let imported = 0

  for (const q of parsed) {
    const { data: question } = await supabase
      .from('quiz_questions')
      .insert({ quiz_id: quizId, question_text: q.title, points: 1, question_order: 0 })
      .select().single()

    if (question) {
      await supabase.from('quiz_choices').insert(
        q.choices.map((text, i) => ({
          question_id: question.id,
          choice_text: text,
          is_correct: false,
          choice_order: i,
        }))
      )
      imported++
    }
  }

  revalidatePath(`/teacher/courses/${courseId}/quizzes/${quizId}`)
  return { imported }
}
