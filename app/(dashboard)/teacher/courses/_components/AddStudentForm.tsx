'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddStudentForm({ courseId }: { courseId: string }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const supabase = createClient()

    const { data: student } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('full_name', username.trim())
      .eq('role', 'student')
      .single()

    if (!student) {
      setError('ไม่พบนักเรียนชื่อนี้ในระบบ')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.from('enrollments').insert({
      course_id: courseId,
      student_id: student.id,
    })

    if (err) {
      if (err.code === '23505') {
        setError('นักเรียนคนนี้ลงทะเบียนวิชานี้แล้ว')
      } else {
        setError(err.message)
      }
      setLoading(false)
      return
    }

    setSuccess(`เพิ่ม ${student.full_name} แล้ว`)
    setUsername('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleAdd} className="space-y-2">
      <p className="text-xs text-ink-muted tracking-wide uppercase mb-2">เพิ่มนักเรียน</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="ชื่อ-นามสกุลนักเรียน"
          className="flex-1 min-w-0 bg-parchment border border-seam px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-rust transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="bg-ink text-parchment px-3 py-2 text-sm hover:bg-rust transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          เพิ่ม
        </button>
      </div>
      {error && <p className="text-crimson text-xs">{error}</p>}
      {success && <p className="text-verdant text-xs">{success}</p>}
    </form>
  )
}
