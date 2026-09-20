import { useCallback, useEffect, useRef, useState } from 'react'
import { KeywordManager } from './components/KeywordManager'
import { ResultsPanel } from './components/ResultsPanel'
import { SourceManager } from './components/SourceManager'
import { SidebarSection } from './components/SidebarSection'
import { Toggle } from './components/Toggle'
import { WatchIcon, SearchIcon, GlobeIcon, RefreshIcon } from './components/icons'
import { searchKeyword } from './api'
import {
  loadKeywords,
  saveKeywords,
  loadSeenIds,
  saveSeenIds,
  clearSeenIds,
  loadDisabledSources,
  saveDisabledSources,
} from './storage'
import { BUILT_IN_SOURCES } from './sourceLabels'
import type { KeywordState } from './types'

const AUTO_REFRESH_MINUTES = 10

function stripSourceFromResults(
  results: Record<string, KeywordState>,
  sourceId: string
): Record<string, KeywordState> {
  const next: Record<string, KeywordState> = {}
  for (const [keyword, keywordState] of Object.entries(results)) {
    if (!keywordState.data) {
      next[keyword] = keywordState
      continue
    }
    const { [sourceId]: _removed, ...remainingSources } = keywordState.data.sources
    next[keyword] = {
      ...keywordState,
      data: {
        ...keywordState.data,
        items: keywordState.data.items.filter((item) => item.source !== sourceId),
        sources: remainingSources,
      },
    }
  }
  return next
}

function App() {
  const [keywords, setKeywords] = useState<string[]>(() => loadKeywords())
  const [selected, setSelected] = useState<string | null>(() => loadKeywords()[0] ?? null)
  const [results, setResults] = useState<Record<string, KeywordState>>({})
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [disabledSources, setDisabledSources] = useState<Set<string>>(() => loadDisabledSources())

  const keywordsRef = useRef(keywords)
  keywordsRef.current = keywords
  const disabledSourcesRef = useRef(disabledSources)
  disabledSourcesRef.current = disabledSources

  const runSearch = useCallback(async (keyword: string) => {
    setResults((prev) => ({
      ...prev,
      [keyword]: {
        loading: true,
        error: null,
        data: prev[keyword]?.data ?? null,
        newIds: prev[keyword]?.newIds ?? new Set(),
        lastFetchedAt: prev[keyword]?.lastFetchedAt ?? null,
      },
    }))

    try {
      const enabledBuiltIn = BUILT_IN_SOURCES.filter((s) => !disabledSourcesRef.current.has(s.id)).map((s) => s.id)
      const data = await searchKeyword(keyword, { sources: enabledBuiltIn })

      const seen = loadSeenIds(keyword)
      const isFirstFetch = seen.size === 0
      const currentIds = data.items.map((item) => item.id)
      const newIds = isFirstFetch ? new Set<string>() : new Set(currentIds.filter((id) => !seen.has(id)))

      const updatedSeen = new Set(seen)
      currentIds.forEach((id) => updatedSeen.add(id))
      saveSeenIds(keyword, updatedSeen)

      setResults((prev) => ({
        ...prev,
        [keyword]: { loading: false, error: null, data, newIds, lastFetchedAt: Date.now() },
      }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [keyword]: {
          loading: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
          data: prev[keyword]?.data ?? null,
          newIds: prev[keyword]?.newIds ?? new Set(),
          lastFetchedAt: prev[keyword]?.lastFetchedAt ?? null,
        },
      }))
    }
  }, [])

  function handleAdd(keyword: string) {
    setKeywords((prev) => {
      if (prev.includes(keyword)) return prev
      const next = [...prev, keyword]
      saveKeywords(next)
      return next
    })
    setSelected(keyword)
    void runSearch(keyword)
  }

  function handleSelect(keyword: string) {
    setSelected(keyword)
    void runSearch(keyword)
  }

  function handleRemove(keyword: string) {
    setKeywords((prev) => {
      const next = prev.filter((k) => k !== keyword)
      saveKeywords(next)
      return next
    })
    clearSeenIds(keyword)
    setResults((prev) => {
      const next = { ...prev }
      delete next[keyword]
      return next
    })
    setSelected((prev) => (prev === keyword ? null : prev))
  }

  function refreshSelected() {
    if (selected) void runSearch(selected)
  }

  function handleToggleBuiltIn(id: string) {
    const turningOff = !disabledSources.has(id)
    setDisabledSources((prev) => {
      const next = new Set(prev)
      if (turningOff) next.add(id)
      else next.delete(id)
      saveDisabledSources(next)
      return next
    })
    if (turningOff) {
      setResults((prev) => stripSourceFromResults(prev, id))
    } else {
      refreshSelected()
    }
  }

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      keywordsRef.current.forEach((kw) => void runSearch(kw))
    }, AUTO_REFRESH_MINUTES * 60 * 1000)
    return () => clearInterval(id)
  }, [autoRefresh, runSearch])

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-100 md:grid-cols-[300px_1fr]">
      <aside className="flex flex-col border-b border-slate-200 bg-slate-50 md:border-b-0 md:border-r">
        <div className="bg-linear-to-br from-accent-600 to-accent-700 px-6 py-6 text-white">
          <div className="flex items-center gap-2.5">
            <WatchIcon className="h-6 w-6" />
            <h1 className="text-lg font-bold tracking-tight">Watch Tracker</h1>
          </div>
          <p className="mt-1 text-xs text-accent-100">Monitor de leilões de relógios no Brasil</p>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <SidebarSection title="Buscar" icon={<SearchIcon className="h-4 w-4" />}>
            <KeywordManager
              keywords={keywords}
              selected={selected}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onSelect={handleSelect}
            />
          </SidebarSection>

          <SidebarSection title="Fontes" icon={<GlobeIcon className="h-4 w-4" />}>
            <SourceManager
              builtInSources={BUILT_IN_SOURCES}
              disabledSources={disabledSources}
              onToggleBuiltIn={handleToggleBuiltIn}
            />
          </SidebarSection>

          <div className="mt-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <RefreshIcon className="h-4 w-4 shrink-0 text-accent-600" />
            <Toggle
              checked={autoRefresh}
              onChange={() => setAutoRefresh((prev) => !prev)}
              label={`Atualizar automaticamente a cada ${AUTO_REFRESH_MINUTES} min`}
              labelClassName="text-xs leading-snug text-slate-600"
            />
          </div>
        </div>
      </aside>

      <main className="min-w-0 p-6 md:p-10">
        <ResultsPanel keyword={selected} state={selected ? results[selected] : undefined} />
      </main>
    </div>
  )
}

export default App
