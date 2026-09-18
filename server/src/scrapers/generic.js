import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const PRICE_RE = /(R\$|US\$|\$|€|£)\s*[\d.,]+/;
const MAX_SCAN_NODES = 4000;
const MAX_CARD_DEPTH = 6;

function resolveUrl(href, base) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function parsePrice(text) {
  if (!text) return null;
  const match = text.replace(/\s+/g, " ").match(/(R\$|US\$|\$|€|£)\s*([\d.,]+)/);
  if (!match) return null;

  const [, symbol, raw] = match;
  const isBRL = symbol === "R$";
  // BRL-style: "." thousands, "," decimal. Everything else: "," thousands, "." decimal.
  const normalized = isBRL ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  const value = Number(normalized);
  if (Number.isNaN(value)) return null;

  const currency = isBRL ? "BRL" : symbol === "€" ? "EUR" : symbol === "£" ? "GBP" : "USD";
  return { value: String(value), currency };
}

/** Extraction using CSS selectors the user typed in manually ("modo avançado"). */
function extractManual($, pageUrl, config, limit) {
  const items = [];
  $(config.itemSelector).each((_, el) => {
    if (items.length >= limit) return;

    const card = $(el);
    const titleNode = config.titleSelector ? card.find(config.titleSelector).first() : card;
    const title = titleNode.text().trim();
    if (!title) return;

    let href = null;
    if (config.linkSelector) {
      href = card.find(config.linkSelector).first().attr("href");
    } else if (card.is("a")) {
      href = card.attr("href");
    } else {
      href = card.find("a").first().attr("href");
    }
    const itemUrl = href ? resolveUrl(href, pageUrl) : null;

    const priceText = config.priceSelector ? card.find(config.priceSelector).first().text().trim() : "";
    const imageNode = config.imageSelector ? card.find(config.imageSelector).first() : null;
    const imageSrc = imageNode ? imageNode.attr("src") || imageNode.attr("data-src") : null;

    items.push({
      id: `${config.id}-${href || title}`,
      title,
      price: parsePrice(priceText),
      image: imageSrc ? resolveUrl(imageSrc, pageUrl) : null,
      condition: null,
      itemUrl: itemUrl || pageUrl,
      seller: null,
      location: null,
      buyingOptions: [],
      source: config.id,
    });
  });
  return items;
}

/**
 * Extraction with no selectors at all ("modo fácil"): finds elements whose
 * own text looks like a price, walks up to the nearest ancestor that also
 * contains a link (that's almost always the listing "card"), groups cards by
 * tag+class signature, and keeps the most common group — that's the actual
 * repeating listing grid, as opposed to one-off prices elsewhere on the page.
 */
function autoDetect($, pageUrl, config, limit) {
  const priceNodes = [];
  let scanned = 0;
  $("body")
    .find("*")
    .each((_, el) => {
      if (scanned >= MAX_SCAN_NODES) return false;
      scanned += 1;
      const node = $(el);
      const ownText = node
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim();
      if (ownText && PRICE_RE.test(ownText)) {
        priceNodes.push(el);
      }
    });

  const groups = new Map();
  for (const priceEl of priceNodes) {
    let node = $(priceEl);
    let card = null;
    for (let depth = 0; depth < MAX_CARD_DEPTH; depth++) {
      const parent = node.parent();
      if (!parent.length || parent.is("body")) break;
      if (parent.find("a[href]").length > 0) {
        card = parent;
        break;
      }
      node = parent;
    }
    if (!card) continue;

    const tag = card.get(0).tagName;
    const classes = (card.attr("class") || "").trim().split(/\s+/).filter(Boolean).sort().join(".");
    const signature = `${tag}.${classes}`;
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push({ card, priceEl });
  }

  let bestGroup = null;
  for (const group of groups.values()) {
    if (group.length >= 2 && (!bestGroup || group.length > bestGroup.length)) {
      bestGroup = group;
    }
  }
  if (!bestGroup) return [];

  const items = [];
  const seenCards = new Set();
  for (const { card, priceEl } of bestGroup) {
    if (items.length >= limit) break;
    const cardEl = card.get(0);
    if (seenCards.has(cardEl)) continue;
    seenCards.add(cardEl);

    const priceText = $(priceEl).text().trim();
    const price = parsePrice(priceText);

    const href = card.find("a[href]").first().attr("href");
    const itemUrl = href ? resolveUrl(href, pageUrl) : null;

    const heading = card.find("h1,h2,h3,h4,h5").first();
    let title = heading.text().trim();
    if (!title) {
      const fullText = card.text().replace(/\s+/g, " ").trim();
      title = fullText.replace(priceText, "").trim();
    }
    if (!title) continue;

    const imgNode = card.find("img").first();
    const imgSrc = imgNode.length ? imgNode.attr("src") || imgNode.attr("data-src") : null;

    items.push({
      id: `${config.id}-${href || title}`,
      title: title.slice(0, 200),
      price,
      image: imgSrc ? resolveUrl(imgSrc, pageUrl) : null,
      condition: null,
      itemUrl: itemUrl || pageUrl,
      seller: null,
      location: null,
      buyingOptions: [],
      source: config.id,
    });
  }

  return items;
}

/**
 * Scrapes an arbitrary auction site's search results page. With no selectors
 * ("modo fácil": só nome + URL) it auto-detects the listing cards by looking
 * for repeated price-shaped elements. With config.itemSelector filled in
 * ("modo avançado") it uses the exact CSS selectors instead.
 */
export async function searchGeneric(config, { query, limit = 30 }) {
  if (!config.searchUrl || !config.searchUrl.includes("{q}")) {
    throw new Error('URL de busca precisa conter "{q}" no lugar da palavra-chave');
  }

  const url = config.searchUrl.replace(/\{q\}/g, encodeURIComponent(query));
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("URL de busca inválida");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("URL de busca precisa ser http(s)");
  }

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${config.name || "Fonte personalizada"} falhou (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const items = config.itemSelector
    ? extractManual($, url, config, limit)
    : autoDetect($, url, config, limit);

  if (items.length === 0 && !config.itemSelector) {
    throw new Error(
      "Não consegui identificar os anúncios automaticamente nessa página. Tente o modo avançado com seletores CSS."
    );
  }

  return { query, total: items.length, items };
}
