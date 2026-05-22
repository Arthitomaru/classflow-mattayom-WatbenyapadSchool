'use client'

import Link from 'next/link'
import { useState } from 'react'

export type CourseWithProgress = {
  id: string
  code: string
  name: string
  teacher: string | null
  hue: number
  label: string
  progress: number
  assignmentCount: number
}

function IconPaper({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /></svg>
}
function IconArrow({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
}

type FilterId = 'all' | 'active' | 'done' | 'new'

export default function CourseGrid({ courses }: { courses: CourseWithProgress[] }) {
  const [filter, setFilter] = useState<FilterId>('all')

  const counts: Record<FilterId, number> = {
    all: courses.length,
    active: courses.filter(c => c.progress > 0 && c.progress < 100).length,
    done: courses.filter(c => c.progress === 100).length,
    new: courses.filter(c => c.progress === 0).length,
  }

  const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'all',    label: `ทั้งหมด · ${counts.all}` },
    { id: 'active', label: `กำลังเรียน · ${counts.active}` },
    { id: 'done',   label: `สอบไปแล้ว · ${counts.done}` },
    { id: 'new',    label: `ยังไม่เริ่ม · ${counts.new}` },
  ]

  const filtered =
    filter === 'all'    ? courses :
    filter === 'active' ? courses.filter(c => c.progress > 0 && c.progress < 100) :
    filter === 'done'   ? courses.filter(c => c.progress === 100) :
                          courses.filter(c => c.progress === 0)

  return (
    <>
      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-4 py-2 rounded-full text-[12px] font-medium transition-colors"
            style={
              filter === f.id
                ? { background: '#0B1F44', color: '#FFFFFF' }
                : { background: '#FFFFFF', color: '#5C6B8A', border: '1px solid #E1E8F3' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid or empty */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-seam p-16 text-center"
          style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}>
          <p className="text-[14px] text-ink-muted">ไม่มีวิชาในหมวดนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/student/courses/${c.id}`}
              className="block rounded-2xl bg-white border border-seam overflow-hidden hover:-translate-y-1 transition-transform press"
              style={{ boxShadow: '0 1px 0 rgba(11,31,68,.02), 0 8px 24px -16px rgba(11,31,68,.18)' }}
            >
              {/* Gradient header */}
              <div
                className="h-24 relative"
                style={{ background: `linear-gradient(135deg, hsl(${c.hue} 90% 88%) 0%, hsl(${c.hue} 80% 70%) 100%)` }}
              >
                <div className="absolute inset-0 dot-burst opacity-30" />
                {/* Glyph bump-down */}
                <div
                  className="absolute -bottom-7 left-5 w-14 h-14 rounded-2xl flex items-center justify-center font-display font-semibold text-[22px]"
                  style={{
                    background: '#FFFFFF',
                    color: `hsl(${c.hue} 60% 35%)`,
                    boxShadow: '0 8px 18px -8px rgba(0,0,0,.15)',
                  }}
                >
                  {c.label}
                </div>
                {/* Code badge */}
                <span
                  className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,.85)', color: `hsl(${c.hue} 60% 25%)` }}
                >
                  {c.code}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 pt-9">
                <p className="font-display font-semibold text-[16px] mb-1 text-ink">{c.name}</p>
                <p className="text-[12px] mb-4 text-ink-muted">{c.teacher ? `ครู${c.teacher}` : '—'}</p>

                {/* Progress */}
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-ink-muted">ความก้าวหน้า</span>
                  <span className="font-medium tabular-nums text-ink">{c.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E1E8F3' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.progress}%`, background: `hsl(${c.hue} 70% 55%)` }}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                    <IconPaper className="w-3.5 h-3.5" />
                    {c.assignmentCount} งาน
                  </div>
                  <span className="text-[12px] font-medium flex items-center gap-1 text-primary">
                    เข้าวิชา <IconArrow className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
