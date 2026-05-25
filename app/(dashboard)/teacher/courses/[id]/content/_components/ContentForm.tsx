'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Topic } from '@/types/database'
import { notifyContentAdded } from '@/app/(dashboard)/notifications/actions'

type ContentType = 'file' | 'youtube' | 'link'

export default function ContentForm({
  courseId,
  topics,
  defaultTopicId,
}: {
  courseId: string
  topics: Topic[]
  defaultTopicId?: string
}) {
  const [topicId, setTopicId] = useState(defaultTopicId ?? topics[0]?.id ?? '')
  const [type, setType] = useState<ContentType>('youtube')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    let filePath: string | null = null
    let itemUrl: string | null = null

    if (type === 'file') {
      if (!file) { setError('เลือกไฟล์ก่อน'); setLoading(false); return }
      const ext = file.name.split('.').pop()
      const path = `${courseId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('course-content')
        .upload(path, file, { upsert: true })
      if (uploadErr) { setError('อัพโหลดไม่สำเร็จ: ' + uploadErr.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('course-content').getPublicUrl(path)
      filePath = publicUrl
    } else {
      if (!url) { setError('ใส่ URL ก่อน'); setLoading(false); return }
      itemUrl = url
    }

    const { error: insertErr } = await supabase.from('content_items').insert({
      topic_id: topicId,
      title,
      description: description || null,
      type,
      url: itemUrl,
      file_path: filePath,
      item_order: 0,
    })

    if (insertErr) {
      setError('บันทึกไม่สำเร็จ: ' + insertErr.message)
      setLoading(false)
      return
    }

    // Notify enrolled students (fire-and-forget, ignore errors)
    notifyContentAdded(courseId, title).catch(() => {})

    router.push(`/teacher/courses/${courseId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Topic */}
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">หัวข้อ</label>
        <select
          value={topicId}
          onChange={e => setTopicId(e.target.value)}
          required
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust"
        >
          {topics.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">ประเภทเนื้อหา</label>
        <div className="flex gap-2">
          {(['youtube', 'file', 'link'] as ContentType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 text-sm border transition-colors ${
                type === t
                  ? 'bg-ink text-parchment border-ink'
                  : 'bg-parchment-dark text-ink-muted border-seam hover:border-rust'
              }`}
            >
              {t === 'youtube' ? 'YouTube' : t === 'file' ? 'ไฟล์' : 'ลิงก์'}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">ชื่อเนื้อหา</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
          placeholder="เช่น บทที่ 1: บทนำ"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">คำอธิบาย (ไม่บังคับ)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust resize-none"
        />
      </div>

      {/* Content input */}
      {type === 'file' ? (
        <div key="file-input">
          <label className="block text-sm font-semibold text-ink-muted mb-2">ไฟล์ (PDF, Word, PPT, รูปภาพ)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            required
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-sm text-ink file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:bg-ink file:text-parchment hover:file:bg-rust file:cursor-pointer"
          />
        </div>
      ) : (
        <div key="url-input">
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            {type === 'youtube' ? 'YouTube URL' : 'URL ลิงก์'}
          </label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            placeholder={type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
          />
        </div>
      )}

      {error && (
        <p className="text-crimson text-sm border border-crimson/20 bg-crimson/5 px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึกเนื้อหา'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/teacher/courses/${courseId}`)}
          className="px-6 py-4 border border-seam text-ink-muted text-sm hover:text-rust hover:border-rust transition-colors"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  )
}
