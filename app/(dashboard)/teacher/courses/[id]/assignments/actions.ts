'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteAssignment(assignmentId: string, courseId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: assignment } = await supabase
      .from('assignments').select('teacher_id').eq('id', assignmentId).single()
    if (assignment?.teacher_id !== user.id) return { error: 'ไม่มีสิทธิ์' }
  }

  const admin = createAdminClient()
  const { error: subErr } = await admin.from('submissions').delete().eq('assignment_id', assignmentId)
  if (subErr) return { error: 'ลบงานนักเรียนไม่สำเร็จ: ' + subErr.message }

  const { error } = await admin.from('assignments').delete().eq('id', assignmentId)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/courses/${courseId}`)
  return {}
}
