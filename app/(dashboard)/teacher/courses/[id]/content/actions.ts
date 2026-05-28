'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function addContentItem(data: {
  topic_id: string
  title: string
  description: string | null
  type: 'file' | 'youtube' | 'link'
  url: string | null
  file_path: string | null
  courseId: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') return { error: 'ไม่มีสิทธิ์' }

  const admin = createAdminClient()
  const { error } = await admin.from('content_items').insert({
    topic_id: data.topic_id,
    title: data.title,
    description: data.description,
    type: data.type,
    url: data.url,
    file_path: data.file_path,
    item_order: 0,
  })

  if (error) return { error: error.message }

  revalidatePath(`/teacher/courses/${data.courseId}`)
  return {}
}

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
