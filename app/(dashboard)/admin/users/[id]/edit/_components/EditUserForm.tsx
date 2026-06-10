'use client'

import { useState, useTransition } from 'react'
import { updateUser } from '../../../../actions'
import type { Profile, Role, Grade } from '@/types/database'


export default function EditUserForm({ profile }: { profile: Profile }) {
  const [role, setRole] = useState<Role>(profile.role)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const password = fd.get('password') as string
      const res = await updateUser(profile.id, {
        full_name: fd.get('full_name') as string,
        role,
        grade: (fd.get('grade') as Grade) || null,
        classroom: (fd.get('classroom') as string) || null,
        phone: (fd.get('phone') as string) || null,
        password: password || undefined,
      })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">ชื่อ-นามสกุล</label>
        <input name="full_name" type="text" required defaultValue={profile.full_name}
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust" />
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
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">ชั้น</label>
          <select name="grade" defaultValue={profile.grade ?? ''}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust">
            <option value="">— เลือก —</option>
            {(['ม.1', 'ม.2', 'ม.3', 'ป.4', 'ป.5'] as Grade[]).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">เบอร์โทร</label>
        <input name="phone" type="tel" defaultValue={profile.phone ?? ''}
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust" />
      </div>

      <div className="border-t border-seam pt-5">
        <label className="block text-sm font-semibold text-ink-muted mb-2">รีเซ็ตรหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)</label>
        <input name="password" type="password" minLength={6}
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
          placeholder="รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)" />
      </div>

      {error && <p className="text-crimson text-sm border border-crimson/20 bg-crimson/5 px-3 py-2">{error}</p>}

      <button type="submit" disabled={pending}
        className="w-full bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors disabled:opacity-50">
        {pending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
      </button>
    </form>
  )
}
