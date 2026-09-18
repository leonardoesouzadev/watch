import { useEffect, useState } from 'react'
import type { KeywordState } from '../types'
import { ListingCard } from './ListingCard'
import { SOURCE_LABEL } from '../sourceLabels'

interface Props {
  keyword: string | null
  state: KeywordState | undefined
}

const PAGE_SIZE = 12

type SortOrder = 'none' | 'price-asc' | 'price-desc'

export function ResultsPanel({ keyword, state }: Props) {
  const allItems = state?.data?.items ?? []
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    setPage(1)
  }, [keyword, state?.data])

  useEffect(() => {
    setPage(1)
  }, [sortOrder, minPrice, maxPrice])

  const min = minPrice.trim() === '' ? null : Number(minPrice)
  const max = maxPrice.trim() === '' ? null : Number(maxPrice)

  const items = allItems
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
          {state?.data && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {Object.entries(state.data.sources).map(([name, s]) => (
                <span
                  key={name}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s?.error ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {SOURCE_LABEL[name] ?? name}: {s?.error ? 'erro' : `${s?.total ?? 0} anúncios`}
                </span>
              ))}
            </div>
          )}
          {state?.lastFetchedAt && (
            <p className="mt-1.5 text-xs text-slate-400">
              Atualizado às {new Date(state.lastFetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {allItems.length > 0 && (
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-3.5">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Preço mín. (R$)
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-accent-600 focus:outline-none"
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
              className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-accent-600 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Ordenar por
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-accent-600 focus:outline-none"
            >
              <option value="none">Relevância</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
          </label>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => {
                setMinPrice('')
                setMaxPrice('')
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-accent-600 hover:bg-accent-50"
            >
              Limpar faixa
            </button>
          )}
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
          {allItems.length > 0
            ? 'Nenhum anúncio dentro da faixa de preço selecionada.'
            : 'Nenhum anúncio encontrado para essa palavra-chave ainda.'}
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
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
