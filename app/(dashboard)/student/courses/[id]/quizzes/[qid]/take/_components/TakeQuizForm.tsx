'use client'

import { useState, useTransition } from 'react'
import { submitQuizAttempt } from '../../../actions'

interface Choice { id: string; choice_text: string; choice_order: number }
interface Question { id: string; question_text: string; points: number; quiz_choices: Choice[] }

export default function TakeQuizForm({
  quizId, courseId, questions,
}: { quizId: string; courseId: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  const answered = Object.keys(answers).length
  const total = questions.length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (answered < total) {
      if (!confirm(`ยังตอบไม่ครบ (${answered}/${total} ข้อ) ต้องการส่งเลยไหม?`)) return
    }
    startTransition(() => submitQuizAttempt(quizId, courseId, answers))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((q, qi) => (
        <div key={q.id} className="border border-seam">
          <div className="flex items-start gap-3 px-5 py-4 bg-parchment-dark border-b border-seam">
            <span className="font-display italic text-rust text-sm mt-0.5 flex-shrink-0">{qi + 1}.</span>
            <div className="flex-1">
              <p className="text-ink text-base leading-relaxed">{q.question_text}</p>
              <p className="text-xs text-ink-muted mt-1">{q.points} คะแนน</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {q.quiz_choices.map((c, ci) => {
              const selected = answers[q.id] === c.id
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors ${
                    selected
                      ? 'border-rust bg-rust/5 text-ink'
                      : 'border-seam hover:border-rust/50 text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={c.id}
                    checked={selected}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: c.id }))}
                    className="accent-rust flex-shrink-0"
                  />
                  <span className="text-sm">
                    <span className="text-ink-muted mr-2">{String.fromCharCode(65 + ci)}.</span>
                    {c.choice_text}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-0 bg-parchment border-t border-seam p-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">ตอบแล้ว {answered}/{total} ข้อ</p>
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-parchment px-8 py-3 text-base hover:bg-rust transition-colors disabled:opacity-50"
        >
          {pending ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
        </button>
      </div>
    </form>
  )
}
