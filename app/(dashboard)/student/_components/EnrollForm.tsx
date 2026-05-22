'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function EnrollForm({ studentId }: { studentId: string }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const supabase = createClient()

    const { data: course } = await supabase
      .from('courses')
      .select('id, name')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (!course) {
      setError('ไม่พบรหัสวิชานี้ในระบบ')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.from('enrollments').insert({
      course_id: course.id,
      student_id: studentId,
    })

    if (err) {
      setError(err.code === '23505' ? 'คุณลงทะเบียนวิชานี้แล้ว' : err.message)
      setLoading(false)
      return
    }

    setSuccess(`ลงทะเบียนวิชา "${course.name}" สำเร็จ`)
    setCode('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div
      className="rounded-2xl bg-white border border-seam p-5"
      style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}
    >
      <form onSubmit={handleEnroll}>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEF3C7', color: '#D97706' }}
          >
            <IconPlus className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-[15px] text-ink">ลงทะเบียนวิชาใหม่</p>
            <p className="text-[12px] mt-0.5 text-ink-muted">กรอกรหัสวิชาที่ได้รับจากคุณครู</p>
          </div>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="เช่น MAT202"
            className="w-36 px-3 py-2.5 rounded-xl text-[13px] font-mono text-ink bg-surface-soft border border-seam outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press disabled:opacity-50 whitespace-nowrap flex-shrink-0"
            style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
          >
            {loading ? 'กำลัง...' : 'ลงทะเบียน'}
          </button>
        </div>

        {(error || success) && (
          <p className={`mt-3 text-[13px] px-3 py-2 rounded-xl border ${
            error
              ? 'text-danger bg-danger/5 border-danger/20'
              : 'text-success bg-success/5 border-success/20'
          }`}>
            {error || success}
          </p>
        )}
      </form>
    </div>
  )
}
