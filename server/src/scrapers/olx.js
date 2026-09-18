import * as cheerio from "cheerio";

const SEARCH_URL = "https://www.olx.com.br/brasil";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function parsePrice(text) {
  if (!text) return null;
  const match = text.replace(/\s+/g, " ").match(/R\$\s*([\d.,]+)/);
  if (!match) return null;
  const normalized = match[1].replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) return null;
  return { value: String(value), currency: "BRL" };
}

// OLX sits behind Cloudflare bot protection that can block requests
// intermittently regardless of headers — this is best-effort and expected to
// occasionally fail with a 403/challenge page rather than real results.
export async function searchOlx({ query, limit = 30 }) {
  const params = new URLSearchParams({ q: query });

  const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!response.ok) {
    throw new Error(`OLX search failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const items = [];
  $(".olx-adcard").each((_, el) => {
    if (items.length >= limit) return;

    const card = $(el);
    const link = card.find("a.olx-adcard__link").first();
    const itemUrl = link.attr("href") || null;
    const title = card.find(".olx-adcard__title").first().text().trim();
    if (!itemUrl || !title) return;

    const priceText = card.find(".olx-adcard__price").first().text();
    const image = card.find("img").first().attr("src") || null;
    const location = card.find(".olx-adcard__location").first().text().trim().replace(/\s+/g, " ") || null;

    items.push({
      id: `olx-${itemUrl}`,
      title,
      price: parsePrice(priceText),
      image,
      condition: null,
      itemUrl,
      seller: null,
      location,
      buyingOptions: [],
      source: "olx",
    });
  });

  return { query, total: items.length, items };
}
