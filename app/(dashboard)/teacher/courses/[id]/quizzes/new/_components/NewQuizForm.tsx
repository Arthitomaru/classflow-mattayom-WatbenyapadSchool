'use client'

import { useState, useTransition } from 'react'
import { createQuiz } from '../../actions'

interface Topic { id: string; title: string }

export default function NewQuizForm({ courseId, topics }: { courseId: string; topics: Topic[] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topicId, setTopicId] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() =>
      createQuiz(courseId, {
        title,
        description: description || null,
        topic_id: topicId || null,
      })
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">ชื่อข้อสอบ</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
          placeholder="เช่น แบบทดสอบก่อนเรียน บทที่ 1" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">คำอธิบาย (ไม่บังคับ)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink resize-none focus:outline-none focus:border-rust" />
      </div>

      {topics.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">หัวข้อ (ไม่บังคับ)</label>
          <select value={topicId} onChange={e => setTopicId(e.target.value)}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust">
            <option value="">— ไม่ระบุหัวข้อ —</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      )}

      <button type="submit" disabled={pending}
        className="w-full bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors disabled:opacity-50">
        {pending ? 'กำลังสร้าง...' : 'สร้างข้อสอบ →'}
      </button>
    </form>
  )
}
