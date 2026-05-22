'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCourse } from '../actions'

export default function DeleteCourseButton({ courseId, name }: { courseId: string; name: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`ลบวิชา "${name}" ?\n(งาน การส่งงาน และข้อสอบทั้งหมดจะถูกลบด้วย)`)) return
    setLoading(true)
    const res = await deleteCourse(courseId)
    if (res?.error) { alert(res.error); setLoading(false); return }
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-xs text-ink-muted hover:text-crimson transition-colors disabled:opacity-50">
      {loading ? '...' : 'ลบ'}
    </button>
  )
}
