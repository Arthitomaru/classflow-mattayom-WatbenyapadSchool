'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAssignment } from '../actions'

export default function DeleteAssignmentButton({
  assignmentId,
  courseId,
  title,
}: {
  assignmentId: string
  courseId: string
  title: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`ลบงาน "${title}" ?\n(งานที่นักเรียนส่งทั้งหมดจะถูกลบด้วย)`)) return
    setLoading(true)
    const res = await deleteAssignment(assignmentId, courseId)
    if (res?.error) {
      alert(res.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-ink-muted hover:text-crimson transition-colors disabled:opacity-50 px-2 py-1"
    >
      {loading ? '...' : 'ลบ'}
    </button>
  )
}
