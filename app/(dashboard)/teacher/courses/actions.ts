'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertTeacherOrAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/')
  return user.id
}

export async function createCourse(data: {
  code: string
  name: string
  description: string | null
}): Promise<{ error?: string }> {
  const userId = await assertTeacherOrAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('courses').insert({
    code: data.code,
    name: data.name,
    description: data.description,
    teacher_id: userId,
  })
  if (error) return { error: error.message }
  revalidatePath('/teacher/courses')
  redirect('/teacher/courses')
}

export async function addTopic(courseId: string, title: string): Promise<{ error?: string }> {
  await assertTeacherOrAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('topics').insert({ course_id: courseId, title, topic_order: 0 })
  if (error) return { error: error.message }
  revalidatePath(`/teacher/courses/${courseId}`)
  return {}
}

export async function addEnrollment(
  courseId: string,
  studentName: string
): Promise<{ error?: string; fullName?: string }> {
  await assertTeacherOrAdmin()
  const admin = createAdminClient()
  const { data: student } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('full_name', studentName.trim())
    .eq('role', 'student')
    .single()
  if (!student) return { error: 'ไม่พบนักเรียนชื่อนี้ในระบบ' }
  const { error } = await admin.from('enrollments').insert({
    course_id: courseId,
    student_id: student.id,
  })
  if (error) {
    if (error.code === '23505') return { error: 'นักเรียนคนนี้ลงทะเบียนวิชานี้แล้ว' }
    return { error: error.message }
  }
  revalidatePath(`/teacher/courses/${courseId}`)
  return { fullName: student.full_name }
}
