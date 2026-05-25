'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyEnrolledStudents } from '@/lib/notifications'

// ── Mark individual notification as read ─────────────────────
export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Update only rows owned by this user (RLS guard)
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/notifications')
}

// ── Mark all notifications as read ───────────────────────────
export async function markAllRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client so we can bulk-update without relying on RLS UPDATE policy
  const admin = createAdminClient()
  await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/notifications')
}

// ── Notify helpers called from client components ──────────────

/** Called after teacher creates an assignment inside a course */
export async function notifyAssignmentCreated(
  courseId: string,
  assignmentTitle: string
) {
  await notifyEnrolledStudents(
    courseId,
    'assignment_created',
    `📝 งานใหม่: ${assignmentTitle}`,
    null,
    `/student/courses/${courseId}`
  )
}

/** Called after teacher adds a content item to a course */
export async function notifyContentAdded(
  courseId: string,
  contentTitle: string
) {
  await notifyEnrolledStudents(
    courseId,
    'content_added',
    `📚 เนื้อหาใหม่: ${contentTitle}`,
    null,
    `/student/courses/${courseId}`
  )
}
