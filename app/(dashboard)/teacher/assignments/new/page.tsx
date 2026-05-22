'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Grade } from '@/types/database'

const SUBJECTS = ['การออกแบบเทคโนโลยี', 'วิทยาการคำนวณ']

export default function NewAssignment() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [grade, setGrade] = useState<Grade>('ม.1')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('assignments').insert({
      title,
      description: description || null,
      due_date: dueDate || null,
      grade,
      subject,
      teacher_id: user.id,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/teacher/assignments')
    router.refresh()
  }

  return (
    <div className="p-10 max-w-2xl">
      <div className="mb-8">
        <Link href="/teacher/assignments"
          className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← กลับ
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">สร้างใหม่</p>
        <h1 className="font-display text-4xl text-ink">มอบหมายงาน</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grade selection */}
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            ระดับชั้น <span className="text-rust">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['ม.1', 'ม.2', 'ม.3'] as Grade[]).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`py-3 text-base font-semibold border transition-colors ${
                  grade === g
                    ? 'bg-ink text-parchment border-ink'
                    : 'bg-parchment-dark text-ink-muted border-seam hover:border-ink'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Subject selection */}
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            วิชา <span className="text-rust">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={`py-2.5 text-sm border transition-colors ${
                  subject === s
                    ? 'bg-ink text-parchment border-ink'
                    : 'bg-parchment-dark text-ink-muted border-seam hover:border-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            ชื่องาน <span className="text-rust">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
            placeholder="เช่น เขียนเรียงความเรื่องบ้านเกิด"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            คำอธิบาย / รายละเอียด
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={6}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors resize-none"
            placeholder="อธิบายรายละเอียดงาน เกณฑ์การให้คะแนน..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            วันส่ง
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
          />
        </div>

        {error && (
          <p className="text-crimson text-sm border border-crimson/20 bg-crimson/5 px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-parchment px-8 py-3 text-base hover:bg-rust transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังสร้าง...' : 'สร้างงาน'}
          </button>
          <Link href="/teacher/assignments"
            className="px-8 py-3 text-base border border-seam text-ink-muted hover:border-ink hover:text-ink transition-colors">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  )
}
