import { useMemo, useRef, useState } from 'react'
import { SearchIcon, ChevronDownIcon, CheckIcon } from './icons'
import { normalize } from '../normalize'

interface Props {
  options: string[]
  placeholder?: string
  onSelect: (value: string) => void
  maxResults?: number
  /** Lets Enter (or a dedicated row) add whatever was typed, even if it matches no option. */
  allowFreeText?: boolean
  /** Closed-set mode: renders as a click-to-open dropdown trigger instead of a search input. */
  selectOnly?: boolean
  /** Currently selected value, shown on the trigger in selectOnly mode. */
  value?: string
  className?: string
}

export function Combobox({
  options,
  placeholder,
  onSelect,
  maxResults = 8,
  allowFreeText = false,
  selectOnly = false,
  value,
  className,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const trimmedQuery = query.trim()

  const filtered = useMemo(() => {
    if (selectOnly) return options.slice(0, maxResults)
    const q = normalize(trimmedQuery)
    const matches = q ? options.filter((o) => normalize(o).includes(q)) : options
    return matches.slice(0, maxResults)
  }, [options, trimmedQuery, maxResults, selectOnly])

  const showFreeText =
    allowFreeText &&
    !selectOnly &&
    trimmedQuery !== '' &&
    !filtered.some((o) => normalize(o) === normalize(trimmedQuery))
  const rowCount = filtered.length + (showFreeText ? 1 : 0)

  function select(next: string) {
    onSelect(next)
    setQuery('')
    setOpen(false)
    setHighlighted(0)
  }

  function openList() {
    const currentIndex = value ? filtered.findIndex((o) => o === value) : -1
    setHighlighted(currentIndex >= 0 ? currentIndex : 0)
    setOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      e.preventDefault()
      openList()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (rowCount > 0) setHighlighted((prev) => Math.min(prev + 1, rowCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (rowCount > 0) setHighlighted((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted < filtered.length && filtered[highlighted]) {
        select(filtered[highlighted])
      } else if (showFreeText) {
        select(trimmedQuery)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      triggerRef.current?.blur()
    }
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="relative">
        {selectOnly ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => (open ? setOpen(false) : openList())}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            className="w-full truncate rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-left text-sm text-slate-800 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
          >
            {value || placeholder}
          </button>
        ) : (
          <>
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
          </>
        )}
        {selectOnly && (
          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 && !showFreeText && (
            <li className="px-3 py-1.5 text-sm text-slate-400">Nenhuma marca encontrada</li>
          )}
          {filtered.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(option)
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`flex w-full items-center gap-2 truncate px-3 py-1.5 text-left text-sm ${
                  index === highlighted ? 'bg-accent-50 text-accent-700' : 'text-slate-700'
                }`}
              >
                {selectOnly && (
                  <CheckIcon
                    className={`h-3.5 w-3.5 shrink-0 ${option === value ? 'opacity-100' : 'opacity-0'}`}
                  />
                )}
                <span className="truncate">{option}</span>
              </button>
            </li>
          ))}
          {showFreeText && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(trimmedQuery)
                }}
                onMouseEnter={() => setHighlighted(filtered.length)}
                className={`block w-full truncate px-3 py-1.5 text-left text-sm font-medium ${
                  filtered.length === highlighted ? 'bg-accent-50 text-accent-700' : 'text-accent-600'
                }`}
              >
                Adicionar “{trimmedQuery}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
