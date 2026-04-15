import { exchangeRateStore } from "./store.js";
import { logger } from "./logger.js";
import { SYNC_CONFIG } from "./sync-settings.js";

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Yahoo Finance uses query1 and query2 — try both as fallback
const YAHOO_BASES = [
  'https://query1.finance.yahoo.com/v8/finance/chart',
  'https://query2.finance.yahoo.com/v8/finance/chart',
];

// Retry helper: attempts fn up to retries times with baseDelay ms between tries
async function withRetry<T>(fn: () => Promise<T | null>, retries = SYNC_CONFIG.maxRetries, baseDelay = 1500): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, baseDelay * attempt));
    const result = await fn();
    if (result !== null) return result;
    if (attempt < retries) logger.debug(`[sync] Retry attempt ${attempt + 1}`);
  }
  return null;
}

// All fetches go through Yahoo Finance — truly real-time market data
async function fetchYahoo(symbol: string) {
  return withRetry(async () => {
    for (const BASE of YAHOO_BASES) {
      try {
        const url = `${BASE}/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
            'Connection': 'close',
          },
          signal: AbortSignal.timeout(SYNC_CONFIG.fetchTimeoutMs),
        });
        if (res.status === 404 || res.status === 429) continue;
        if (!res.ok) throw new Error(`Yahoo ${res.status}`);
        const data = await res.json() as { chart?: { result?: unknown[] } };
        const result = data.chart?.result?.[0] as { meta: { regularMarketPrice: number; previousClose?: number; chartPreviousClose?: number; symbol: string; currency?: string } } | undefined;
        if (!result) throw new Error(`No result for ${symbol}`);

        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || meta.chartPreviousClose;
        if (!price || !prevClose) throw new Error(`Incomplete data for ${symbol}`);

        const changeValue = price - prevClose;
        const changePercent = (changeValue / prevClose) * 100;

        return {
          price,
          changeValue,
          changePercent,
          symbol: meta.symbol,
          currency: meta.currency,
        };
      } catch (err) {
        // try next base
      }
    }
    return null;
  });
}

const SYMBOLS: Record<string, string> = {
  // Currencies
  'idr-usd':   'IDR=X',
  'eur-usd':   'EURUSD=X',
  'usd-jpy':   'USDJPY=X',
  'gbp-usd':   'GBPUSD=X',
  'usd-cny':   'USDCNY=X',
  'usd-sgd':   'USDSGD=X',
  'usd-myr':   'USDMYR=X',
  'aud-usd':   'AUDUSD=X',
  // Indices
  'jci':       '^JKSE',    // IHSG
  'sp500':     '^GSPC',
  'nikkei':    '^N225',
  'shanghai':  '000001.SS',
  'dax':       '^GDAXI',
  'ftse':      '^FTSE',
  'dxy':       'DX-Y.NYB', // Dollar Index
  // Commodities
  'gold':      'GC=F',
  'silver':    'SI=F',
  'brent':     'BZ=F',
  'wti':       'CL=F',
  'copper':    'HG=F',
  // Bonds
  'us-10y':   '^TNX',
};

export async function syncExchangeRates() {
  const start = Date.now();
  logger.info("[sync] >>> Starting real-time sync cycle <<<");

  // Begin batch — all updates accumulate in memory, then flush once to disk
  exchangeRateStore.beginBatch();

  // Fire ALL requests in parallel — max speed
  const results = await Promise.all(
    Object.entries(SYMBOLS).map(async ([id]) => {
      const data = await fetchYahoo(id);
      return { id, data };
    })
  );

  let updated = 0;
  let failed = 0;

  for (const { id, data } of results) {
    if (!data) {
      failed++;
      continue;
    }

    const { price, changePercent } = data;
    let formatted: string;
    let change: number;

    switch (id) {
      // IDR — format as clean integer with separator
      case 'idr-usd': {
        formatted = new Intl.NumberFormat('id-ID').format(Math.round(price));
        change = changePercent;
        break;
      }
      // Currencies — 4 decimal places
      case 'eur-usd':
      case 'usd-jpy':
      case 'gbp-usd':
      case 'aud-usd':
      case 'usd-cny':
      case 'usd-sgd':
      case 'usd-myr':
        formatted = price.toFixed(4);
        change = changePercent;
        break;
      // Indices — formatted with commas
      case 'jci':
      case 'nikkei':
      case 'shanghai':
      case 'dax':
      case 'ftse':
      case 'sp500':
        formatted = new Intl.NumberFormat('en-US').format(Math.round(price));
        change = changePercent;
        break;
      // DXY — 2 decimal
      case 'dxy':
        formatted = price.toFixed(2);
        change = changePercent;
        break;
      // Commodities — USD prefix, appropriate decimals
      case 'gold':
        formatted = '$' + new Intl.NumberFormat('en-US').format(Math.round(price));
        change = changePercent;
        break;
      case 'silver':
      case 'brent':
      case 'wti':
      case 'copper':
        formatted = '$' + price.toFixed(2);
        change = changePercent;
        break;
      // Bonds — percentage with 2 decimal + %
      case 'us-10y':
        formatted = price.toFixed(2) + '%';
        change = changePercent;
        break;
      default:
        formatted = String(price);
        change = changePercent;
    }

    updateRate(id, formatted, change);
    logger.info(`[sync] ✓ ${id}: ${formatted}`);
    updated++;
  }

  // Single flush — one disk write for entire cycle
  const pendingCount = exchangeRateStore.getPendingIds().length;
  exchangeRateStore.flush();

  const elapsed = Date.now() - start;
  logger.info(`[sync] >>> Sync done: ${updated} updated, ${failed} failed, ${pendingCount} flushed (${elapsed}ms) <<<`);
}

function updateRate(id: string, value: string, changePercent: number) {
  const existing = exchangeRateStore.get(id);
  if (!existing) return;

  const changeStr = (changePercent >= 0 ? "+" : "") + changePercent.toFixed(2) + "%";
  const isUp = changePercent > 0 ? true : changePercent < 0 ? false : null;

  exchangeRateStore.update(id, {
    value,
    change: changeStr,
    changeValue: changePercent,
    up: isUp,
  });
}

/** Starts the automatic sync — interval driven by EXCHANGE_SYNC_INTERVAL_MS env var */
export function startExchangeRateSync(intervalMs?: number) {
  if (!SYNC_CONFIG.enabled) {
    logger.info("[sync] Disabled via EXCHANGE_SYNC_ENABLED=false");
    return;
  }

  const interval = intervalMs ?? SYNC_CONFIG.intervalMs;
  logger.info(`[sync] Initializing sync (interval: ${interval}ms, timeout: ${SYNC_CONFIG.fetchTimeoutMs}ms, retries: ${SYNC_CONFIG.maxRetries})`);

  // Initial run
  syncExchangeRates().catch(e => logger.error("[sync] Initial sync failed:", e));

  // Schedule repeated runs
  setInterval(() => {
    syncExchangeRates().catch(e => logger.error("[sync] Scheduled sync failed:", e));
  }, interval);
}

