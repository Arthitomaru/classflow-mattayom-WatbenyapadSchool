'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

const classrooms = [
  ...Array.from({ length: 10 }, (_, i) => `ม.1/${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `ม.2/${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `ม.3/${i + 1}`),
]

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name)
  const [classroom, setClassroom] = useState(profile.classroom ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('อัพโหลดรูปไม่สำเร็จ: ' + uploadError.message)
      setAvatarPreview(avatarUrl)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const updates: Partial<Profile> = {
      full_name: fullName,
      phone: phone || null,
      avatar_url: avatarUrl || null,
    }
    if (profile.role === 'student') {
      updates.classroom = classroom || null
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    if (updateError) {
      setError('บันทึกไม่สำเร็จ: ' + updateError.message)
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  const initials = fullName.trim().charAt(0).toUpperCase() || '?'

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 flex-shrink-0 overflow-hidden border-2 border-seam hover:border-rust transition-colors group"
        >
          {avatarPreview ? (
            <Image src={avatarPreview} alt="avatar" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex items-center justify-center w-full h-full bg-parchment-dark font-display text-2xl text-ink-muted">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-parchment text-xs">
            {uploading ? 'กำลังโหลด...' : 'เปลี่ยนรูป'}
          </span>
        </button>
        <div>
          <p className="text-sm font-semibold text-ink">{profile.full_name}</p>
          <p className="text-xs text-ink-muted mt-0.5">{profile.role}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-2 text-xs text-rust hover:text-rust-dark transition-colors disabled:opacity-50"
          >
            {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดรูปภาพ'}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* Full name */}
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">ชื่อ-นามสกุล</label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
        />
      </div>

      {/* Classroom — students only */}
      {profile.role === 'student' && (
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-2">ห้องเรียน</label>
          <select
            value={classroom}
            onChange={e => setClassroom(e.target.value)}
            className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
          >
            <option value="">— เลือกห้องเรียน —</option>
            {classrooms.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-ink-muted mb-2">เบอร์โทรศัพท์</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full bg-parchment-dark border border-seam px-4 py-3 text-base text-ink placeholder-ink-muted focus:outline-none focus:border-rust focus:ring-1 focus:ring-rust transition-colors"
          placeholder="0812345678"
        />
      </div>

      {error && (
        <p className="text-crimson text-sm border border-crimson/20 bg-crimson/5 px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-verdant text-sm border border-verdant/20 bg-verdant/5 px-3 py-2">✓ บันทึกแล้ว</p>
      )}

      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full bg-ink text-parchment py-4 text-base hover:bg-rust transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
      </button>
    </form>
  )
}
