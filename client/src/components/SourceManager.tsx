import { useState } from 'react'
import type { CustomSource } from '../types'
import { Toggle } from './Toggle'

interface BuiltInSource {
  id: string
  name: string
}

interface Props {
  builtInSources: BuiltInSource[]
  disabledSources: Set<string>
  onToggleBuiltIn: (id: string) => void
  customSources: CustomSource[]
  onAddCustomSource: (source: CustomSource) => void
  onToggleCustomSource: (id: string) => void
  onRemoveCustomSource: (id: string) => void
}

const EMPTY_FORM = {
  name: '',
  searchUrl: '',
  itemSelector: '',
  titleSelector: '',
  priceSelector: '',
  imageSelector: '',
  linkSelector: '',
}

const inputClass =
  'rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/25'

export function SourceManager({
  builtInSources,
  disabledSources,
  onToggleBuiltIn,
  customSources,
  onAddCustomSource,
  onToggleCustomSource,
  onRemoveCustomSource,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setAdvanced(false)
    setShowForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = form.name.trim()
    const searchUrl = form.searchUrl.trim()

    if (!name || !searchUrl) {
      setFormError('Preencha o nome e a URL de busca.')
      return
    }
    if (!searchUrl.includes('{q}')) {
      setFormError('A URL de busca precisa conter "{q}" no lugar da palavra-chave.')
      return
    }

    onAddCustomSource({
      id: `custom-${Date.now()}`,
      name,
      searchUrl,
      itemSelector: form.itemSelector.trim(),
      titleSelector: form.titleSelector.trim(),
      priceSelector: form.priceSelector.trim(),
      imageSelector: form.imageSelector.trim(),
      linkSelector: form.linkSelector.trim(),
      enabled: true,
    })
    resetForm()
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {builtInSources.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2">
            <Toggle
              checked={!disabledSources.has(s.id)}
              onChange={() => onToggleBuiltIn(s.id)}
              label={s.name}
              labelClassName="max-w-40 truncate text-sm text-slate-700"
            />
          </li>
        ))}

        {customSources.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2">
            <Toggle
              checked={s.enabled}
              onChange={() => onToggleCustomSource(s.id)}
              label={<span title={s.searchUrl}>{s.name}</span>}
              labelClassName="max-w-40 truncate text-sm text-slate-700"
            />
            <button
              onClick={() => onRemoveCustomSource(s.id)}
              title="Remover fonte"
              className="shrink-0 rounded-full p-1 text-base leading-none text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {!showForm && (
        <button
          type="button"
          className="text-left text-sm font-semibold text-accent-600 transition-colors hover:text-accent-700 hover:underline"
          onClick={() => setShowForm(true)}
        >
          + Nova fonte personalizada
        </button>
      )}

      {showForm && (
        <form
          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
          onSubmit={handleSubmit}
        >
          <input
            placeholder="Nome (ex: Sodré Santoro)"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="URL de busca com {q} (ex: https://site.com/busca?termo={q})"
            value={form.searchUrl}
            onChange={(e) => updateField('searchUrl', e.target.value)}
            className={inputClass}
          />
          <p className="text-xs leading-relaxed text-slate-500">
            A gente tenta identificar os anúncios sozinho a partir dos preços na página. Se não funcionar bem, use o
            modo avançado.
          </p>

          {!advanced && (
            <button
              type="button"
              className="text-left text-sm font-semibold text-accent-600 transition-colors hover:text-accent-700 hover:underline"
              onClick={() => setAdvanced(true)}
            >
              Modo avançado (seletores CSS)
            </button>
          )}

          {advanced && (
            <>
              <input
                placeholder="Seletor CSS do item/card (ex: .product-card)"
                value={form.itemSelector}
                onChange={(e) => updateField('itemSelector', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Seletor do título (opcional, ex: h3)"
                value={form.titleSelector}
                onChange={(e) => updateField('titleSelector', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Seletor do preço (opcional, ex: .price)"
                value={form.priceSelector}
                onChange={(e) => updateField('priceSelector', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Seletor da imagem (opcional, ex: img)"
                value={form.imageSelector}
                onChange={(e) => updateField('imageSelector', e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Seletor do link (opcional, se o card já não for um <a>)"
                value={form.linkSelector}
                onChange={(e) => updateField('linkSelector', e.target.value)}
                className={inputClass}
              />
              <p className="text-xs leading-relaxed text-slate-500">
                Deixe o seletor do item em branco pra voltar pra detecção automática.
              </p>
            </>
          )}

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-700"
            >
              Adicionar fonte
            </button>
            <button
              type="button"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              onClick={resetForm}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
