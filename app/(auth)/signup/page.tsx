'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Grade } from '@/types/database'

const gradeConfig: Record<Grade, { label: string; active: string; idle: string }> = {
  'ม.1': {
    label: 'ม.1',
    active: 'bg-pink-400/20 text-pink-300 border-pink-400/60',
    idle: 'bg-white/6 text-white/50 border-white/18 hover:border-pink-400/40 hover:text-pink-300',
  },
  'ม.2': {
    label: 'ม.2',
    active: 'bg-green-400/20 text-green-300 border-green-400/60',
    idle: 'bg-white/6 text-white/50 border-white/18 hover:border-green-400/40 hover:text-green-300',
  },
  'ม.3': {
    label: 'ม.3',
    active: 'bg-red-400/20 text-red-300 border-red-400/60',
    idle: 'bg-white/6 text-white/50 border-white/18 hover:border-red-400/40 hover:text-red-300',
  },
  'ป.4': {
    label: 'ป.4',
    active: 'bg-blue-400/20 text-blue-300 border-blue-400/60',
    idle: 'bg-white/6 text-white/50 border-white/18 hover:border-blue-400/40 hover:text-blue-300',
  },
  'ป.5': {
    label: 'ป.5',
    active: 'bg-purple-400/20 text-purple-300 border-purple-400/60',
    idle: 'bg-white/6 text-white/50 border-white/18 hover:border-purple-400/40 hover:text-purple-300',
  },
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [grade, setGrade] = useState<Grade>('ม.1')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'student', full_name: fullName, grade },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'student',
        full_name: fullName,
        grade,
      })
      if (profileError) {
        setError(`บันทึกข้อมูลไม่สำเร็จ: ${profileError.message}`)
        setLoading(false)
        return
      }
      router.push('/student')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(160deg, #1A3A7A 0%, #2A5298 40%, #3562B0 65%, #1A3A7A 100%)' }}
    >
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14 relative overflow-hidden border-r border-white/10"
        style={{ background: 'rgba(15,30,80,0.45)' }}>

        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/รูป2.svg" alt="" className="w-3/4" />
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs tracking-widest uppercase">Classflow for mattayom</p>
        </div>

        <div className="relative z-10 space-y-5">
          <div>
            <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-3">สมัครสมาชิก</p>
            <h1 className="font-display text-5xl text-white leading-tight">
              สร้าง<br />
              <span className="text-yellow-300">บัญชีใหม่</span>
            </h1>
          </div>
          <div className="w-12 h-px bg-yellow-400/60" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white/50 text-xs tracking-widest uppercase">ระดับชั้น</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-pink-300 text-sm font-semibold px-2 py-1 bg-pink-400/15 border border-pink-400/30 rounded-sm">ม.1</span>
              <span className="text-green-300 text-sm font-semibold px-2 py-1 bg-green-400/15 border border-green-400/30 rounded-sm">ม.2</span>
              <span className="text-red-300 text-sm font-semibold px-2 py-1 bg-red-400/15 border border-red-400/30 rounded-sm">ม.3</span>
              <span className="text-blue-300 text-sm font-semibold px-2 py-1 bg-blue-400/15 border border-blue-400/30 rounded-sm">ป.4</span>
              <span className="text-purple-300 text-sm font-semibold px-2 py-1 bg-purple-400/15 border border-purple-400/30 rounded-sm">ป.5</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/25 text-xs tracking-widest uppercase">โรงเรียนวัดเบญพาด</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="w-full max-w-sm rounded-xl border border-white/18 p-8"
          style={{ background: 'rgba(30,60,140,0.45)', backdropFilter: 'blur(20px)' }}
        >
          <div className="lg:hidden mb-8 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/school-logo.jpg" alt="" className="w-9 h-9 object-contain" />
            <p className="font-display text-yellow-300 text-lg font-semibold">Classflow</p>
          </div>

          <div className="mb-7">
            <p className="text-yellow-400 text-xs tracking-[0.25em] uppercase mb-2">สมัครสมาชิก</p>
            <h2 className="font-display text-3xl text-white">สร้างบัญชี</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grade selection */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">ระดับชั้น</label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(gradeConfig) as Grade[]).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`py-2.5 text-sm font-semibold border transition-all rounded-sm ${
                      grade === g ? gradeConfig[g].active : gradeConfig[g].idle
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full bg-white/8 border border-white/18 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-colors rounded-sm"
                placeholder="เช่น สมชาย ใจดี"
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/8 border border-white/18 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-colors rounded-sm"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-white/50 mb-2">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/8 border border-white/18 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-colors rounded-sm"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs border border-red-400/25 bg-red-400/8 px-3 py-2 rounded-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-[#071628] py-3.5 text-sm font-semibold tracking-widest hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 rounded-sm"
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/12">
            <p className="text-white/40 text-sm text-center">
              มีบัญชีแล้ว?{' '}
              <Link href="/login" className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
