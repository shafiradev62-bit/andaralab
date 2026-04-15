// Exchange Rate API Routes — /api/exchange-rates
// Full CRUD: GET (list/one), POST (create), PUT (update), DELETE, POST (reset)
// Special: GET /latest — directly fetches real-time rates from Yahoo Finance

import { Router, type Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { exchangeRateStore } from "../lib/store.js";

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// On-demand real-time fetch from Yahoo Finance — bypasses the 30s sync lag
const LATEST_SYMBOLS: Record<string, string> = {
  'idr-usd': 'IDR=X',
  'eur-usd': 'EURUSD=X',
  'usd-jpy': 'USDJPY=X',
  'usd-cny': 'USDCNY=X',
  'usd-sgd': 'USDSGD=X',
  'jci':     '^JKSE',
  'sp500':   '^GSPC',
  'nikkei':  '^N225',
  'gold':    'GC=F',
  'brent':   'BZ=F',
  'us-10y':  '^TNX',
  'dxy':     'DX-Y.NYB',
};

async function yahooRealtime(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { chart?: { result?: { meta: { regularMarketPrice: number; previousClose?: number } }[] } };
    const result = json.chart?.result?.[0];
    if (!result) return null;
    const { regularMarketPrice: price, previousClose: prevClose } = result.meta;
    if (!price || !prevClose) return null;
    const changeValue = price - prevClose;
    const changePercent = (changeValue / prevClose) * 100;
    return { price, changePercent };
  } catch {
    return null;
  }
}

const createExchangeRateSchema = z.object({
  symbol:      z.string().min(1),
  label:       z.string().min(1),
  labelEn:     z.string().optional(),
  labelId:     z.string().optional(),
  value:       z.string().min(1),
  change:      z.string().min(1),
  changeValue: z.number().optional().default(0),
  up:          z.enum(["true", "false", "null"]).optional().transform((v) => {
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  }),
  category:    z.enum(["currency", "index", "commodity", "bond"]).default("currency"),
  order:       z.number().optional().default(99),
  enabled:     z.boolean().optional().default(true),
});

const updateExchangeRateSchema = createExchangeRateSchema.partial();

function problem(res: Response, status: number, title: string, detail?: string) {
  res.status(status).json({ type: `https://andarlab.io/errors/${status}`, title, status, detail });
}

function paramStr(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

const router = Router();

// GET /api/exchange-rates/latest — real-time direct from Yahoo Finance
router.get("/latest", async (_req: Request, res: Response) => {
  const start = Date.now();
  const results = await Promise.allSettled(
    Object.entries(LATEST_SYMBOLS).map(async ([id, symbol]) => {
      const data = await yahooRealtime(symbol);
      if (!data) return { id, live: false };

      let value: string;
      switch (id) {
        case 'idr-usd':
          value = new Intl.NumberFormat('id-ID').format(Math.round(data.price));
          break;
        case 'jci':
        case 'sp500':
        case 'nikkei':
          value = new Intl.NumberFormat('en-US').format(Math.round(data.price));
          break;
        case 'gold':
        case 'brent':
          value = '$' + (id === 'gold'
            ? new Intl.NumberFormat('en-US').format(Math.round(data.price))
            : data.price.toFixed(2));
          break;
        case 'us-10y':
          value = data.price.toFixed(2) + '%';
          break;
        case 'dxy':
          value = data.price.toFixed(2);
          break;
        default:
          value = data.price.toFixed(4);
      }

      const changeStr = (data.changePercent >= 0 ? "+" : "") + data.changePercent.toFixed(2) + "%";
      const up: boolean | null = data.changePercent > 0 ? true : data.changePercent < 0 ? false : null;

      // Persist to store so next / GET also has fresh data
      exchangeRateStore.update(id, {
        value,
        change: changeStr,
        changeValue: data.changePercent,
        up,
      });

      return { id, live: true, value, change: changeStr, changeValue: data.changePercent, up };
    })
  );

  const data = results.map(r =>
    r.status === 'fulfilled' ? r.value : { id: 'unknown', live: false }
  );
  const elapsed = Date.now() - start;
  const liveCount = data.filter((d: any) => d.live).length;

  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('X-Response-Time', `${elapsed}ms`);
  res.json({
    data,
    meta: { total: data.length, live: liveCount, elapsedMs: elapsed, source: 'yahoo-finance' },
  });
});

router.post("/reset", (_req: Request, res: Response) => {
  exchangeRateStore.reset();
  res.json({ data: exchangeRateStore.list(), meta: { total: exchangeRateStore.list().length, reset: true } });
});

router.get("/", (_req: Request, res: Response) => {
  const data = exchangeRateStore.list();
  // Short max-age so clients always get near-fresh data; stale-while-revalidate handled by /latest
  res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=5');
  res.json({ data, meta: { total: data.length } });
});

router.post("/", (req: Request, res: Response) => {
  const result = createExchangeRateSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const er = exchangeRateStore.create(result.data);
  res.status(201).json({ data: er, meta: { created: true } });
});

router.get("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const er = exchangeRateStore.get(id);
  if (!er) return problem(res, 404, "Not Found", `Exchange rate '${id}' does not exist`);
  res.json({ data: er });
});

router.put("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const result = updateExchangeRateSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const updated = exchangeRateStore.update(id, result.data);
  if (!updated) return problem(res, 404, "Not Found", `Exchange rate '${id}' does not exist`);
  res.json({ data: updated, meta: { updated: true } });
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  if (!exchangeRateStore.delete(id)) return problem(res, 404, "Not Found", `Exchange rate '${id}' does not exist`);
  res.status(204).end();
});

router.post("/reorder", (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids)) return problem(res, 400, "Validation Error", "ids must be an array");
  exchangeRateStore.reorder(ids);
  res.json({ data: exchangeRateStore.list(), meta: { reordered: true } });
});

export default router;
