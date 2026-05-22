import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewQuizForm from './_components/NewQuizForm'

export default async function NewQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    .from('topics').select('id, title').eq('course_id', id).order('created_at', { ascending: true })

  return (
    <div className="p-6 md:p-10 max-w-lg">
      <div className="mb-8">
        <Link href={`/teacher/courses/${id}`} className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← {course.name}
        </Link>
        <p className="text-rust text-xs tracking-[0.25em] uppercase mt-4 mb-1">ข้อสอบ</p>
        <h1 className="font-display text-4xl text-ink">สร้างข้อสอบใหม่</h1>
      </div>
      <NewQuizForm courseId={id} topics={topics ?? []} />
    </div>
  )
}
