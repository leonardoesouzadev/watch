import { useMemo, useRef, useState } from 'react'
import { SearchIcon } from './icons'

interface Props {
  options: string[]
  placeholder?: string
  onSelect: (value: string) => void
  maxResults?: number
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function Combobox({ options, placeholder, onSelect, maxResults = 8 }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    const matches = q ? options.filter((o) => normalize(o).includes(q)) : options
    return matches.slice(0, maxResults)
  }, [options, query, maxResults])

  function select(value: string) {
    onSelect(value)
    setQuery('')
    setOpen(false)
    setHighlighted(0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const value = filtered[highlighted]
      if (value) select(value)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
        />
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 && <li className="px-3 py-1.5 text-sm text-slate-400">Nenhuma marca encontrada</li>}
          {filtered.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(option)
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`block w-full truncate px-3 py-1.5 text-left text-sm ${
                  index === highlighted ? 'bg-accent-50 text-accent-700' : 'text-slate-700'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
