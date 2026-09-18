import { useState } from 'react'
import { WATCH_BRANDS } from '../watchFilter'
import { Combobox } from './Combobox'

interface Props {
  keywords: string[]
  selected: string | null
  onAdd: (keyword: string) => void
  onRemove: (keyword: string) => void
  onSelect: (keyword: string) => void
}

const SORTED_BRANDS = [...WATCH_BRANDS].sort((a, b) => a.localeCompare(b, 'pt-BR'))

export function KeywordManager({ keywords, selected, onAdd, onRemove, onSelect }: Props) {
  const [draft, setDraft] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="ex: Rolex Submariner"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
        >
          Adicionar
        </button>
      </form>

      <Combobox options={SORTED_BRANDS} placeholder="Ou busque uma marca…" onSelect={onAdd} />

      <ul className="flex flex-wrap gap-2">
        {keywords.length === 0 && <li className="text-sm text-slate-400">Nenhuma palavra-chave ainda</li>}
        {keywords.map((kw) => {
          const isActive = kw === selected
          return (
            <li
              key={kw}
              className={`flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 transition-colors ${
                isActive ? 'border-accent-600 bg-accent-50' : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
            >
              <button
                onClick={() => onSelect(kw)}
                title={kw}
                className={`max-w-40 truncate text-sm ${
                  isActive ? 'font-semibold text-accent-700' : 'text-slate-700'
                }`}
              >
                {kw}
              </button>
              <button
                onClick={() => onRemove(kw)}
                title="Remover"
                className="rounded-full p-1 text-base leading-none text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
