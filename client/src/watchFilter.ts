// Generic terms that identify an item as a watch regardless of brand.
const GENERIC_TERMS = ['relogio', 'relógio', 'watch', 'wristwatch', 'cronografo', 'cronógrafo']

// Known watch brands seen in Brazilian auction listings. Best-effort list —
// items from brands not on it (or with brand names misspelled) won't match
// a generic term either and will be filtered out as false negatives.
const BRANDS = [
  'rolex',
  'omega',
  'tissot',
  'seiko',
  'grand seiko',
  'citizen',
  'casio',
  'g-shock',
  'tag heuer',
  'cartier',
  'breitling',
  'iwc',
  'panerai',
  'hublot',
  'patek philippe',
  'audemars piguet',
  'longines',
  'mido',
  'certina',
  'hamilton',
  'swatch',
  'fossil',
  'invicta',
  'bulova',
  'orient',
  'mondaine',
  'vacheron constantin',
  'jaeger-lecoultre',
  'jaeger lecoultre',
  'zenith',
  'chopard',
  'montblanc',
  'baume et mercier',
  'baume & mercier',
  'tudor',
  'movado',
  'rado',
  'oris',
  'frederique constant',
  'maurice lacroix',
  'raymond weil',
  'ebel',
  'girard-perregaux',
  'piaget',
  'breguet',
  'glashutte',
  'glashütte',
  'a. lange & sohne',
  'lange & sohne',
  'ulysse nardin',
  'corum',
  'blancpain',
  'technos',
  'dumont',
  'champion',
  'atlantis',
  'lince',
  'euro',
  'speedo',
  'guess',
  'michael kors',
  'emporio armani',
  'diesel',
  'timex',
  'skagen',
  'nixon',
  'luminox',
  'victorinox',
  'garmin',
  'apple watch',
  'galaxy watch',
]

const WATCH_TERMS = [...GENERIC_TERMS, ...BRANDS]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const NORMALIZED_TERMS = WATCH_TERMS.map(normalize)

export function isLikelyWatch(title: string): boolean {
  const normalized = normalize(title)
  return NORMALIZED_TERMS.some((term) => normalized.includes(term))
}
