'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTopic } from '../actions'

export default function EditTopicTitle({
  topicId,
  courseId,
  initialTitle,
  index,
  itemCount,
}: {
  topicId: string
  courseId: string
  initialTitle: string
  index: number
  itemCount: number
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || title.trim() === initialTitle) { setEditing(false); return }
    setSaving(true)
    await updateTopic(topicId, courseId, title.trim())
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="flex items-center gap-2 flex-1">
        <span className="font-display italic text-rust text-sm flex-shrink-0">{index + 1}.</span>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="flex-1 bg-parchment border border-rust px-2 py-0.5 text-sm text-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="text-xs text-verdant hover:text-verdant/70 transition-colors disabled:opacity-50"
        >
          {saving ? '...' : 'บันทึก'}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setTitle(initialTitle) }}
          className="text-xs text-ink-muted hover:text-rust transition-colors"
        >
          ยกเลิก
        </button>
        <span className="text-xs text-ink-muted">{itemCount} รายการ</span>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-1">
      <span className="font-display italic text-rust text-sm">{index + 1}.</span>
      <h3 className="font-semibold text-ink text-sm">{title}</h3>
      <span className="text-xs text-ink-muted">{itemCount} รายการ</span>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-ink-muted hover:text-rust transition-colors"
      >
        แก้ไข
      </button>
    </div>
  )
}
