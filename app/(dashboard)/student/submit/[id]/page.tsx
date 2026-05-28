'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate, gradeToLetter } from '@/lib/utils'
import type { Assignment, Submission } from '@/types/database'

function parseFiles(file_url: string | null, file_name: string | null): { url: string; name: string }[] {
  if (!file_url || !file_name) return []
  try {
    const urls = JSON.parse(file_url)
    const names = JSON.parse(file_name)
    if (Array.isArray(urls) && Array.isArray(names)) {
      return urls.map((url: string, i: number) => ({ url, name: names[i] ?? url }))
    }
  } catch {
    return [{ url: file_url, name: file_name }]
  }
  return []
}

export default function SubmitAssignment() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [existing, setExisting] = useState<Submission | null>(null)
  const [studentName, setStudentName] = useState('')
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
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

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && files.length === 0 && !existing?.file_url) {
      setError('กรุณาพิมพ์คำตอบหรือแนบไฟล์')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let fileUrlValue: string | null = existing?.file_url ?? null
    let fileNameValue: string | null = existing?.file_name ?? null

    if (files.length > 0) {
      const uploadedUrls: string[] = []
      const uploadedNames: string[] = []

      for (const file of files) {
        const ext = file.name.split('.').pop() ?? 'bin'
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const filePath = `${user.id}/${id}/${safeName}`
        const { error: uploadErr } = await supabase.storage
          .from('submissions')
          .upload(filePath, file, { upsert: true })

        if (uploadErr) {
          setError(`อัพโหลด "${file.name}" ไม่สำเร็จ: ${uploadErr.message}`)
          setLoading(false)
          return
        }

        const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(filePath)
        uploadedUrls.push(urlData.publicUrl)
        uploadedNames.push(file.name)
      }

      fileUrlValue = JSON.stringify(uploadedUrls)
      fileNameValue = JSON.stringify(uploadedNames)
    }

    const payload = {
      assignment_id: id,
      student_id: user.id,
      text_content: text || null,
      file_url: fileUrlValue,
      file_name: fileNameValue,
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
  const existingFiles = parseFiles(existing?.file_url ?? null, existing?.file_name ?? null)

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
          <label className="block text-sm font-semibold text-ink-muted mb-2">คำตอบ</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={10}
            disabled={isGraded}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="พิมพ์คำตอบที่นี่..."
          />
        </div>

        {/* Existing files (read-only display) */}
        {existingFiles.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-2">
              ไฟล์ที่ส่งไปแล้ว
            </label>
            <ul className="space-y-1">
              {existingFiles.map((f, i) => (
                <li key={i}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-rust hover:text-rust-dark transition-colors"
                  >
                    <span>📎</span>
                    <span className="underline underline-offset-2">{f.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isGraded && (
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-2">
              {existingFiles.length > 0 ? 'แนบไฟล์ใหม่ (จะแทนที่ไฟล์เดิม)' : 'แนบไฟล์ (ถ้ามี)'}
            </label>
            <div className="border border-seam border-dashed bg-parchment-dark p-4">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={e => setFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-ink-muted
                  file:mr-3 file:py-2 file:px-4
                  file:border-0 file:text-sm
                  file:bg-ink file:text-parchment
                  hover:file:bg-rust file:cursor-pointer file:transition-colors"
              />
              {files.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between text-sm text-ink py-1 border-b border-seam/50 last:border-0">
                      <span className="flex items-center gap-2">
                        <span>📎</span>
                        <span>{f.name}</span>
                        <span className="text-xs text-ink-muted">({(f.size / 1024).toFixed(0)} KB)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-xs text-crimson hover:text-crimson/70 transition-colors ml-3 flex-shrink-0"
                      >
                        ลบ
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {files.length === 0 && (
                <p className="text-xs text-ink-muted mt-2">เลือกได้หลายไฟล์พร้อมกัน</p>
              )}
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
