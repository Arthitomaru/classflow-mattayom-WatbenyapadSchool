'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteContentItem, updateContentItem } from '../actions'

interface ContentItem {
  id: string
  title: string
  description: string | null
  type: string
  url: string | null
  file_path: string | null
}

export default function ContentItemActions({ item, courseId }: { item: ContentItem; courseId: string }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [url, setUrl] = useState(item.url ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`ลบ "${item.title}" ?`)) return
    setDeleting(true)
    const res = await deleteContentItem(item.id, courseId)
    if (res?.error) {
      alert(res.error)
      setDeleting(false)
      return
    }
    router.refresh()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let filePath = item.file_path
    if (item.type === 'file' && file) {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${courseId}/${Date.now()}.${ext}`
      const uploadOpts: { upsert: boolean; contentType?: string } = { upsert: true }
      if (ext === 'html') uploadOpts.contentType = 'text/html'
      const { error: uploadErr } = await supabase.storage
        .from('course-content').upload(path, file, uploadOpts)
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('course-content').getPublicUrl(path)
        filePath = publicUrl
      }
    }

    await updateContentItem(item.id, courseId, {
      title,
      description: description || null,
      url: item.type !== 'file' ? (url || null) : item.url,
      file_path: filePath,
    })

    setSaving(false)
    setEditing(false)
  }

  const typeBadge = (
    <span className={`text-xs px-1.5 py-0.5 border flex-shrink-0 ${
      item.type === 'youtube' ? 'text-crimson border-crimson/30 bg-crimson/5'
      : item.type === 'file' ? 'text-verdant border-verdant/30 bg-verdant/5'
      : 'text-ink-muted border-seam'
    }`}>
      {item.type === 'youtube' ? 'YT' : item.type === 'file' ? 'FILE' : 'LINK'}
    </span>
  )

  if (editing) {
    return (
      <form onSubmit={handleSave} className="px-5 py-3 bg-parchment-dark/30 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          {typeBadge}
          <span className="text-xs text-ink-muted">แก้ไขเนื้อหา</span>
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="ชื่อเนื้อหา"
          className="w-full bg-parchment border border-seam px-3 py-2 text-sm text-ink focus:outline-none focus:border-rust"
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="คำอธิบาย (ไม่บังคับ)"
          className="w-full bg-parchment border border-seam px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-rust"
        />

        {item.type !== 'file' ? (
          <input
            key="url-edit"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={item.type === 'youtube' ? 'YouTube URL' : 'URL ลิงก์'}
            className="w-full bg-parchment border border-seam px-3 py-2 text-sm text-ink focus:outline-none focus:border-rust"
          />
        ) : (
          <div key="file-edit">
            {item.file_path && (
              <a href={item.file_path} target="_blank" rel="noopener noreferrer"
                className="text-xs text-rust hover:text-rust-dark block mb-1">
                ไฟล์ปัจจุบัน →
              </a>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.html"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full bg-parchment border border-seam px-3 py-2 text-xs text-ink file:mr-3 file:py-1 file:px-2 file:border-0 file:text-xs file:bg-ink file:text-parchment hover:file:bg-rust file:cursor-pointer"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-parchment px-4 py-2 text-xs hover:bg-rust transition-colors disabled:opacity-50"
          >
            {saving ? 'บันทึก...' : 'บันทึก'}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setTitle(item.title); setDescription(item.description ?? ''); setUrl(item.url ?? '') }}
            className="px-4 py-2 text-xs border border-seam text-ink-muted hover:text-rust hover:border-rust transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      {typeBadge}
      <span className="text-sm text-ink flex-1">{item.title}</span>
      {(item.url || item.file_path) && (
        <a
          href={item.file_path ?? item.url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-rust hover:text-rust-dark transition-colors"
        >
          ดู →
        </a>
      )}
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-ink-muted hover:text-rust transition-colors"
      >
        แก้ไข
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-ink-muted hover:text-crimson transition-colors disabled:opacity-50"
      >
        {deleting ? '...' : 'ลบ'}
      </button>
    </div>
  )
}
