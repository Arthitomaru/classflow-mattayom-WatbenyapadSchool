'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddTopicForm({ courseId }: { courseId: string }) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('topics').insert({ course_id: courseId, title, topic_order: 0 })
    setTitle('')
    setLoading(false)
    router.refresh()
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
