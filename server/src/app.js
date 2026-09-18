import "dotenv/config";
import express from "express";
import cors from "cors";
import { searchLeiloesBR } from "./scrapers/leiloesbr.js";
import { searchReceitaFederal } from "./scrapers/receitaFederal.js";
import { searchGeneric } from "./scrapers/generic.js";

const app = express();
const MAX_CUSTOM_SOURCES = 10;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Each entry is a scraper for one built-in auction site. Add more here as
// they're built. Ad-hoc sources (user-defined CSS selectors) travel with the
// request instead — see customSources below.
const SOURCES = {
  leiloesbr: searchLeiloesBR,
  receitafederal: searchReceitaFederal,
};

app.post("/api/search", async (req, res) => {
  const query = String(req.body?.q || "").trim();
  if (!query) {
    return res.status(400).json({ error: "Missing required field 'q'" });
  }

  const limit = Number(req.body?.limit) || 30;
  const requestedSources = Array.isArray(req.body?.sources) ? req.body.sources : Object.keys(SOURCES);
  const customSources = Array.isArray(req.body?.customSources) ? req.body.customSources.slice(0, MAX_CUSTOM_SOURCES) : [];

  const builtInTasks = requestedSources
    .filter((name) => SOURCES[name])
    .map((name) =>
      SOURCES[name]({ query, limit })
        .then((r) => [name, r])
        .catch((err) => [name, err])
    );

  const customTasks = customSources
    .filter((c) => c && c.id && c.enabled !== false)
    .map((c) =>
      searchGeneric(c, { query, limit })
        .then((r) => [c.id, r])
        .catch((err) => [c.id, err])
    );

  const settled = await Promise.all([...builtInTasks, ...customTasks]);

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
