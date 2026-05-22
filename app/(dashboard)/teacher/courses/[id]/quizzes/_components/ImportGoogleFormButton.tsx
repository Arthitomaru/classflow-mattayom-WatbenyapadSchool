'use client'

import { useState, useTransition } from 'react'
import { importFromGoogleForms } from '../actions'

export default function ImportGoogleFormButton({
  quizId, courseId,
}: { quizId: string; courseId: string }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<{ error?: string; imported?: number } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await importFromGoogleForms(url, quizId, courseId)
      setResult(res)
      if (res.imported) { setUrl(''); setOpen(false) }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-seam text-ink-muted text-sm hover:border-rust hover:text-rust transition-colors">
        <span>↓</span> Import จาก Google Forms
      </button>
    )
  }

  return (
    <div className="border border-seam p-4 bg-parchment-dark/30 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Import จาก Google Forms</p>
        <button onClick={() => { setOpen(false); setResult(null) }} className="text-ink-muted hover:text-rust text-sm">✕</button>
      </div>
      <p className="text-xs text-ink-muted">Form ต้องตั้งค่าเป็น <strong>public</strong> (ไม่ต้อง login เพื่อดู) และเป็นคำถาม multiple choice เท่านั้น</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
          placeholder="https://docs.google.com/forms/d/..."
          className="flex-1 bg-parchment border border-seam px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
        />
        <button type="submit" disabled={pending}
          className="bg-ink text-parchment px-4 py-2 text-sm hover:bg-rust transition-colors disabled:opacity-50">
          {pending ? 'กำลัง import...' : 'Import'}
        </button>
      </form>

      {result?.error && (
        <p className="text-crimson text-xs border border-crimson/20 bg-crimson/5 px-3 py-2">{result.error}</p>
      )}
      {result?.imported && (
        <p className="text-verdant text-xs border border-verdant/20 bg-verdant/5 px-3 py-2">
          ✓ import {result.imported} คำถามแล้ว — ต้องตั้งเฉลยเองในแต่ละข้อ
        </p>
      )}
    </div>
  )
}
