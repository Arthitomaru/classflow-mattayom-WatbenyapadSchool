'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteContentItem(itemId: string, courseId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('content_items').delete().eq('id', itemId)
  if (error) return { error: error.message }
  revalidatePath(`/teacher/courses/${courseId}`)
  return {}
}

export async function updateContentItem(
  itemId: string,
  courseId: string,
  data: { title: string; description: string | null; url: string | null; file_path: string | null }
) {
  const admin = createAdminClient()
  await admin.from('content_items').update(data).eq('id', itemId)
  revalidatePath(`/teacher/courses/${courseId}`)
}
