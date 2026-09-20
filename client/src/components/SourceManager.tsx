import { Toggle } from './Toggle'

interface BuiltInSource {
  id: string
  name: string
}

interface Props {
  builtInSources: BuiltInSource[]
  disabledSources: Set<string>
  onToggleBuiltIn: (id: string) => void
}

export function SourceManager({ builtInSources, disabledSources, onToggleBuiltIn }: Props) {
  return (
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
    </ul>
  )
}
