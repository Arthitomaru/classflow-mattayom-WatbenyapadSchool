'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
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
      setError('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + err.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="p-6 md:p-10 max-w-md">
      <div className="mb-8">
        <p className="text-rust text-xs tracking-[0.25em] uppercase mb-1">บัญชีของฉัน</p>
        <h1 className="font-display text-4xl text-ink">เปลี่ยนรหัสผ่าน</h1>
      </div>

      {success ? (
        <div className="border border-verdant/30 bg-verdant/5 p-6">
          <p className="text-verdant text-base font-semibold mb-2">✓ เปลี่ยนรหัสผ่านแล้ว</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-rust hover:text-rust-dark transition-colors mt-2"
          >
            ← กลับ
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-2">
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
            <label className="block text-sm font-semibold text-ink-muted mb-2">
              ยืนยันรหัสผ่านใหม่
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

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full text-sm text-ink-muted hover:text-rust transition-colors"
          >
            ← กลับ
          </button>
        </form>
      )}
    </div>
  )
}
