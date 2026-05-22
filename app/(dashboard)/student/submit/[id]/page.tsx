'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate, gradeToLetter } from '@/lib/utils'
import type { Assignment, Submission } from '@/types/database'

export default function SubmitAssignment() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [existing, setExisting] = useState<Submission | null>(null)
  const [studentName, setStudentName] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: a }, { data: s }, { data: profile }] = await Promise.all([
        supabase.from('assignments').select('*').eq('id', id).single(),
        supabase.from('submissions').select('*').eq('assignment_id', id).eq('student_id', user.id).single(),
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      ])
      if (profile) setStudentName(profile.full_name)

      setAssignment(a)
      if (s) {
        setExisting(s)
        setText(s.text_content ?? '')
      }
      setFetching(false)
    }
    load()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && !file) {
      setError('กรุณาพิมพ์คำตอบหรือแนบไฟล์')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let fileUrl: string | null = null
    let fileName: string | null = null

    if (file) {
      const ext = file.name.split('.').pop() ?? 'bin'
      const safeName = `${Date.now()}.${ext}`
      const filePath = `${user.id}/${id}/${safeName}`
      const { error: uploadErr } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, { upsert: true })

      if (uploadErr) {
        setError(`อัพโหลดไฟล์ไม่สำเร็จ: ${uploadErr.message}`)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(filePath)
      fileUrl = urlData.publicUrl
      fileName = file.name
    }

    const payload = {
      assignment_id: id,
      student_id: user.id,
      text_content: text || null,
      file_url: fileUrl,
      file_name: fileName,
      status: 'submitted' as const,
    }

    const { error: err } = existing
      ? await supabase.from('submissions').update(payload).eq('id', existing.id)
      : await supabase.from('submissions').insert(payload)

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/student/assignments')
    router.refresh()
  }

  if (fetching) {
    return (
      <div className="p-10">
        <div className="h-4 w-48 bg-seam animate-pulse rounded" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="p-10">
        <p className="text-ink-muted text-base">ไม่พบงานนี้</p>
        <Link href="/student/assignments" className="text-rust text-sm mt-2 inline-block">← กลับ</Link>
      </div>
    )
  }

  const isGraded = existing?.status === 'graded'

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <div className="mb-6">
        <Link href="/student/assignments"
          className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← รายการงาน
        </Link>
      </div>

      {/* Assignment details */}
      <div className="border border-seam p-6 mb-8 bg-parchment-dark">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-2">รายละเอียดงาน</p>
        <h1 className="font-display text-3xl text-ink mb-3">{assignment.title}</h1>
        {assignment.description && (
          <p className="text-ink-muted text-sm leading-relaxed">{assignment.description}</p>
        )}
        {assignment.due_date && (
          <p className="text-sm text-ink-muted mt-3">
            กำหนดส่ง: <span className="text-ink font-semibold">{formatDate(assignment.due_date)}</span>
          </p>
        )}
      </div>

      {/* Graded result */}
      {isGraded && existing && (
        <div className="border border-verdant/30 bg-verdant/5 p-6 mb-8">
          <p className="text-sm tracking-widest uppercase text-verdant mb-3">✓ ตรวจแล้ว</p>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-display text-5xl text-rust font-semibold">{existing.grade}</span>
            <span className="font-display text-2xl text-ink-muted">{gradeToLetter(existing.grade!)} คะแนน</span>
          </div>
          {existing.feedback && (
            <div>
              <p className="text-xs tracking-widest uppercase text-ink-muted mb-2">ความเห็นจากคุณครู</p>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{existing.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Submission form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-4">
          <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">
            {existing ? 'แก้ไขงาน' : 'ส่งงาน'}
          </p>
          <h2 className="font-display text-2xl text-ink">
            {isGraded ? 'ดูงานที่ส่ง' : existing ? 'แก้ไขคำตอบ' : 'เขียนคำตอบ'}
          </h2>
        </div>

        {/* ชื่อนักเรียน */}
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">ชื่อ-นามสกุล</label>
          <div className="bg-parchment-dark border border-seam px-4 py-3 text-base text-ink">
            {studentName || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            คำตอบ
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={10}
            disabled={isGraded}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="พิมพ์คำตอบที่นี่..."
          />
        </div>

        {!isGraded && (
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-2">
              แนบไฟล์ (ถ้ามี)
            </label>
            <div className="border border-seam border-dashed bg-parchment-dark p-6 text-center">
              <input
                type="file"
                id="file-upload"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <p className="text-ink text-sm">{file.name}</p>
                ) : existing?.file_name ? (
                  <p className="text-ink text-sm">{existing.file_name} <span className="text-ink-muted">(ไฟล์ปัจจุบัน)</span></p>
                ) : (
                  <>
                    <p className="text-ink-muted text-base mb-1">กดที่นี่เพื่อเลือกไฟล์</p>
                    <p className="text-ink-muted text-xs">รูปภาพ, PDF, Word</p>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {error && (
          <p className="text-crimson text-sm border border-crimson/20 bg-crimson/5 px-3 py-2">
            {error}
          </p>
        )}

        {!isGraded && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังส่ง...' : existing ? 'บันทึกการแก้ไข' : 'ส่งงาน'}
          </button>
        )}
      </form>
    </div>
  )
}
