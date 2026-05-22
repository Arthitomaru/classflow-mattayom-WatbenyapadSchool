'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const roles = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'teacher', label: 'ครู' },
  { value: 'student', label: 'นักเรียน' },
  { value: 'admin', label: 'Admin' },
]

export default function UsersFilter({
  currentRole, currentSearch,
}: { currentRole?: string; currentSearch?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(currentSearch ?? '')

  function navigate(role: string, q: string) {
    const params = new URLSearchParams()
    if (role && role !== 'all') params.set('role', role)
    if (q) params.set('q', q)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1">
        {roles.map(r => (
          <button key={r.value}
            onClick={() => navigate(r.value, search)}
            className={cn(
              'px-3 py-1.5 text-xs border transition-colors',
              (currentRole ?? 'all') === r.value
                ? 'bg-ink text-parchment border-ink'
                : 'border-seam text-ink-muted hover:border-rust hover:text-rust'
            )}>
            {r.label}
          </button>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); navigate(currentRole ?? 'all', search) }}
        className="flex gap-2 flex-1 max-w-xs">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรืออีเมล"
          className="flex-1 bg-parchment-dark border border-seam px-3 py-1.5 text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-rust"
        />
        <button type="submit"
          className="bg-ink text-parchment px-3 py-1.5 text-xs hover:bg-rust transition-colors">
          ค้นหา
        </button>
      </form>
    </div>
  )
}
