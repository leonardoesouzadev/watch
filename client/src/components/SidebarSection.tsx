import type { ReactNode } from 'react'

interface Props {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
}

export function SidebarSection({ title, icon, children, className }: Props) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className ?? ''}`}>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span className="text-accent-600">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}
