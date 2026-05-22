'use client'

import { useTransition } from 'react'
import { deleteUser } from '../../actions'

export default function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`ลบผู้ใช้ "${name}" ? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return
    startTransition(() => deleteUser(userId))
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-ink-muted hover:text-crimson transition-colors disabled:opacity-50"
    >
      {pending ? '...' : 'ลบ'}
    </button>
  )
}
