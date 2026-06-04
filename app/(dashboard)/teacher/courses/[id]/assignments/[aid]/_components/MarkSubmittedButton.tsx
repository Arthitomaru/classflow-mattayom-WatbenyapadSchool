'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAsSubmitted } from '../../actions'

interface Props {
  studentId: string
  studentName: string
  assignmentId: string
  courseId: string
}

export default function MarkSubmittedButton({ studentId, studentName, assignmentId, courseId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleConfirm() {
    setError('')
    startTransition(async () => {
      const result = await markAsSubmitted(studentId, assignmentId, courseId)
      if (result.error) {
        setError(result.error)
        setConfirming(false)
      } else {
        setConfirming(false)
        router.refresh()
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted">แน่ใจ?</span>
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="text-xs px-2 py-0.5 border border-verdant/40 text-verdant bg-verdant/5 hover:bg-verdant/10 transition-colors disabled:opacity-50"
        >
          {pending ? '...' : 'ยืนยัน'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError('') }}
          disabled={pending}
          className="text-xs px-2 py-0.5 border border-seam text-ink-muted hover:bg-parchment-dark transition-colors disabled:opacity-50"
        >
          ยกเลิก
        </button>
        {error && <span className="text-xs text-crimson">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-ink-muted hover:text-verdant border border-seam hover:border-verdant/40 px-2 py-0.5 transition-colors"
    >
      เปลี่ยนเป็นส่งแล้ว
    </button>
  )
}
