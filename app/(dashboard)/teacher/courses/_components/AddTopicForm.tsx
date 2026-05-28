'use client'

import { useState } from 'react'
import { addTopic } from '../actions'

export default function AddTopicForm({ courseId }: { courseId: string }) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await addTopic(courseId, title.trim())
    setTitle('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="ชื่อหัวข้อใหม่"
        required
        className="flex-1 bg-parchment border border-seam px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-ink text-parchment px-4 py-2 text-sm hover:bg-rust transition-colors disabled:opacity-50"
      >
        {loading ? '...' : '+ สร้าง'}
      </button>
    </form>
  )
}
