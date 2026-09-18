import { useEffect, useState } from 'react'
import type { KeywordState } from '../types'
import { ListingCard } from './ListingCard'
import { SOURCE_LABEL } from '../sourceLabels'

interface Props {
  keyword: string | null
  state: KeywordState | undefined
}

const PAGE_SIZE = 12

export function ResultsPanel({ keyword, state }: Props) {
  const items = state?.data?.items ?? []
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [keyword, state?.data])

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
          Nenhum anúncio encontrado para essa palavra-chave ainda.
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
