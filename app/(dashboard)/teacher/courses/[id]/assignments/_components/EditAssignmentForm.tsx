'use client'

import { useState } from 'react'
import { updateAssignment } from '../actions'

interface Props {
  assignmentId: string
  courseId: string
  title: string
  description: string | null
  dueDate: string | null
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditAssignmentForm({ assignmentId, courseId, title, description, dueDate }: Props) {
  const [open, setOpen] = useState(false)
  const [titleVal, setTitleVal] = useState(title)
  const [descVal, setDescVal] = useState(description ?? '')
  const [dueDateVal, setDueDateVal] = useState(toDatetimeLocal(dueDate))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await updateAssignment(assignmentId, courseId, {
      title: titleVal.trim(),
      description: descVal.trim() || null,
      due_date: dueDateVal || null,
    })
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    setOpen(false)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink-muted hover:text-rust transition-colors"
      >
        แก้ไข
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-lg bg-parchment border border-seam shadow-xl">
        <div className="px-6 py-4 border-b border-seam flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">แก้ไขงาน</h2>
          <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink transition-colors text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-wide uppercase">ชื่องาน</label>
            <input
              type="text"
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              required
              className="w-full bg-parchment-dark border border-seam px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-rust transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-wide uppercase">คำอธิบาย</label>
            <textarea
              value={descVal}
              onChange={e => setDescVal(e.target.value)}
              rows={3}
              className="w-full bg-parchment-dark border border-seam px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-rust transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5 tracking-wide uppercase">วันกำหนดส่ง</label>
            <input
              type="datetime-local"
              value={dueDateVal}
              onChange={e => setDueDateVal(e.target.value)}
              className="w-full bg-parchment-dark border border-seam px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-rust transition-colors"
            />
          </div>
          {error && (
            <p className="text-crimson text-xs border border-crimson/20 bg-crimson/5 px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-ink text-parchment py-2.5 text-sm hover:bg-rust transition-colors disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 border border-seam text-ink-muted text-sm hover:border-ink hover:text-ink transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
