import * as cheerio from "cheerio";

const BASE_URL = "https://www.gondololeiloes.lel.br/";
const SEARCH_URL = "https://www.gondololeiloes.lel.br/pesquisa.asp";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function resolveUrl(href) {
  try {
    return new URL(href, BASE_URL).toString().replace(/^http:/, "https:");
  } catch {
    return null;
  }
}

function parsePrice(text) {
  if (!text) return null;
  const match = text.replace(/\s+/g, " ").match(/R\$\s*([\d.,]+)/);
  if (!match) return null;
  const normalized = match[1].replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) return null;
  return { value: String(value), currency: "BRL" };
}

// The bid value is hidden from anonymous visitors on the search results page
// (shows "--", only real once logged in), so price comes back null here.
export async function searchGondolo({ query, limit = 30 }) {
  const url = `${SEARCH_URL}?${new URLSearchParams({ pesquisa: query, Ativo: "1" }).toString()}`;

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Gondolo Leilões falhou (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const items = [];
  $(".prod-box").each((_, el) => {
    if (items.length >= limit) return;

    const card = $(el);
    const titleLink = card.find(".prod-title h3 a").first();
    const title = (titleLink.attr("title") || titleLink.text()).trim();
    if (!title) return;

    const href = titleLink.attr("href") || null;
    const itemUrl = href ? resolveUrl(href) : null;
    const imgSrc = card.find(".img-box-wrap img").first().attr("src") || null;
    const priceText = card.find(".price-bid").first().text().trim();

    items.push({
      id: `gondolo-${href || title}`,
      title,
      price: priceText && priceText !== "--" ? parsePrice(priceText) : null,
      image: imgSrc ? resolveUrl(imgSrc) : null,
      condition: null,
      itemUrl: itemUrl || url,
      seller: "Gondolo Leilões",
      location: null,
      buyingOptions: [],
      source: "gondolo",
    });
  });

  return { query, total: items.length, items };
}
