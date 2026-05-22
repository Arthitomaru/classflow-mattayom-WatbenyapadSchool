'use client'

import { useState, useTransition } from 'react'
import {
  updateQuestion, deleteQuestion,
  addChoice, setCorrectChoice, deleteChoice,
} from '../actions'
import type { QuizQuestion, QuizChoice } from '@/types/database'

export default function QuestionItem({
  question, quizId, courseId, index,
}: {
  question: QuizQuestion & { quiz_choices: QuizChoice[] }
  quizId: string
  courseId: string
  index: number
}) {
  const [editing, setEditing] = useState(false)
  const [qText, setQText] = useState(question.question_text)
  const [qPoints, setQPoints] = useState(question.points)
  const [newChoice, setNewChoice] = useState('')
  const [newIsCorrect, setNewIsCorrect] = useState(false)
  const [addingChoice, setAddingChoice] = useState(false)
  const [pending, startTransition] = useTransition()

  const choices = question.quiz_choices ?? []

  function handleUpdateQuestion(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateQuestion(question.id, quizId, courseId, { question_text: qText, points: qPoints })
      setEditing(false)
    })
  }

  function handleDeleteQuestion() {
    if (!confirm('ลบคำถามนี้?')) return
    startTransition(() => deleteQuestion(question.id, quizId, courseId))
  }

  function handleAddChoice(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await addChoice(question.id, quizId, courseId, { choice_text: newChoice, is_correct: newIsCorrect })
      setNewChoice('')
      setNewIsCorrect(false)
      setAddingChoice(false)
    })
  }

  return (
    <div className="border border-seam mb-3">
      {/* Question header */}
      <div className="flex items-start gap-3 p-4 bg-parchment-dark/40">
        <span className="font-display italic text-rust text-sm mt-0.5 flex-shrink-0">{index}.</span>
        {editing ? (
          <form onSubmit={handleUpdateQuestion} className="flex-1 space-y-2">
            <textarea
              value={qText}
              onChange={e => setQText(e.target.value)}
              required rows={2}
              className="w-full bg-parchment border border-seam px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-rust"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-ink-muted">คะแนน</label>
              <input type="number" min={1} value={qPoints} onChange={e => setQPoints(Number(e.target.value))}
                className="w-16 bg-parchment border border-seam px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-rust" />
              <div className="flex gap-2 ml-auto">
                <button type="submit" disabled={pending}
                  className="bg-ink text-parchment px-3 py-1.5 text-xs hover:bg-rust transition-colors disabled:opacity-50">
                  บันทึก
                </button>
                <button type="button" onClick={() => { setEditing(false); setQText(question.question_text); setQPoints(question.points) }}
                  className="px-3 py-1.5 text-xs border border-seam text-ink-muted hover:text-rust transition-colors">
                  ยกเลิก
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1">
              <p className="text-sm text-ink leading-relaxed">{question.question_text}</p>
              <p className="text-xs text-ink-muted mt-1">{question.points} คะแนน</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditing(true)}
                className="text-xs text-ink-muted hover:text-rust transition-colors">แก้ไข</button>
              <button onClick={handleDeleteQuestion} disabled={pending}
                className="text-xs text-ink-muted hover:text-crimson transition-colors disabled:opacity-50">ลบ</button>
            </div>
          </>
        )}
      </div>

      {/* Choices */}
      <div className="px-4 pb-3 pt-2 space-y-2">
        {choices.map((c, ci) => (
          <div key={c.id} className={`flex items-center gap-2 px-3 py-2 border ${c.is_correct ? 'border-verdant/40 bg-verdant/5' : 'border-seam'}`}>
            <span className="text-xs text-ink-muted w-5 flex-shrink-0">{String.fromCharCode(65 + ci)}.</span>
            <span className="text-sm text-ink flex-1">{c.choice_text}</span>
            {c.is_correct && <span className="text-xs text-verdant font-semibold">✓ เฉลย</span>}
            {!c.is_correct && (
              <button
                onClick={() => startTransition(() => setCorrectChoice(c.id, question.id, quizId, courseId))}
                disabled={pending}
                className="text-xs text-ink-muted hover:text-verdant transition-colors disabled:opacity-50">
                ตั้งเป็นเฉลย
              </button>
            )}
            <button
              onClick={() => startTransition(() => deleteChoice(c.id, quizId, courseId))}
              disabled={pending}
              className="text-xs text-ink-muted hover:text-crimson transition-colors disabled:opacity-50">
              ลบ
            </button>
          </div>
        ))}

        {/* Add choice */}
        {addingChoice ? (
          <form onSubmit={handleAddChoice} className="flex items-center gap-2">
            <input
              value={newChoice}
              onChange={e => setNewChoice(e.target.value)}
              required placeholder="ตัวเลือกใหม่"
              className="flex-1 bg-parchment border border-seam px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-rust"
            />
            <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
              <input type="checkbox" checked={newIsCorrect} onChange={e => setNewIsCorrect(e.target.checked)}
                className="accent-verdant" />
              เฉลย
            </label>
            <button type="submit" disabled={pending}
              className="bg-ink text-parchment px-3 py-1.5 text-xs hover:bg-rust transition-colors disabled:opacity-50">
              {pending ? '...' : 'เพิ่ม'}
            </button>
            <button type="button" onClick={() => setAddingChoice(false)}
              className="px-3 py-1.5 text-xs border border-seam text-ink-muted hover:text-rust transition-colors">
              ✕
            </button>
          </form>
        ) : (
          <button onClick={() => setAddingChoice(true)}
            className="text-xs text-rust hover:text-rust-dark transition-colors">
            + เพิ่มตัวเลือก
          </button>
        )}
      </div>
    </div>
  )
}
