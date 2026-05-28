'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { cn } from '@/lib/utils'

// ── Inline SVG icons ──────────────────────────────────────────

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

function IconPaper({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  )
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M16 20a5 5 0 0 1 6-4.9" />
    </svg>
  )
}

function IconQuiz({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.3 1-1.3 2" />
      <circle cx="12" cy="17" r=".6" fill="currentColor" />
    </svg>
  )
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  )
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  )
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Nav config ────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  Icon: React.FC<{ className?: string }>
  exact?: boolean
  hasBadge?: boolean
}

const teacherNav: NavItem[] = [
  { href: '/teacher', label: 'ภาพรวม', Icon: IconHome, exact: true },
  { href: '/teacher/courses', label: 'วิชาของฉัน', Icon: IconBook },
  { href: '/teacher/assignments', label: 'ตรวจงาน', Icon: IconPaper, hasBadge: true },
]

const studentNav: NavItem[] = [
  { href: '/student', label: 'ภาพรวม', Icon: IconHome, exact: true },
  { href: '/student/courses', label: 'รายวิชา', Icon: IconBook },
  { href: '/student/assignments', label: 'งานทั้งหมด', Icon: IconPaper, hasBadge: true },
]

const adminNav: NavItem[] = [
  { href: '/admin', label: 'แดชบอร์ด', Icon: IconHome, exact: true },
  { href: '/admin/users', label: 'จัดการผู้ใช้', Icon: IconUsers },
  { href: '/teacher/courses', label: 'จัดการวิชา', Icon: IconBook },
  { href: '/admin/submissions', label: 'งานที่ส่ง', Icon: IconPaper },
  { href: '/admin/quizzes', label: 'ข้อสอบ', Icon: IconQuiz },
]

// ── Component ─────────────────────────────────────────────────

export default function Sidebar({ profile, onMobileClose }: { profile: Profile; onMobileClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [badgeCount, setBadgeCount] = useState(0)

  const nav = profile.role === 'teacher' ? teacherNav : profile.role === 'admin' ? adminNav : studentNav
  const roleLabel = profile.role === 'teacher' ? 'ครู' : profile.role === 'admin' ? 'ผู้ดูแล' : 'นักเรียน'
  const initial = profile.full_name.charAt(0).toUpperCase()

  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    if (profile.role === 'teacher') {
      supabase
        .from('submissions')
        .select('id, assignments!inner(teacher_id)', { count: 'exact', head: true })
        .eq('status', 'submitted')
        .eq('assignments.teacher_id', profile.id)
        .then(({ count }) => setBadgeCount(count ?? 0))
    } else if (profile.role === 'student') {
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', profile.id)
        .eq('status', 'submitted')
        .then(({ count }) => setBadgeCount(count ?? 0))
    }
  }, [profile.id, profile.role])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setNotifCount(count ?? 0))
  }, [profile.id])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="w-[260px] flex-shrink-0 flex flex-col h-full"
      style={{ backgroundColor: '#0F1F47', color: '#E6ECF8' }}
    >
      {/* ── Brand ── */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-3">
        <div className="w-11 h-11 bg-white rounded-2xl flex-shrink-0 overflow-hidden p-1"
          style={{ boxShadow: '0 4px 10px -4px rgba(0,0,0,.35)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/school-logo.jpg"
            alt="ตราโรงเรียน"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-[18px] leading-none" style={{ color: '#FBBF24' }}>
            Classflow
          </p>
          <p className="text-[10px] tracking-[0.25em] uppercase mt-1" style={{ color: '#9BA9C8' }}>
            for mathayom
          </p>
        </div>
        {/* Close button — mobile only */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg transition-opacity opacity-60 hover:opacity-100 flex-shrink-0"
            style={{ color: '#E6ECF8' }}
            aria-label="ปิดเมนู"
          >
            <IconX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Role badge ── */}
      <div className="px-6 pb-5">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(251,191,36,.16)', color: '#FBBF24' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
          {roleLabel}
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: '#9BA9C8', opacity: 0.7 }}>
          เมนู
        </p>
        <ul className="space-y-1">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 text-[14px]',
                    active ? '' : 'hover:bg-white/5'
                  )}
                  style={
                    active
                      ? { background: 'rgba(251,191,36,.16)', color: '#FBBF24' }
                      : { color: '#E6ECF8' }
                  }
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full"
                      style={{ background: '#FBBF24' }}
                    />
                  )}
                  <item.Icon className={cn('w-[18px] h-[18px] flex-shrink-0', !active && 'opacity-60')} />
                  <span className="flex-1">{item.label}</span>
                  {item.hasBadge && badgeCount > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: '#F59E0B', color: '#1B1100' }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* ── Quick links ── */}
        <p className="px-3 mt-7 mb-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: '#9BA9C8', opacity: 0.7 }}>
          ลัด
        </p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/notifications"
              className="relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors hover:bg-white/5"
              style={{ color: '#9BA9C8' }}
            >
              <IconBell className="w-4 h-4" />
              การแจ้งเตือน
              {notifCount > 0 && (
                <span
                  className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: '#EF4444', color: '#fff' }}
                >
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors hover:bg-white/5"
              style={{ color: '#9BA9C8' }}
            >
              <IconUser className="w-4 h-4" />
              โปรไฟล์ของฉัน
            </Link>
          </li>
          <li>
            <Link
              href="/change-password"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors hover:bg-white/5"
              style={{ color: '#9BA9C8' }}
            >
              <IconPaper className="w-4 h-4" />
              เปลี่ยนรหัสผ่าน
            </Link>
          </li>
        </ul>
      </nav>

      {/* ── User chip ── */}
      <div className="m-3 mt-2">
        <div
          className="p-3 rounded-2xl flex items-center gap-3 transition-colors hover:bg-white/5"
          style={{ background: 'rgba(255,255,255,.04)' }}
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-[15px] flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FBBF24, #D97706)', color: '#1B1100' }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate" style={{ color: '#E6ECF8' }}>
              {profile.full_name}
            </p>
            <p className="text-[11px] truncate" style={{ color: '#9BA9C8' }}>
              {roleLabel}{profile.classroom ? ` · ${profile.classroom}` : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="ออกจากระบบ"
            className="transition-opacity opacity-40 hover:opacity-100 flex-shrink-0"
            style={{ color: '#E6ECF8' }}
          >
            <IconLogout className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
