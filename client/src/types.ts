export type ListingSource = string

export interface Listing {
  id: string
  title: string
  price: { value: string; currency: string } | null
  image: string | null
  condition: string | null
  itemUrl: string
  seller: string | null
  location: string | null
  buyingOptions: string[]
  source: ListingSource
}

export interface SourceStatus {
  total: number
  error: string | null
}

export interface SearchResult {
  query: string
  sources: Partial<Record<ListingSource, SourceStatus>>
  items: Listing[]
}

export interface KeywordState {
  loading: boolean
  error: string | null
  data: SearchResult | null
  newIds: Set<string>
  lastFetchedAt: number | null
}

export interface CustomSource {
  id: string
  name: string
  /** Search results page URL with "{q}" where the keyword should go. */
  searchUrl: string
  /** CSS selector for each listing card/row on the results page. */
  itemSelector: string
  /** CSS selector (relative to the item) for the title. Empty = use the item's own text. */
  titleSelector: string
  priceSelector: string
  imageSelector: string
  linkSelector: string
  enabled: boolean
}
