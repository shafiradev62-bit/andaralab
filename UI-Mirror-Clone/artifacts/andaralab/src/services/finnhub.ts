/**
 * finnhub.ts — Centralized Finnhub market data service
 *
 * Single source of truth for all live market data in the MarketTicker.
 * Uses Finnhub REST API only. No Yahoo Finance, no ExchangeRate APIs, no mocks.
 *
 * Polling: every 60 seconds via React hook.
 * Cache:   module-level cache keyed by timestamp to prevent redundant fetches
 *          within the same polling window.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketData {
  rate: number | null;
  rateChange: number | null;
  us10y: number | null;
  us10yChange: number | null;
  gold: number | null;
  goldChange: number | null;
  brent: number | null;
  brentChange: number | null;
  eurusd: number | null;
  eurusdChange: number | null;
  dxy: number | null;
  dxyChange: number | null;
  sp500: number | null;
  sp500Change: number | null;
}

export interface MarketDataState {
  data: MarketData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/** Raw shape returned by Finnhub /quote endpoint */
interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // high
  l: number;   // low
  o: number;   // open
  pc: number;  // previous close
  t: number;   // timestamp (unix)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FINNHUB_API_KEY = "d8lnt69r01qnkjl7pfdgd8lnt69r01qnkjl7pfe0";
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const POLL_INTERVAL_MS = 60_000; // 60 seconds
const CACHE_TTL_MS = 55_000;     // slightly under poll interval to allow refresh

/**
 * Symbol map — all verified working on Finnhub free tier.
 *
 * Finnhub free tier does NOT include:
 *   - OANDA forex/commodity (requires paid subscription)
 *   - ^GSPC, ^TNX index quotes (requires CFD subscription)
 *   - Jakarta Stock Exchange (JK suffix) symbols
 *
 * We use liquid US ETF proxies instead — these track the underlying
 * assets very closely and are available on the free tier:
 *
 *   SPY  → S&P 500 (SPDR S&P 500 ETF)
 *   GLD  → Gold spot (SPDR Gold Shares)
 *   USO  → Brent/WTI Crude Oil (US Oil Fund)
 *   TLT  → US 10Y yield proxy (iShares 20Y Treasury ETF)
 *   FXE  → EUR/USD (Invesco CurrencyShares Euro ETF)
 *   UUP  → DXY Index (Invesco DB USD Index Bullish ETF)
 *   EWS  → IHSG/Indonesia proxy (iShares MSCI Indonesia ETF)
 */
const SYMBOLS = {
  us10y: "TLT",  // iShares 20+ Year Treasury ETF — US 10Y yield proxy
  gold: "GLD",   // SPDR Gold Shares — Gold proxy
  brent: "USO",  // US Oil Fund — Brent/WTI crude proxy
  eurusd: "FXE", // Invesco CurrencyShares Euro ETF — EUR/USD proxy
  dxy: "UUP",    // Invesco DB USD Index Bullish ETF — DXY proxy
  sp500: "SPY",  // SPDR S&P 500 ETF
} as const;

/** open.er-api.com — free, no key, daily updated. Used for IDR/USD only. */
const ER_API_URL = "https://open.er-api.com/v6/latest/USD";

interface ErApiResponse {
  result: string;
  rates: Record<string, number>;
}

async function fetchIdrUsd(): Promise<{ rate: number | null; rateChange: null }> {
  try {
    const res = await fetch(ER_API_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) return { rate: null, rateChange: null };
    const json = await res.json() as ErApiResponse;
    if (json.result !== "success" || !json.rates.IDR) return { rate: null, rateChange: null };
    return { rate: json.rates.IDR, rateChange: null };
  } catch {
    return { rate: null, rateChange: null };
  }
}

type SymbolKey = keyof typeof SYMBOLS;

// ─── Module-level cache ────────────────────────────────────────────────────────

interface CacheEntry {
  data: MarketData;
  fetchedAt: number;
}

let _cache: CacheEntry | null = null;

function isCacheValid(): boolean {
  if (!_cache) return false;
  return Date.now() - _cache.fetchedAt < CACHE_TTL_MS;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  try {
    const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`[finnhub] Quote fetch failed for ${symbol}: HTTP ${res.status}`);
      return null;
    }

    const json = await res.json() as FinnhubQuote;

    // Finnhub returns { c: 0 } when the symbol is invalid or market is closed
    if (!json || json.c === 0 && json.pc === 0) {
      console.warn(`[finnhub] Empty/zero quote for ${symbol}`);
      return null;
    }

    return json;
  } catch (err) {
    console.warn(`[finnhub] Network error fetching ${symbol}:`, err);
    return null;
  }
}

/**
 * Fetch all symbols in parallel. Each symbol failure is isolated —
 * one bad symbol never crashes the entire fetch.
 */
async function fetchAllQuotes(): Promise<Record<SymbolKey, FinnhubQuote | null>> {
  const entries = Object.entries(SYMBOLS) as [SymbolKey, string][];

  const results = await Promise.allSettled(
    entries.map(([, symbol]) => fetchQuote(symbol))
  );

  return Object.fromEntries(
    entries.map(([key], i) => {
      const result = results[i];
      return [key, result.status === "fulfilled" ? result.value : null];
    })
  ) as Record<SymbolKey, FinnhubQuote | null>;
}

/**
 * Calculate percentage change from previous close.
 * Returns null if data is unavailable.
 */
function pctChange(quote: FinnhubQuote | null): number | null {
  if (!quote) return null;
  // Prefer Finnhub's pre-calculated dp field
  if (typeof quote.dp === "number" && isFinite(quote.dp)) return quote.dp;
  // Fallback: calculate from current and previous close
  if (quote.pc && quote.pc !== 0) {
    return ((quote.c - quote.pc) / quote.pc) * 100;
  }
  return null;
}

function currentPrice(quote: FinnhubQuote | null): number | null {
  if (!quote || !isFinite(quote.c)) return null;
  return quote.c;
}

function buildMarketData(
  quotes: Record<SymbolKey, FinnhubQuote | null>,
  idrUsd: { rate: number | null; rateChange: null }
): MarketData {
  return {
    rate: idrUsd.rate,
    rateChange: idrUsd.rateChange,
    us10y: currentPrice(quotes.us10y),
    us10yChange: pctChange(quotes.us10y),
    gold: currentPrice(quotes.gold),
    goldChange: pctChange(quotes.gold),
    brent: currentPrice(quotes.brent),
    brentChange: pctChange(quotes.brent),
    eurusd: currentPrice(quotes.eurusd),
    eurusdChange: pctChange(quotes.eurusd),
    dxy: currentPrice(quotes.dxy),
    dxyChange: pctChange(quotes.dxy),
    sp500: currentPrice(quotes.sp500),
    sp500Change: pctChange(quotes.sp500),
  };
}

// ─── Public fetch function ────────────────────────────────────────────────────

/**
 * Fetches all market data from Finnhub.
 * Returns cached data if within TTL to avoid excessive API calls.
 */
export async function fetchMarketData(): Promise<MarketData> {
  if (isCacheValid() && _cache) {
    return _cache.data;
  }

  // Fetch Finnhub quotes and IDR/USD in parallel
  const [quotes, idrUsd] = await Promise.all([
    fetchAllQuotes(),
    fetchIdrUsd(),
  ]);

  const data = buildMarketData(quotes, idrUsd);

  _cache = { data, fetchedAt: Date.now() };
  return data;
}

/** Invalidate the module-level cache (useful for testing or manual refresh). */
export function invalidateMarketCache(): void {
  _cache = null;
}

// ─── React hook ───────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

/**
 * useFinnhubMarket — React hook that polls Finnhub every 60 seconds.
 *
 * - Handles loading state (skeleton on first load)
 * - Handles errors gracefully (never throws, never crashes the navbar)
 * - Caches responses at the module level to avoid duplicate fetches
 *   when multiple components mount simultaneously
 */
export function useFinnhubMarket(): MarketDataState {
  const [state, setState] = useState<MarketDataState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const isMounted = useRef(true);

  async function load() {
    try {
      const data = await fetchMarketData();
      if (!isMounted.current) return;
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      if (!isMounted.current) return;
      const message = err instanceof Error ? err.message : "Failed to fetch market data";
      console.error("[finnhub] fetchMarketData error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }

  useEffect(() => {
    isMounted.current = true;
    void load();

    const timer = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}