'use client'

import { useState, useTransition } from 'react'
import { createUser } from '../../../actions'
import type { Role, Grade } from '@/types/database'

const classrooms = [
  ...Array.from({ length: 10 }, (_, i) => `ม.1/${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `ม.2/${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `ม.3/${i + 1}`),
]

export default function NewUserForm() {
  const [role, setRole] = useState<Role>('student')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const res = await createUser({
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        full_name: fd.get('full_name') as string,
        role,
        grade: (fd.get('grade') as Grade) || null,
        classroom: (fd.get('classroom') as string) || null,
        phone: (fd.get('phone') as string) || null,
      })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">ชื่อ-นามสกุล</label>
        <input name="full_name" type="text" required
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">อีเมล</label>
        <input name="email" type="email" required
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">รหัสผ่าน</label>
        <input name="password" type="password" required minLength={6}
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust"
          placeholder="อย่างน้อย 6 ตัวอักษร" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">บทบาท</label>
        <div className="flex gap-2">
          {(['student', 'teacher', 'admin'] as Role[]).map(r => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`px-4 py-2 text-sm border transition-colors ${role === r ? 'bg-ink text-parchment border-ink' : 'border-seam text-ink-muted hover:border-rust'}`}>
              {r === 'student' ? 'นักเรียน' : r === 'teacher' ? 'ครู' : 'Admin'}
            </button>
          ))}
        </div>
      </div>

      {role === 'student' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-2">ชั้น</label>
            <select name="grade"
              className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust">
              <option value="">— เลือก —</option>
              {(['ม.1', 'ม.2', 'ม.3'] as Grade[]).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-muted mb-2">ห้องเรียน</label>
            <select name="classroom"
              className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust">
              <option value="">— เลือก —</option>
              {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">เบอร์โทร (ไม่บังคับ)</label>
        <input name="phone" type="tel"
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust" />
      </div>

      {error && <p className="text-crimson text-sm border border-crimson/20 bg-crimson/5 px-3 py-2">{error}</p>}

      <button type="submit" disabled={pending}
        className="w-full bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors disabled:opacity-50">
        {pending ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
      </button>
    </form>
  )
}
