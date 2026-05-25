'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import type { Notification } from '@/types/database'
import { markAsRead, markAllRead } from '../actions'

const typeIcon: Record<Notification['type'], string> = {
  assignment_created: '📝',
  content_added: '📚',
  quiz_open: '📋',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'เมื่อกี้'
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} วันที่แล้ว`
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

function NotificationItem({ n }: { n: Notification }) {
  const [, startTransition] = useTransition()
  const icon = typeIcon[n.type] ?? '🔔'

  function handleRead() {
    if (!n.is_read) {
      startTransition(() => markAsRead(n.id))
    }
  }

  const inner = (
    <div
      onClick={handleRead}
      className={`flex gap-3 px-5 py-4 border-b border-seam-light transition-colors cursor-pointer
        ${n.is_read ? 'bg-parchment opacity-60 hover:opacity-80' : 'bg-white hover:bg-rust-subtle'}`}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${n.is_read ? 'text-ink-muted' : 'text-ink font-medium'}`}>
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs text-ink-muted mt-0.5 truncate">{n.body}</p>
        )}
        <p className="text-[11px] text-ink-muted mt-1">{timeAgo(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <span className="w-2 h-2 rounded-full bg-rust flex-shrink-0 mt-1.5" />
      )}
    </div>
  )

  return n.link ? (
    <Link href={n.link} className="block">{inner}</Link>
  ) : (
    <div>{inner}</div>
  )
}

export default function NotificationList({
  notifications,
  hasUnread,
}: {
  notifications: Notification[]
  hasUnread: boolean
}) {
  const [, startTransition] = useTransition()

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 text-ink-muted">
        <span className="text-4xl block mb-3">🔔</span>
        <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
      </div>
    )
  }

  return (
    <div>
      {hasUnread && (
        <div className="px-5 py-3 border-b border-seam flex justify-end">
          <button
            onClick={() => startTransition(() => markAllRead())}
            className="text-xs text-rust hover:text-rust-dark transition-colors"
          >
            ทำเครื่องหมายอ่านทั้งหมด
          </button>
        </div>
      )}
      <div>
        {notifications.map(n => (
          <NotificationItem key={n.id} n={n} />
        ))}
      </div>
    </div>
  )
}
