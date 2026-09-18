import { useCallback, useEffect, useRef, useState } from 'react'
import { KeywordManager } from './components/KeywordManager'
import { ResultsPanel } from './components/ResultsPanel'
import { SourceManager } from './components/SourceManager'
import { SidebarSection } from './components/SidebarSection'
import { Toggle } from './components/Toggle'
import { WatchIcon, TagIcon, GlobeIcon, RefreshIcon } from './components/icons'
import { searchKeyword } from './api'
import {
  loadKeywords,
  saveKeywords,
  loadSeenIds,
  saveSeenIds,
  clearSeenIds,
  loadDisabledSources,
  saveDisabledSources,
  loadCustomSources,
  saveCustomSources,
} from './storage'
import { BUILT_IN_SOURCES } from './sourceLabels'
import type { CustomSource, KeywordState } from './types'

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
  const [customSources, setCustomSources] = useState<CustomSource[]>(() => loadCustomSources())

  const keywordsRef = useRef(keywords)
  keywordsRef.current = keywords
  const disabledSourcesRef = useRef(disabledSources)
  disabledSourcesRef.current = disabledSources
  const customSourcesRef = useRef(customSources)
  customSourcesRef.current = customSources

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
      const enabledCustom = customSourcesRef.current.filter((s) => s.enabled)
      const data = await searchKeyword(keyword, { sources: enabledBuiltIn, customSources: enabledCustom })

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

  function handleAddCustomSource(source: CustomSource) {
    setCustomSources((prev) => {
      const next = [...prev, source]
      saveCustomSources(next)
      return next
    })
    refreshSelected()
  }

  function handleToggleCustomSource(id: string) {
    const source = customSources.find((s) => s.id === id)
    const turningOff = source?.enabled ?? false
    setCustomSources((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
      saveCustomSources(next)
      return next
    })
    if (turningOff) {
      setResults((prev) => stripSourceFromResults(prev, id))
    } else {
      refreshSelected()
    }
  }

  function handleRemoveCustomSource(id: string) {
    setCustomSources((prev) => {
      const next = prev.filter((s) => s.id !== id)
      saveCustomSources(next)
      return next
    })
    setResults((prev) => stripSourceFromResults(prev, id))
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
          <SidebarSection title="Palavras-chave" icon={<TagIcon className="h-4 w-4" />}>
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
              customSources={customSources}
              onAddCustomSource={handleAddCustomSource}
              onToggleCustomSource={handleToggleCustomSource}
              onRemoveCustomSource={handleRemoveCustomSource}
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
