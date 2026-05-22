'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    if (err) {
      setError('ไม่พบอีเมลนี้ในระบบ')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-parchment">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-rust text-xs tracking-[0.25em] uppercase mb-2">รีเซ็ตรหัสผ่าน</p>
          <h1 className="font-display text-4xl text-ink">ลืมรหัสผ่าน</h1>
        </div>

        {sent ? (
          <div className="border border-verdant/30 bg-verdant/5 p-6">
            <p className="text-verdant text-base font-semibold mb-2">ส่งลิงก์แล้ว!</p>
            <p className="text-ink-muted text-sm leading-relaxed">
              เช็กอีเมล <span className="text-ink font-semibold">{email}</span> แล้วคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่
            </p>
            <Link href="/login" className="block mt-4 text-sm text-rust hover:text-rust-dark transition-colors">
              ← กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-ink-muted text-sm">ใส่อีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้</p>

            <div>
              <label className="block text-xs tracking-widest uppercase text-ink-muted mb-2">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
                placeholder="email@example.com"
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
              {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </button>

            <Link href="/login" className="block text-center text-sm text-ink-muted hover:text-rust transition-colors">
              ← กลับ
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
