'use client'

import { useState, useTransition } from 'react'
import { addQuestion } from '../actions'

export default function AddQuestionForm({ quizId, courseId }: { quizId: string; courseId: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [points, setPoints] = useState(1)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await addQuestion(quizId, courseId, { question_text: text, points })
      setText('')
      setPoints(1)
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full py-3 border border-dashed border-seam text-ink-muted text-sm hover:border-rust hover:text-rust transition-colors">
        + เพิ่มคำถาม
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-seam p-4 space-y-3 bg-parchment-dark/30">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">คำถามใหม่</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        required
        rows={2}
        placeholder="ข้อความคำถาม"
        className="w-full bg-parchment border border-seam px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-rust"
      />
      <div className="flex items-center gap-3">
        <label className="text-xs text-ink-muted">คะแนน</label>
        <input
          type="number" min={1} value={points} onChange={e => setPoints(Number(e.target.value))}
          className="w-16 bg-parchment border border-seam px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-rust"
        />
        <div className="flex gap-2 ml-auto">
          <button type="submit" disabled={pending}
            className="bg-ink text-parchment px-4 py-2 text-xs hover:bg-rust transition-colors disabled:opacity-50">
            {pending ? '...' : 'เพิ่ม'}
          </button>
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 py-2 text-xs border border-seam text-ink-muted hover:text-rust hover:border-rust transition-colors">
            ยกเลิก
          </button>
        </div>
      </div>
    </form>
  )
}
