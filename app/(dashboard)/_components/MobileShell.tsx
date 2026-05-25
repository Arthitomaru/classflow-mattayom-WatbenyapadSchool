'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import type { Profile } from '@/types/database'

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export default function MobileShell({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // close drawer on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Mobile overlay backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0 md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <Sidebar profile={profile} onMobileClose={() => setOpen(false)} />
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-seam flex-shrink-0"
          style={{ backgroundColor: '#0F1F47' }}
        >
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#E6ECF8' }}
            aria-label="เปิดเมนู"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/school-logo.jpg" alt="" className="w-7 h-7 rounded-lg object-contain bg-white p-0.5" />
            <p className="font-display font-semibold text-[15px]" style={{ color: '#FBBF24' }}>
              Classflow
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
