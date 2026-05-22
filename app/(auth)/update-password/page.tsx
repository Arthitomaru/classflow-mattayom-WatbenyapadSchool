'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError('ตั้งรหัสผ่านไม่สำเร็จ ลองใหม่อีกครั้ง')
      setLoading(false)
      return
    }
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-parchment">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-rust text-xs tracking-[0.25em] uppercase mb-2">ตั้งรหัสผ่านใหม่</p>
          <h1 className="font-display text-4xl text-ink">รหัสผ่านใหม่</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase text-ink-muted mb-2">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-ink-muted mb-2">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
              placeholder="พิมพ์รหัสผ่านอีกครั้ง"
            />
          </div>

          {error && (
            <p className="text-crimson text-sm border border-crimson/20 bg-crimson/5 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>
    </div>
  )
}
