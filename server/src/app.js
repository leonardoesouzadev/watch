import "dotenv/config";
import express from "express";
import cors from "cors";
import { searchLeiloesBR } from "./scrapers/leiloesbr.js";
import { searchReceitaFederal } from "./scrapers/receitaFederal.js";
import { searchMiltonSayegh } from "./scrapers/miltonsayegh.js";
import { searchSothebys } from "./scrapers/sothebys.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Each entry is a scraper for one built-in auction site. Add more here as
// they're built.
const SOURCES = {
  leiloesbr: searchLeiloesBR,
  receitafederal: searchReceitaFederal,
  miltonsayegh: searchMiltonSayegh,
  sothebys: searchSothebys,
};

app.post("/api/search", async (req, res) => {
  const query = String(req.body?.q || "").trim();
  if (!query) {
    return res.status(400).json({ error: "Missing required field 'q'" });
  }

  const limit = Number(req.body?.limit) || 30;
  const requestedSources = Array.isArray(req.body?.sources) ? req.body.sources : Object.keys(SOURCES);

  const builtInTasks = requestedSources
    .filter((name) => SOURCES[name])
    .map((name) =>
      SOURCES[name]({ query, limit })
        .then((r) => [name, r])
        .catch((err) => [name, err])
    );

  const settled = await Promise.all(builtInTasks);

  const sources = {};
  const items = [];
  for (const [name, outcome] of settled) {
    if (outcome instanceof Error) {
      console.error(`[${name}]`, outcome.message);
      sources[name] = { total: 0, error: outcome.message };
    } else {
      sources[name] = { total: outcome.total, error: null };
      items.push(...outcome.items);
    }
  }

  res.json({ query, sources, items });
});

export default app;
