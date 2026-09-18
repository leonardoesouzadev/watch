import type { ReactNode } from 'react'

interface Props {
  checked: boolean
  onChange: () => void
  label: ReactNode
  labelClassName?: string
}

export function Toggle({ checked, onChange, label, labelClassName }: Props) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2.5">
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-accent-600" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      <span className={labelClassName ?? 'truncate text-sm text-slate-700'}>{label}</span>
    </label>
  )
}
