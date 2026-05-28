'use client'

import { useState } from 'react'
import { addEnrollment } from '../actions'

export default function AddStudentForm({ courseId }: { courseId: string }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const result = await addEnrollment(courseId, username)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(`เพิ่ม ${result.fullName} แล้ว`)
      setUsername('')
    }
    setLoading(false)
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
