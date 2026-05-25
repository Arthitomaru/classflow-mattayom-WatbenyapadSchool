import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types/database'

/**
 * Fan-out notification to all students enrolled in a course.
 * Uses admin client to bypass RLS.
 */
export async function notifyEnrolledStudents(
  courseId: string,
  type: NotificationType,
  title: string,
  body: string | null = null,
  link: string | null = null
) {
  try {
    const admin = createAdminClient()

    const { data: enrollments } = await admin
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId)

    if (!enrollments || enrollments.length === 0) return

    const rows = enrollments.map(e => ({
      user_id: e.student_id,
      type,
      title,
      body,
      link,
      is_read: false,
    }))

    await admin.from('notifications').insert(rows)
  } catch {
    // Notification failure must never break the main action
  }
}
