'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Role, Grade } from '@/types/database'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')
}

export async function createUser(data: {
  email: string
  password: string
  full_name: string
  role: Role
  grade: Grade | null
  classroom: string | null
  phone: string | null
}): Promise<{ error?: string }> {
  await assertAdmin()
  const admin = createAdminClient()

  const { data: authData, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.full_name,
      role: data.role,
    },
  })
  if (error || !authData.user) return { error: error?.message ?? 'สร้าง user ไม่สำเร็จ' }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: authData.user.id,
    full_name: data.full_name,
    role: data.role,
    grade: data.grade,
    classroom: data.classroom,
    phone: data.phone,
  }, { onConflict: 'id' })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function updateUser(
  userId: string,
  data: {
    full_name: string
    role: Role
    grade: Grade | null
    classroom: string | null
    phone: string | null
    password?: string
  }
): Promise<{ error?: string }> {
  await assertAdmin()
  const admin = createAdminClient()

  const { password, ...profileData } = data
  const { error } = await admin.from('profiles').update(profileData).eq('id', userId)
  if (error) return { error: error.message }

  if (password) {
    const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password })
    if (pwErr) return { error: pwErr.message }
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return {}
}
