import * as cheerio from "cheerio";

const BASE_URL = "https://101leiloes.com.br/";
const SEARCH_URL = "https://101leiloes.com.br/leiloes/diversos";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function resolveUrl(href) {
  try {
    return new URL(href, BASE_URL).toString();
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

// Watches are listed under the "Diversos" catch-all category (vs. veículos/
// imóveis), which has its own per-category keyword search.
export async function searchLeiloes101({ query, limit = 30 }) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`101 Leilões falhou (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const items = [];
  $("#catalog-results a[href^='/anuncio/']").each((_, el) => {
    if (items.length >= limit) return;

    const card = $(el);
    const title = card.find("h3").first().text().trim();
    if (!title) return;

    const href = card.attr("href") || null;
    const itemUrl = href ? resolveUrl(href) : null;
    const imgSrc = card.find("img").first().attr("src") || null;
    const location = card.find("p").eq(1).text().trim() || null;

    items.push({
      id: `leiloes101-${href || title}`,
      title,
      price: parsePrice(card.find(".tabular-nums").first().text()),
      image: imgSrc ? resolveUrl(imgSrc) : null,
      condition: null,
      itemUrl: itemUrl || url,
      seller: null,
      location,
      buyingOptions: [],
      source: "leiloes101",
    });
  });

  return { query, total: items.length, items };
}
