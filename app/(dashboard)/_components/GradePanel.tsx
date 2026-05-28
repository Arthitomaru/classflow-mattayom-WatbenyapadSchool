'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const QUICK_SCORES = [50, 65, 75, 85, 95]
const QUICK_COMMENTS = [
  'งานครบถ้วนดีมาก',
  'ขยันทำต่อนะ',
  'ลองเพิ่มรายละเอียดอีกหน่อย',
  'ตรงเวลา',
  'รูปประกอบช่วยได้มาก',
]

function letterGrade(s: number): string {
  return s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s >= 50 ? 'D' : 'F'
}
function letterColor(s: number): string {
  return s >= 80 ? '#10B981' : s >= 65 ? '#2563EB' : s >= 50 ? '#D97706' : '#EF4444'
}

interface GradePanelSubmission {
  id: string
  text_content: string | null
  file_url: string | null
  file_name: string | null
  status: 'submitted' | 'graded'
  grade: number | null
  feedback: string | null
  profiles?: { full_name: string } | null
}

interface Props {
  submission: GradePanelSubmission
}

export default function GradePanel({ submission }: Props) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState<number>(submission.grade ?? 0)
  const [feedback, setFeedback] = useState(submission.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function appendComment(comment: string) {
    setFeedback(prev => prev ? `${prev}\n${comment}` : comment)
  }

  function parseFiles(): { url: string; name: string }[] {
    const { file_url, file_name } = submission
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

  async function handleDownload(url: string, name: string) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
    } catch {
      window.open(url, '_blank')
    }
  }

  const attachedFiles = parseFiles()

  async function handleSave() {
    setSaving(true)
    setError('')
    if (score < 0 || score > 100) {
      setError('คะแนนต้องอยู่ระหว่าง 0–100')
      setSaving(false)
      return
    }
    const supabase = createClient()
    const { error: err } = await supabase.from('submissions').update({
      grade: score,
      feedback,
      status: 'graded',
      graded_at: new Date().toISOString(),
    }).eq('id', submission.id)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[12px] font-medium text-primary hover:underline transition-colors"
      >
        {submission.status === 'graded' ? 'แก้ไข →' : 'ตรวจงาน →'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-seam"
            style={{ boxShadow: '0 30px 60px -20px rgba(11,31,68,.4)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-seam">
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-primary mb-0.5">ตรวจงาน</p>
                <h2 className="font-display font-semibold text-[18px] text-ink">
                  {submission.profiles?.full_name ?? 'นักเรียน'}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-soft transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Body — 2 col */}
            <div className="p-6 grid grid-cols-[1fr_260px] gap-5">
              {/* Left: submission content */}
              <div className="space-y-4 min-w-0">
                {submission.text_content ? (
                  <div>
                    <p className="text-[11px] tracking-widest uppercase text-ink-subtle mb-2">เนื้อหาที่ส่ง</p>
                    <div
                      className="rounded-xl p-4 text-[13px] leading-relaxed text-ink whitespace-pre-wrap max-h-52 overflow-y-auto"
                      style={{ background: '#F4F8FF' }}
                    >
                      {submission.text_content}
                    </div>
                  </div>
                ) : null}

                {attachedFiles.length > 0 ? (
                  <div>
                    <p className="text-[11px] tracking-widest uppercase text-ink-subtle mb-2">ไฟล์แนบ ({attachedFiles.length})</p>
                    <div className="space-y-1.5">
                      {attachedFiles.map((f, i) => (
                        <button
                          key={i}
                          onClick={() => handleDownload(f.url, f.name)}
                          className="w-full text-[12px] font-mono px-3 py-2 rounded-xl border border-seam bg-surface-soft hover:bg-surface-tint transition-colors text-left text-primary"
                        >
                          📎 {f.name} · คลิกดาวน์โหลด
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {!submission.text_content && attachedFiles.length === 0 && (
                  <p className="text-[13px] text-ink-muted py-4">ไม่มีเนื้อหาที่ส่ง</p>
                )}
              </div>

              {/* Right: grading */}
              <div className="space-y-4">
                {/* Score + slider */}
                <div className="rounded-xl border border-seam p-4" style={{ background: '#F4F8FF' }}>
                  <p className="text-[11px] tracking-widest uppercase text-ink-subtle mb-2">ให้คะแนน</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display font-semibold text-[48px] leading-none tabular-nums text-ink">
                      {score}
                    </span>
                    <span className="text-[14px] text-ink-muted">/ 100</span>
                    <span
                      className="ml-auto font-display font-semibold text-[28px]"
                      style={{ color: letterColor(score) }}
                    >
                      {letterGrade(score)}
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={score}
                    onChange={e => setScore(Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: '#2563EB' }}
                  />
                  <div className="grid grid-cols-5 gap-1 mt-3">
                    {QUICK_SCORES.map(v => (
                      <button
                        key={v}
                        onClick={() => setScore(v)}
                        className="py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                        style={score === v
                          ? { background: '#2563EB', color: '#fff' }
                          : { background: '#FFFFFF', color: '#5C6B8A', border: '1px solid #E1E8F3' }
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback textarea */}
                <div>
                  <p className="text-[11px] tracking-widest uppercase text-ink-subtle mb-2">ความเห็นของครู</p>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={4}
                    placeholder="เขียนความเห็นให้นักเรียน..."
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] text-ink outline-none resize-none border border-seam bg-surface-soft focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Quick comments */}
                <div>
                  <p className="text-[11px] tracking-widest uppercase text-ink-subtle mb-2">คำตอบเร็ว</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COMMENTS.map(c => (
                      <button
                        key={c}
                        onClick={() => appendComment(c)}
                        className="text-[11px] px-2.5 py-1.5 rounded-full border border-seam bg-white hover:bg-surface-tint text-ink-muted transition-colors"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-danger border border-danger/20 bg-danger/5 px-3 py-2 rounded-xl">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-ink-muted border border-seam hover:bg-surface-soft transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all press disabled:opacity-50"
                    style={{ background: '#2563EB', boxShadow: '0 8px 18px -8px #2563EB' }}
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
