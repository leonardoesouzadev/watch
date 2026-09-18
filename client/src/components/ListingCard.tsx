import type { Listing } from '../types'
import { SOURCE_LABEL } from '../sourceLabels'
import { GavelIcon } from './icons'

interface Props {
  listing: Listing
  isNew: boolean
}

function formatPrice(price: Listing['price']): string {
  if (!price) return 'Sem lance/preço'
  const amount = Number(price.value)
  if (Number.isNaN(amount)) return `${price.value} ${price.currency}`
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: price.currency }).format(amount)
  } catch {
    return `${price.value} ${price.currency}`
  }
}

export function ListingCard({ listing, isNew }: Props) {
  const price = formatPrice(listing.price)

  return (
    <a
      href={listing.itemUrl}
      target="_blank"
      rel="noreferrer"
      className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="absolute left-2 top-2 z-10 flex gap-1.5">
        {isNew && (
          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-sm">
            Novo
          </span>
        )}
      </div>
      <span className="absolute right-2 top-2 z-10 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur-sm">
        {SOURCE_LABEL[listing.source] ?? listing.source}
      </span>

      <div className="flex aspect-4/3 items-center justify-center bg-slate-100">
        {listing.image ? (
          <img src={listing.image} alt={listing.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">Sem imagem</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 border-t border-slate-200 p-3.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800">{listing.title}</p>
        <p className="text-xl font-bold text-accent-700">{price}</p>
        {listing.location && <p className="text-xs text-slate-500">{listing.location}</p>}
        {listing.seller && (
          <p className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700">
            <GavelIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{listing.seller}</span>
          </p>
        )}
      </div>
    </a>
  )
}
