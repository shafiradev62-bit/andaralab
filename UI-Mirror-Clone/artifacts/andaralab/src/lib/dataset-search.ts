import type { ChartDataset } from "./cms-store";

/** Alias ekonomi umum — client tidak perlu mengetik nama lengkap dataset. */
const ECONOMIC_SEARCH_ALIASES: Record<string, string[]> = {
  gdp: [
    "gdp",
    "gdp-growth",
    "gdp growth",
    "gross domestic product",
    "gross domestic",
    "pdb",
    "pertumbuhan pdb",
    "produk domestik bruto",
    "domestic product",
  ],
  inflation: ["inflation", "inflasi", "cpi", "ihk", "consumer price"],
  bi: ["bi rate", "bi-rate", "bank indonesia", "suku bunga", "policy rate"],
  trade: ["trade balance", "trade-balance", "neraca perdagangan", "ekspor", "impor"],
  idr: ["idr", "idr-usd", "idr/usd", "rupiah", "kurs"],
};

function expandSearchTerms(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = new Set<string>([q]);
  for (const aliases of Object.values(ECONOMIC_SEARCH_ALIASES)) {
    // Strict expansion: only if query is an exact alias or the alias starts with query
    if (aliases.some((a) => a === q || (q.length >= 3 && a.startsWith(q)))) {
      for (const a of aliases) terms.add(a);
    }
  }
  return [...terms];
}

function scoreTermAgainstDataset(
  ds: ChartDataset,
  term: string,
  locale: "en" | "id",
): number {
  if (!term) return 0;

  let score = 0;
  const id = ds.id.toLowerCase();
  const titleEn = ds.title.toLowerCase();
  const titleId = (ds.titleId || ds.title).toLowerCase();
  const title = locale === "id" ? titleId : titleEn;
  const descEn = ds.description.toLowerCase();
  const descId = (ds.descriptionId || ds.description).toLowerCase();
  const desc = locale === "id" ? descId : descEn;
  const sub = (ds.subcategory || "").toLowerCase();
  const cat = ds.category.toLowerCase();

  if (id === term) score += 30;
  else if (id.includes(term)) score += 22;

  for (const col of ds.columns) {
    const cl = col.toLowerCase();
    if (cl === term) score += 25;
    else if (cl.startsWith(term)) score += 20;
    else if (cl.includes(term)) score += 16;
  }

  const colLabels = ds.columnLabels?.[locale];
  if (colLabels) {
    for (const label of Object.values(colLabels)) {
      const ll = String(label).toLowerCase();
      if (ll === term) score += 22;
      else if (ll.includes(term)) score += 14;
    }
  }

  if (title === term || titleEn === term || titleId === term) score += 18;
  else if (title.startsWith(term)) score += 14;
  else if (titleEn.includes(term) || titleId.includes(term)) score += 10;

  if (sub.includes(term)) score += 9;
  if (desc.includes(term) || descEn.includes(term) || descId.includes(term)) score += 6;
  if (cat.includes(term)) score += 4;

  return score;
}

export function datasetSearchScore(
  ds: ChartDataset,
  query: string,
  locale: "en" | "id" = "en",
): number {
  const terms = expandSearchTerms(query);
  if (!terms.length) return 0;
  return Math.max(...terms.map((term) => scoreTermAgainstDataset(ds, term, locale)));
}

export function datasetMatchesQuery(
  ds: ChartDataset,
  query: string,
  locale: "en" | "id" = "en",
): boolean {
  return datasetSearchScore(ds, query, locale) > 0;
}
