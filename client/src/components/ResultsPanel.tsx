import { useEffect, useState } from 'react'
import type { KeywordState } from '../types'
import { ListingCard } from './ListingCard'
import { SOURCE_LABEL } from '../sourceLabels'
import { isLikelyWatch } from '../watchFilter'
import { normalize } from '../normalize'
import { Toggle } from './Toggle'
import { SearchIcon, CheckIcon } from './icons'
import { Combobox } from './Combobox'

interface Props {
  keyword: string | null
  state: KeywordState | undefined
}

const PAGE_SIZE = 20

type SortOrder = 'none' | 'price-asc' | 'price-desc'

const SORT_OPTIONS: Record<SortOrder, string> = {
  none: 'Relevância',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
}
const SORT_LABEL_TO_ORDER: Record<string, SortOrder> = {
  Relevância: 'none',
  'Menor preço': 'price-asc',
  'Maior preço': 'price-desc',
}

const fieldClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/25'

export function ResultsPanel({ keyword, state }: Props) {
  const allItems = state?.data?.items ?? []
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [onlyWatches, setOnlyWatches] = useState(true)
  const [onlyNew, setOnlyNew] = useState(false)
  const [titleQuery, setTitleQuery] = useState('')
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set())

  useEffect(() => {
    setPage(1)
  }, [keyword, state?.data])

  useEffect(() => {
    setPage(1)
  }, [sortOrder, minPrice, maxPrice, onlyWatches, onlyNew, titleQuery, hiddenSources])

  const min = minPrice.trim() === '' ? null : Number(minPrice)
  const max = maxPrice.trim() === '' ? null : Number(maxPrice)
  const normalizedTitleQuery = normalize(titleQuery.trim())

  const watchFilteredItems = onlyWatches ? allItems.filter((item) => isLikelyWatch(item.title)) : allItems

  const items = watchFilteredItems
    .filter((item) => !normalizedTitleQuery || normalize(item.title).includes(normalizedTitleQuery))
    .filter((item) => !hiddenSources.has(item.source))
    .filter((item) => !onlyNew || (state?.newIds.has(item.id) ?? false))
    .filter((item) => {
      if (min === null && max === null) return true
      const value = item.price ? Number(item.price.value) : NaN
      if (Number.isNaN(value)) return false
      if (min !== null && value < min) return false
      if (max !== null && value > max) return false
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'none') return 0
      const av = a.price ? Number(a.price.value) : NaN
      const bv = b.price ? Number(b.price.value) : NaN
      if (Number.isNaN(av) && Number.isNaN(bv)) return 0
      if (Number.isNaN(av)) return 1
      if (Number.isNaN(bv)) return -1
      return sortOrder === 'price-asc' ? av - bv : bv - av
    })

  if (!keyword) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Adicione uma palavra-chave e selecione-a para ver os lotes de leilão encontrados.
      </div>
    )
  }

  const availableSources = state?.data ? Object.keys(state.data.sources) : []
  const hasActiveFilters =
    !onlyWatches || onlyNew || minPrice !== '' || maxPrice !== '' || sortOrder !== 'none' || titleQuery !== '' || hiddenSources.size > 0

  function toggleSource(name: string) {
    setHiddenSources((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function clearFilters() {
    setOnlyWatches(true)
    setOnlyNew(false)
    setMinPrice('')
    setMaxPrice('')
    setSortOrder('none')
    setTitleQuery('')
    setHiddenSources(new Set())
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-baseline gap-2 text-xl font-bold text-slate-900">
            {keyword}
            {state?.loading && <span className="text-xs font-medium text-slate-400">Buscando…</span>}
          </h2>
          {state?.lastFetchedAt && (
            <p className="mt-1.5 text-xs text-slate-400">
              Atualizado às {new Date(state.lastFetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {allItems.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Buscar no título</label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  placeholder="ex: automático, dourado…"
                  className={`${fieldClass} w-full pl-8`}
                />
              </div>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Preço mín. (R$)
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className={`${fieldClass} w-28`}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              Preço máx. (R$)
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Sem limite"
                className={`${fieldClass} w-28`}
              />
            </label>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-slate-500">Ordenar por</label>
              <Combobox
                options={Object.values(SORT_OPTIONS)}
                value={SORT_OPTIONS[sortOrder]}
                onSelect={(label) => setSortOrder(SORT_LABEL_TO_ORDER[label] ?? 'none')}
                selectOnly
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-accent-600 hover:bg-accent-50"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
            <Toggle checked={onlyWatches} onChange={() => setOnlyWatches((prev) => !prev)} label="Somente relógios" />
            <Toggle checked={onlyNew} onChange={() => setOnlyNew((prev) => !prev)} label="Somente novos" />

            {availableSources.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Fonte:</span>
                {availableSources.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleSource(name)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      hiddenSources.has(name)
                        ? 'border-slate-200 bg-slate-50 text-slate-400'
                        : 'border-accent-600 bg-accent-50 text-accent-700'
                    }`}
                  >
                    {!hiddenSources.has(name) && <CheckIcon className="h-3 w-3" />}
                    {SOURCE_LABEL[name] ?? name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          Erro: {state.error}
        </p>
      )}
      {state?.data &&
        Object.entries(state.data.sources)
          .filter(([, s]) => s?.error)
          .map(([name, s]) => (
            <p key={name} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {SOURCE_LABEL[name] ?? name}: {s?.error}
            </p>
          ))}

      {!state?.loading && items.length === 0 && !state?.error && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {allItems.length === 0
            ? 'Nenhum anúncio encontrado para essa palavra-chave ainda.'
            : 'Nenhum anúncio encontrado com os filtros atuais. Tente ajustar ou limpar os filtros.'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {pageItems.map((item) => (
          <ListingCard key={item.id} listing={item} isNew={state?.newIds.has(item.id) ?? false} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-4 border-t border-slate-200 pt-5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-accent-600 hover:bg-accent-50 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white"
          >
            ← Anterior
          </button>
          <span className="text-sm text-slate-500">
            Página {currentPage} de {totalPages} · {items.length} anúncios
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-accent-600 hover:bg-accent-50 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
