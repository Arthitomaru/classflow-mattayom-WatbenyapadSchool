'use client'

import { useTransition } from 'react'
import { updateQuizStatus } from '../actions'
import type { QuizStatus } from '@/types/database'

const labels: Record<QuizStatus, string> = {
  draft: 'ฉบับร่าง',
  open: 'เปิดสอบ',
  closed: 'ปิดสอบ',
}

const colors: Record<QuizStatus, string> = {
  draft: 'text-ink-muted border-seam',
  open: 'text-verdant border-verdant/40 bg-verdant/5',
  closed: 'text-crimson border-crimson/40 bg-crimson/5',
}

export default function QuizStatusControl({
  quizId, courseId, status,
}: { quizId: string; courseId: string; status: QuizStatus }) {
  const [pending, startTransition] = useTransition()

  function change(next: QuizStatus) {
    startTransition(() => updateQuizStatus(quizId, courseId, next))
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs px-2 py-1 border ${colors[status]}`}>{labels[status]}</span>
      {status === 'draft' && (
        <button onClick={() => change('open')} disabled={pending}
          className="text-xs px-3 py-1 bg-verdant text-white hover:opacity-80 transition-opacity disabled:opacity-50">
          เปิดสอบ
        </button>
      )}
      {status === 'open' && (
        <button onClick={() => change('closed')} disabled={pending}
          className="text-xs px-3 py-1 bg-crimson text-white hover:opacity-80 transition-opacity disabled:opacity-50">
          ปิดสอบ
        </button>
      )}
      {status === 'closed' && (
        <button onClick={() => change('draft')} disabled={pending}
          className="text-xs px-3 py-1 border border-seam text-ink-muted hover:text-rust hover:border-rust transition-colors disabled:opacity-50">
          กลับเป็นร่าง
        </button>
      )}
    </div>
  )
}
