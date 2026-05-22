'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewCourse() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
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

    const { error: err } = await supabase.from('courses').insert({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || null,
      teacher_id: user.id,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/teacher/courses')
    router.refresh()
  }

  return (
    <div className="p-10 max-w-2xl">
      <div className="mb-8">
        <Link href="/teacher/courses"
          className="text-ink-muted text-sm hover:text-rust transition-colors">
          ← วิชาของฉัน
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">สร้างใหม่</p>
        <h1 className="font-display text-4xl text-ink">สร้างรายวิชา</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            รหัสวิชา <span className="text-rust">*</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            maxLength={20}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors uppercase"
            placeholder="เช่น ว31101"
          />
          <p className="text-ink-muted text-xs mt-1">นักเรียนจะใช้รหัสนี้ลงทะเบียนวิชา</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            ชื่อวิชา <span className="text-rust">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
            placeholder="เช่น วิทยาการคำนวณ"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">
            คำอธิบายวิชา
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors resize-none"
            placeholder="อธิบายเนื้อหาและวัตถุประสงค์ของวิชา..."
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
            {loading ? 'กำลังสร้าง...' : 'สร้างวิชา'}
          </button>
          <Link href="/teacher/courses"
            className="px-8 py-3 text-base border border-seam text-ink-muted hover:border-ink hover:text-ink transition-colors">
            ยกเลิก
          </Link>
        </div>
      </form>
    </div>
  )
}
