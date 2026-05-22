'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Icons ─────────────────────────────────────────────────────

function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}
function IconPaper({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" />
    </svg>
  )
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  )
}
function IconQuiz({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.3 1-1.3 2" /><circle cx="12" cy="17" r=".6" fill="currentColor" />
    </svg>
  )
}
function IconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <path d="m12 3 2.7 5.8 6.3.7-4.7 4.4 1.3 6.4L12 17l-5.6 3.3 1.3-6.4L3 9.5l6.3-.7z" />
    </svg>
  )
}
function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" />
    </svg>
  )
}

// ── Feature chips data ─────────────────────────────────────────

const CHIPS = [
  { color: '#EC4899', bg: '#FCE7F3', Icon: IconBook,  label: '6 รายวิชา' },
  { color: '#2563EB', bg: '#DBE7FF', Icon: IconPaper, label: 'ส่งงานออนไลน์' },
  { color: '#10B981', bg: '#D1FAE5', Icon: IconCheck, label: 'ตรวจงาน + ให้คะแนน' },
  { color: '#6366F1', bg: '#EDE9FE', Icon: IconQuiz,  label: 'ทำข้อสอบในระบบ' },
]

// ── Page ──────────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [role, setRole]         = useState<'student' | 'teacher'>('student')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      router.push(profile?.role === 'teacher' || profile?.role === 'admin' ? '/teacher' : '/student')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'linear-gradient(140deg, #EAF2FE 0%, #F4E9FE 45%, #FFF4E0 100%)' }}>

      {/* ── Pastel blobs ── */}
      <div className="blob" style={{ background: '#F59E0B', width: 480, height: 480, top: -120, left: -120 }} />
      <div className="blob" style={{ background: '#EC4899', width: 380, height: 380, bottom: -100, right: -80 }} />
      <div className="blob" style={{ background: '#2563EB', width: 340, height: 340, top: '40%', left: '38%', opacity: 0.25 }} />

      {/* ── Left brand (lg+) ── */}
      <div className="flex-1 hidden lg:flex flex-col p-14 relative z-10">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden flex-shrink-0"
            style={{ boxShadow: '0 10px 24px -10px rgba(11,31,68,.3)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/school-logo.jpg" alt="ตราโรงเรียน" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-display font-semibold text-[17px] text-ink">Classflow</p>
            <p className="text-[10px] tracking-[0.3em] uppercase text-ink-subtle">for mattayom</p>
          </div>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase px-2.5 py-1 rounded-full mb-5 self-start"
            style={{ background: '#FEF3C7', color: '#D97706' }}>
            <IconSpark className="w-3 h-3" />
            ปีการศึกษา 2569 · เทอม 1
          </span>

          <h1 className="font-display font-semibold text-[52px] leading-[1.05] mb-5 text-ink">
            ห้องเรียนของเรา<br />
            สดใส <span className="text-primary">ทุกวัน</span>
          </h1>

          <p className="text-[15px] leading-relaxed text-ink-muted max-w-sm">
            รวมการส่งงาน · ตรวจงาน · แบบทดสอบ และจัดการรายวิชา
            ไว้ในที่เดียว ใช้ได้ทั้งคุณครูและน้องๆ มัธยม
          </p>

          <div className="flex flex-wrap gap-2 mt-7">
            {CHIPS.map((c) => (
              <span key={c.label}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: c.bg, color: c.color }}>
                <c.Icon className="w-3 h-3" />
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[11px] tracking-[0.25em] uppercase text-ink-subtle">
          โรงเรียนวัดเบญพาด · สำนักงานเขตพื้นที่การศึกษา
        </p>
      </div>

      {/* ── Right: login card ── */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 lg:p-10 relative z-10">
        <div className="w-full max-w-[400px] rounded-3xl p-8 relative"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E1E8F3',
            boxShadow: '0 30px 60px -30px rgba(11,31,68,.3)',
          }}>

          {/* Floating gold star */}
          <div className="absolute -top-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center animate-float"
            style={{ background: '#F59E0B', color: '#1B1100', boxShadow: '0 10px 20px -8px #F59E0B' }}>
            <IconStar className="w-5 h-5" />
          </div>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white overflow-hidden border border-seam flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/school-logo.jpg" alt="ตราโรงเรียน" className="w-full h-full object-contain" />
            </div>
            <p className="font-display font-semibold text-ink">Classflow</p>
          </div>

          <p className="text-[11px] tracking-[0.25em] uppercase text-primary mb-2">เข้าสู่ระบบ</p>
          <h2 className="font-display font-semibold text-[26px] text-ink mb-6">
            สวัสดี ยินดีต้อนรับกลับ
          </h2>

          {/* Role tab (cosmetic — auth determines role from DB) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl mb-5"
            style={{ background: '#EAF2FE' }}>
            {(['student', 'teacher'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="rounded-xl py-2.5 text-[13px] font-medium transition-all"
                style={
                  role === r
                    ? { background: '#FFFFFF', color: '#0B1F44', boxShadow: '0 1px 3px rgba(11,31,68,.08)' }
                    : { background: 'transparent', color: '#5C6B8A' }
                }
              >
                {r === 'student' ? 'นักเรียน' : 'ครู / ผู้ดูแล'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] tracking-[0.18em] uppercase text-ink-subtle mb-1.5">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@school.ac.th"
                className="w-full px-4 py-3 rounded-xl text-[14px] text-ink bg-surface-soft border border-seam outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.18em] uppercase text-ink-subtle mb-1.5">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-[14px] text-ink bg-surface-soft border border-seam outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="flex items-center justify-between text-[12px] pt-1">
              <label className="flex items-center gap-2 text-ink-muted cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="rounded accent-primary" />
                จำฉันไว้
              </label>
              <Link href="/forgot-password" className="text-primary hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {error && (
              <p className="text-danger text-[13px] border border-danger/20 bg-danger/5 px-3 py-2 rounded-xl">
                อีเมลหรือรหัสผ่านไม่ถูกต้อง
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-[14px] font-semibold text-white transition-all press disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                boxShadow: '0 14px 30px -10px #2563EB',
              }}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-seam" />
            <span className="text-[11px] text-ink-subtle">หรือ</span>
            <div className="flex-1 h-px bg-seam" />
          </div>

          <Link
            href="/signup"
            className="block w-full rounded-xl py-3 text-[13px] font-medium text-center text-ink bg-surface-soft border border-seam hover:bg-surface-tint transition-colors"
          >
            สมัครสมาชิก
          </Link>

          <p className="text-center mt-5 text-[12px] text-ink-muted">
            ยังไม่มีบัญชี?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              ขอบัญชีจากคุณครู
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
