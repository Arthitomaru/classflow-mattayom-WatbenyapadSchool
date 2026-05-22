import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContentForm from '../_components/ContentForm'

export default async function NewContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ topic_id?: string }>
}) {
  const { id } = await params
  const { topic_id } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/student')

  const isAdmin = profile?.role === 'admin'
  const { data: course } = await (isAdmin
    ? supabase.from('courses').select('id, name').eq('id', id).single()
    : supabase.from('courses').select('id, name').eq('id', id).eq('teacher_id', user.id).single()
  )
  if (!course) notFound()

  const { data: topics } = await supabase
    .from('topics').select('*').eq('course_id', id).order('created_at', { ascending: true })

  if (!topics || topics.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-lg">
        <Link href={`/teacher/courses/${id}`} className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← {course.name}
        </Link>
        <div className="mt-8 border border-seam p-8 text-center">
          <p className="text-ink-muted mb-4">ต้องสร้างหัวข้อก่อน ถึงจะเพิ่มเนื้อหาได้</p>
          <Link href={`/teacher/courses/${id}`} className="text-rust hover:text-rust-dark text-sm transition-colors">
            ← กลับไปสร้างหัวข้อ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-lg">
      <div className="mb-8">
        <Link href={`/teacher/courses/${id}`} className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← {course.name}
        </Link>
        <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">เนื้อหาบทเรียน</p>
        <h1 className="font-display text-4xl text-ink">เพิ่มเนื้อหา</h1>
      </div>
      <ContentForm courseId={id} topics={topics} defaultTopicId={topic_id} />
    </div>
  )
}
