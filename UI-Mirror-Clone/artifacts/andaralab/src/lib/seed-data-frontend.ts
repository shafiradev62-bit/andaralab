// Seed data for frontend fallback when API is not available (e.g., Vercel production)
// This matches the backend seed-data.ts precisely.

import type { ChartDataset, Page, BlogPost, ContentSection } from "./cms-store";

export const SEED_DATASETS: ChartDataset[] = [
  {
    id: "oil-gas-production",
    title: "Produksi Minyak Bumi & Gas Alam",
    description: "Produksi minyak mentah, kondensat, dan gas alam Indonesia 1996–2024 (ribuan barel & MMscf)",
    category: "Sectoral Intelligence",
    chartType: "line",
    color: "#2E5A88",
    unit: "000 Barel / MMscf",
    unitType: "custom",
    chartTitle: "Produksi Minyak Bumi & Gas Alam Indonesia",
    xAxisLabel: "Tahun",
    yAxisLabel: "Volume (000 Barel & MMscf)",
    subtitle: "Sumber: SKK Migas / Ministry of Energy and Mineral Resources",
    columns: ["Tahun", "Minyak & Kondensat (000 Barel)", "Gas Alam (MMscf)"],
    rows: [
      { Tahun: "1996", "Minyak & Kondensat (000 Barel)": 548648.3,  "Gas Alam (MMscf)": 3164016.2 },
      { Tahun: "1997", "Minyak & Kondensat (000 Barel)": 543752.6,  "Gas Alam (MMscf)": 3166034.9 },
      { Tahun: "1998", "Minyak & Kondensat (000 Barel)": 534892.0,   "Gas Alam (MMscf)": 2978851.9 },
      { Tahun: "1999", "Minyak & Kondensat (000 Barel)": 494643.0,   "Gas Alam (MMscf)": 3068349.1 },
      { Tahun: "2000", "Minyak & Kondensat (000 Barel)": 484393.3,   "Gas Alam (MMscf)": 2845532.9 },
      { Tahun: "2001", "Minyak & Kondensat (000 Barel)": 480116.1,   "Gas Alam (MMscf)": 3762828.5 },
      { Tahun: "2002", "Minyak & Kondensat (000 Barel)": 397308.5,   "Gas Alam (MMscf)": 2279373.9 },
      { Tahun: "2003", "Minyak & Kondensat (000 Barel)": 383700.0,   "Gas Alam (MMscf)": 2142605.0 },
      { Tahun: "2004", "Minyak & Kondensat (000 Barel)": 404992.9,   "Gas Alam (MMscf)": 3026069.3 },
      { Tahun: "2005", "Minyak & Kondensat (000 Barel)": 387653.5,   "Gas Alam (MMscf)": 2985341.0 },
      { Tahun: "2006", "Minyak & Kondensat (000 Barel)": 357477.4,   "Gas Alam (MMscf)": 2948021.6 },
      { Tahun: "2007", "Minyak & Kondensat (000 Barel)": 348348.0,   "Gas Alam (MMscf)": 2805540.3 },
      { Tahun: "2008", "Minyak & Kondensat (000 Barel)": 358718.7,   "Gas Alam (MMscf)": 2790988.0 },
      { Tahun: "2009", "Minyak & Kondensat (000 Barel)": 346313.0,   "Gas Alam (MMscf)": 2887892.2 },
      { Tahun: "2010", "Minyak & Kondensat (000 Barel)": 344888.0,   "Gas Alam (MMscf)": 3407592.3 },
      { Tahun: "2011", "Minyak & Kondensat (000 Barel)": 329249.3,   "Gas Alam (MMscf)": 3256378.9 },
      { Tahun: "2012", "Minyak & Kondensat (000 Barel)": 314665.9,   "Gas Alam (MMscf)": 2982753.5 },
      { Tahun: "2013", "Minyak & Kondensat (000 Barel)": 301191.9,   "Gas Alam (MMscf)": 2969210.8 },
      { Tahun: "2014", "Minyak & Kondensat (000 Barel)": 287902.2,   "Gas Alam (MMscf)": 2999524.4 },
      { Tahun: "2015", "Minyak & Kondensat (000 Barel)": 286814.2,   "Gas Alam (MMscf)": 2948365.8 },
      { Tahun: "2017", "Minyak & Kondensat (000 Barel)": 292373.8,   "Gas Alam (MMscf)": 2781154.0 },
      { Tahun: "2018", "Minyak & Kondensat (000 Barel)": 281826.61, "Gas Alam (MMscf)": 2833783.51 },
      { Tahun: "2019", "Minyak & Kondensat (000 Barel)": 273494.8,  "Gas Alam (MMscf)": 2647985.9 },
      { Tahun: "2020", "Minyak & Kondensat (000 Barel)": 259246.8,  "Gas Alam (MMscf)": 2442830.7 },
      { Tahun: "2021", "Minyak & Kondensat (000 Barel)": 240324.5,  "Gas Alam (MMscf)": 2433364.0 },
      { Tahun: "2022", "Minyak & Kondensat (000 Barel)": 223532.5,  "Gas Alam (MMscf)": 1962929.0 },
      { Tahun: "2023", "Minyak & Kondensat (000 Barel)": 221088.9,  "Gas Alam (MMscf)": 2420059.5 },
      { Tahun: "2024*", "Minyak & Kondensat (000 Barel)": 211756.18, "Gas Alam (MMscf)": 2483498.15 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2026-03-31T00:00:00.000Z",
  },
  {
    id: "gdp-growth",
    title: "Indonesia GDP Growth Rate",
    description: "Quarterly GDP growth rate year-over-year (%)",
    category: "Macro Foundations",
    chartType: "line",
    color: "#5CA0C8",
    unit: "%",
    unitType: "percent",
    chartTitle: "PDB Indonesia — Pertumbuhan Kuartalan (YoY %)",
    xAxisLabel: "Kuartal",
    yAxisLabel: "Pertumbuhan (%)",
    subtitle: "Sumber: BPS Indonesia",
    columns: ["Quarter", "GDP Growth", "Forecast"],
    rows: [
      { Quarter: "Q1 2023", "GDP Growth": 5.03, Forecast: 5.1 },
      { Quarter: "Q2 2023", "GDP Growth": 5.17, Forecast: 5.2 },
      { Quarter: "Q3 2023", "GDP Growth": 4.94, Forecast: 5.0 },
      { Quarter: "Q4 2023", "GDP Growth": 5.04, Forecast: 5.0 },
      { Quarter: "Q1 2024", "GDP Growth": 5.11, Forecast: 5.1 },
      { Quarter: "Q2 2024", "GDP Growth": 5.05, Forecast: 5.1 },
      { Quarter: "Q3 2024", "GDP Growth": 4.95, Forecast: 5.0 },
      { Quarter: "Q4 2024", "GDP Growth": 5.02, Forecast: 5.0 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-12-01T00:00:00.000Z",
  },
  {
    id: "inflation-rate",
    title: "Indonesia Inflation Rate",
    description: "Monthly consumer price index inflation (%)",
    category: "Macro Foundations",
    chartType: "area",
    color: "#83BFCC",
    unit: "%",
    unitType: "percent",
    chartTitle: "Inflasi IHK Indonesia (YoY %)",
    xAxisLabel: "Bulan",
    yAxisLabel: "Inflasi (%)",
    subtitle: "Sumber: BPS Indonesia",
    columns: ["Month", "CPI Inflation", "Core Inflation"],
    rows: [
      { Month: "Jan 2024", "CPI Inflation": 2.57, "Core Inflation": 1.8 },
      { Month: "Feb 2024", "CPI Inflation": 2.75, "Core Inflation": 1.9 },
      { Month: "Mar 2024", "CPI Inflation": 3.05, "Core Inflation": 1.8 },
      { Month: "Apr 2024", "CPI Inflation": 3.0,  "Core Inflation": 1.8 },
      { Month: "May 2024", "CPI Inflation": 2.84, "Core Inflation": 1.9 },
      { Month: "Jun 2024", "CPI Inflation": 2.51, "Core Inflation": 1.9 },
      { Month: "Jul 2024", "CPI Inflation": 2.13, "Core Inflation": 1.9 },
      { Month: "Aug 2024", "CPI Inflation": 2.12, "Core Inflation": 2.0 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-09-01T00:00:00.000Z",
  },
  {
    id: "bi-rate",
    title: "Bank Indonesia Policy Rate",
    description: "BI 7-Day Reverse Repo Rate (%)",
    category: "Macro Foundations",
    chartType: "bar",
    color: "#C4E0EE",
    unit: "%",
    unitType: "percent",
    chartTitle: "Suku Bunga Kebijakan BI vs Fed Funds Rate (%)",
    xAxisLabel: "Periode",
    yAxisLabel: "Suku Bunga (%)",
    subtitle: "Sumber: Bank Indonesia / Federal Reserve",
    columns: ["Period", "BI Rate", "US Fed Rate"],
    rows: [
      { Period: "Jan 2023", "BI Rate": 5.75, "US Fed Rate": 4.5  },
      { Period: "Apr 2023", "BI Rate": 5.75, "US Fed Rate": 5.0  },
      { Period: "Jul 2023", "BI Rate": 5.75, "US Fed Rate": 5.25 },
      { Period: "Oct 2023", "BI Rate": 6.0,  "US Fed Rate": 5.5  },
      { Period: "Jan 2024", "BI Rate": 6.0,  "US Fed Rate": 5.5  },
      { Period: "Apr 2024", "BI Rate": 6.25, "US Fed Rate": 5.5  },
      { Period: "Jul 2024", "BI Rate": 6.25, "US Fed Rate": 5.5  },
      { Period: "Oct 2024", "BI Rate": 6.0,  "US Fed Rate": 5.0  },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-11-01T00:00:00.000Z",
  },
  {
    id: "trade-balance",
    title: "Indonesia Trade Balance",
    description: "Monthly trade balance in USD Billion",
    category: "Sectoral Intelligence",
    chartType: "bar",
    color: "#CEDBEB",
    unit: "USD B",
    unitType: "currency_usd",
    chartTitle: "Neraca Perdagangan Indonesia (USD Miliar)",
    xAxisLabel: "Bulan",
    yAxisLabel: "USD Miliar",
    subtitle: "Sumber: BPS Indonesia",
    columns: ["Month", "Exports", "Imports", "Balance"],
    rows: [
      { Month: "Jan 2024", Exports: 20.5, Imports: 18.1, Balance: 2.4 },
      { Month: "Feb 2024", Exports: 19.3, Imports: 17.8, Balance: 1.5 },
      { Month: "Mar 2024", Exports: 22.1, Imports: 19.5, Balance: 2.6 },
      { Month: "Apr 2024", Exports: 21.5, Imports: 18.9, Balance: 2.6 },
      { Month: "May 2024", Exports: 22.4, Imports: 19.8, Balance: 2.6 },
      { Month: "Jun 2024", Exports: 20.8, Imports: 18.5, Balance: 2.3 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-07-01T00:00:00.000Z",
  },
  {
    id: "idr-usd",
    title: "IDR/USD Exchange Rate",
    description: "Indonesian Rupiah vs US Dollar (monthly average)",
    category: "Market Dashboard",
    chartType: "line",
    color: "#B8D4E8",
    unit: "IDR",
    unitType: "currency_idr",
    chartTitle: "Kurs IDR/USD (Rata-rata Bulanan)",
    xAxisLabel: "Bulan",
    yAxisLabel: "IDR per USD",
    subtitle: "Sumber: Bank Indonesia",
    columns: ["Month", "IDR/USD"],
    rows: [
      { Month: "Jan 2024", "IDR/USD": 15620 },
      { Month: "Feb 2024", "IDR/USD": 15680 },
      { Month: "Mar 2024", "IDR/USD": 15721 },
      { Month: "Apr 2024", "IDR/USD": 16100 },
      { Month: "May 2024", "IDR/USD": 16015 },
      { Month: "Jun 2024", "IDR/USD": 16373 },
      { Month: "Jul 2024", "IDR/USD": 16200 },
      { Month: "Aug 2024", "IDR/USD": 15780 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-09-01T00:00:00.000Z",
  },
  {
    id: "nickel-production",
    title: "Produksi Nikel Indonesia",
    description: "Output nikel Indonesia 2010–2024 (tonnikel konten metal) dan pangsa pasar global",
    category: "Sectoral Intelligence",
    chartType: "area",
    color: "#2E5A88",
    unit: "Ton Metal",
    unitType: "number",
    chartTitle: "Produksi Nikel Indonesia vs Dunia (%)",
    xAxisLabel: "Tahun",
    yAxisLabel: "Ton Metal (Ribuan)",
    subtitle: "Sumber: USGS / Indonesia ESDM Ministry",
    columns: ["Year", "Indonesia Production", "Global Share %"],
    rows: [
      { Year: "2015", "Indonesia Production": 169.2, "Global Share %": 18 },
      { Year: "2016", "Indonesia Production": 188.3, "Global Share %": 21 },
      { Year: "2017", "Indonesia Production": 201.5, "Global Share %": 24 },
      { Year: "2018", "Indonesia Production": 213.6, "Global Share %": 27 },
      { Year: "2019", "Indonesia Production": 229.4, "Global Share %": 30 },
      { Year: "2020", "Indonesia Production": 237.8, "Global Share %": 32 },
      { Year: "2021", "Indonesia Production": 245.3, "Global Share %": 33 },
      { Year: "2022", "Indonesia Production": 258.1, "Global Share %": 35 },
      { Year: "2023", "Indonesia Production": 271.5, "Global Share %": 37 },
      { Year: "2024*", "Indonesia Production": 289.0, "Global Share %": 39 },
    ],
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "digital-economy-gmv",
    title: "Ekonomi Digital Indonesia",
    description: "Gross Merchandise Value (GMV) ekonomi digital Indonesia 2019–2026 (USD Miliar)",
    category: "Market Dashboard",
    chartType: "line",
    color: "#5CA0C8",
    unit: "USD B",
    unitType: "currency_usd",
    chartTitle: "GMV Ekonomi Digital Indonesia (USD Miliar)",
    xAxisLabel: "Tahun",
    yAxisLabel: "USD Miliar",
    subtitle: "Sumber: Google Temasek Bain / AndaraLab estimates",
    columns: ["Year", "GMV (USD B)", "YoY Growth %"],
    rows: [
      { Year: "2019", "GMV (USD B)": 40,  "YoY Growth %": 49 },
      { Year: "2020", "GMV (USD B)": 44,  "YoY Growth %": 10 },
      { Year: "2021", "GMV (USD B)": 70,  "YoY Growth %": 59 },
      { Year: "2022", "GMV (USD B)": 77,  "YoY Growth %": 10 },
      { Year: "2023", "GMV (USD B)": 82,  "YoY Growth %": 6  },
      { Year: "2024", "GMV (USD B)": 95,  "YoY Growth %": 16 },
      { Year: "2025", "GMV (USD B)": 110, "YoY Growth %": 16 },
      { Year: "2026*", "GMV (USD B)": 130, "YoY Growth %": 18 },
    ],
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "sovereign-bond-yield",
    title: "Imbal Hasil SBN Indonesia",
    description: "Yield obligasi pemerintah tenor 5, 10, 15 tahun (%) — Indikator risiko sovereign",
    category: "Financial Markets",
    chartType: "line",
    color: "#83BFCC",
    unit: "%",
    unitType: "percent",
    chartTitle: "Yield SBN Indonesia (% p.a.)",
    xAxisLabel: "Tanggal",
    yAxisLabel: "Yield (%)",
    subtitle: "Sumber: Refinitiv / Bloomberg",
    columns: ["Date", "SUN 5Y", "SUN 10Y", "SUN 15Y"],
    rows: [
      { Date: "Jan 2024", "SUN 5Y": 6.35, "SUN 10Y": 6.62, "SUN 15Y": 6.80 },
      { Date: "Feb 2024", "SUN 5Y": 6.48, "SUN 10Y": 6.75, "SUN 15Y": 6.91 },
      { Date: "Mar 2024", "SUN 5Y": 6.52, "SUN 10Y": 6.80, "SUN 15Y": 6.95 },
      { Date: "Apr 2024", "SUN 5Y": 6.88, "SUN 10Y": 7.05, "SUN 15Y": 7.18 },
      { Date: "May 2024", "SUN 5Y": 6.95, "SUN 10Y": 7.12, "SUN 15Y": 7.25 },
      { Date: "Jun 2024", "SUN 5Y": 7.02, "SUN 10Y": 7.20, "SUN 15Y": 7.32 },
      { Date: "Jul 2024", "SUN 5Y": 6.75, "SUN 10Y": 6.95, "SUN 15Y": 7.10 },
      { Date: "Aug 2024", "SUN 5Y": 6.50, "SUN 10Y": 6.70, "SUN 15Y": 6.85 },
    ],
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2024-09-01T00:00:00.000Z",
  },
  {
    id: "coal-production",
    title: "Produksi Batu Bara Indonesia",
    description: "Output batu bara Indonesia 2010–2024 (juta ton) dan ekspor",
    category: "Sectoral Intelligence",
    chartType: "bar",
    color: "#C4E0EE",
    unit: "Juta Ton",
    unitType: "number",
    chartTitle: "Produksi & Ekspor Batu Bara Indonesia (Juta Ton)",
    xAxisLabel: "Tahun",
    yAxisLabel: "Juta Ton",
    subtitle: "Sumber: Ministry of Energy and Mineral Resources",
    columns: ["Year", "Production", "Exports"],
    rows: [
      { Year: "2015", Production: 492, Exports: 381 },
      { Year: "2016", Production: 510, Exports: 395 },
      { Year: "2017", Production: 523, Exports: 399 },
      { Year: "2018", Production: 557, Exports: 439 },
      { Year: "2019", Production: 610, Exports: 464 },
      { Year: "2020", Production: 563, Exports: 405 },
      { Year: "2021", Production: 614, Exports: 434 },
      { Year: "2022", Production: 687, Exports: 494 },
      { Year: "2023", Production: 743, Exports: 518 },
      { Year: "2024*", Production: 775, Exports: 532 },
    ],
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "fdi-inflow",
    title: "Foreign Direct Investment Indonesia",
    description: "Aliran FDI masuk ke Indonesia per kuartal (USD Miliar) — berdasarkan negara asal",
    category: "Macro Foundations",
    chartType: "bar",
    color: "#CEDBEB",
    unit: "USD B",
    unitType: "currency_usd",
    chartTitle: "FDI Masuk Indonesia per Kuartal (USD Miliar)",
    xAxisLabel: "Kuartal",
    yAxisLabel: "USD Miliar",
    subtitle: "Sumber: BKPM / Bank Indonesia",
    columns: ["Quarter", "FDI (USD B)"],
    rows: [
      { Quarter: "Q1 2023", "FDI (USD B)": 5.2 },
      { Quarter: "Q2 2023", "FDI (USD B)": 5.8 },
      { Quarter: "Q3 2023", "FDI (USD B)": 5.5 },
      { Quarter: "Q4 2023", "FDI (USD B)": 6.1 },
      { Quarter: "Q1 2024", "FDI (USD B)": 5.9 },
      { Quarter: "Q2 2024", "FDI (USD B)": 6.3 },
      { Quarter: "Q3 2024", "FDI (USD B)": 6.0 },
      { Quarter: "Q4 2024", "FDI (USD B)": 6.8 },
    ],
    createdAt: "2024-06-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "investment-credit-trend",
    title: "Tren Kredit Investasi Perbankan",
    description: "Pertumbuhan kredit investasi perbankan Indonesia tahunan (YoY %)",
    category: "Financial Markets",
    chartType: "line",
    color: "#1a3a5c",
    unit: "%",
    unitType: "percent",
    chartTitle: "Pertumbuhan Kredit Investasi (YoY %)",
    xAxisLabel: "Bulan",
    yAxisLabel: "Pertumbuhan (%)",
    subtitle: "Sumber: OJK / Bank Indonesia",
    columns: ["Bulan", "Kredit Investasi", "Kredit Modal Kerja", "Kredit Konsumsi"],
    columnNames: {
      en: ["Month", "Investment Credit", "Working Capital Credit", "Consumption Credit"],
      id: ["Bulan", "Kredit Investasi", "Kredit Modal Kerja", "Kredit Konsumsi"]
    },
    rows: [
      { Bulan: "Jan 2024", "Kredit Investasi": 11.2, "Kredit Modal Kerja": 9.5, "Kredit Konsumsi": 8.7 },
      { Bulan: "Feb 2024", "Kredit Investasi": 11.5, "Kredit Modal Kerja": 9.8, "Kredit Konsumsi": 9.1 },
      { Bulan: "Mar 2024", "Kredit Investasi": 11.8, "Kredit Modal Kerja": 10.1, "Kredit Konsumsi": 9.3 },
      { Bulan: "Apr 2024", "Kredit Investasi": 12.1, "Kredit Modal Kerja": 10.3, "Kredit Konsumsi": 9.5 },
      { Bulan: "May 2024", "Kredit Investasi": 12.4, "Kredit Modal Kerja": 10.5, "Kredit Konsumsi": 9.2 },
      { Bulan: "Jun 2024", "Kredit Investasi": 12.7, "Kredit Modal Kerja": 10.4, "Kredit Konsumsi": 9.4 },
      { Bulan: "Jul 2024", "Kredit Investasi": 13.0, "Kredit Modal Kerja": 10.6, "Kredit Konsumsi": 9.6 },
      { Bulan: "Aug 2024", "Kredit Investasi": 13.2, "Kredit Modal Kerja": 10.8, "Kredit Konsumsi": 9.8 },
      { Bulan: "Sep 2024", "Kredit Investasi": 13.5, "Kredit Modal Kerja": 11.0, "Kredit Konsumsi": 10.0 },
      { Bulan: "Oct 2024", "Kredit Investasi": 13.4, "Kredit Modal Kerja": 11.2, "Kredit Konsumsi": 10.2 },
      { Bulan: "Nov 2024", "Kredit Investasi": 13.6, "Kredit Modal Kerja": 11.1, "Kredit Konsumsi": 10.3 },
      { Bulan: "Dec 2024", "Kredit Investasi": 13.62, "Kredit Modal Kerja": 11.3, "Kredit Konsumsi": 10.5 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    id: "ihpr-index",
    title: "Indeks Harga Properti Residensial (IHPR)",
    description: "Indeks Harga Properti Residensial (IHPR) dan perubahannya (triwulanan & tahunan)",
    category: "Macro Foundations",
    chartType: "combo",
    color: "#ef4444",
    unit: "Indeks",
    unitType: "number",
    chartTitle: "Indeks Harga Properti Residensial",
    xAxisLabel: "Periode",
    yAxisLabel: "Indeks / %",
    columns: ["Periode", "IHPR (lhs)", "% Perubahan Triwulan (rhs)", "% Perubahan Tahunan (rhs)"],
    colors: ["#ef4444", "#22c55e", "#1a3a5c"],
    rows: [
      { "Periode": "2020 I", "IHPR (lhs)": 102.3, "% Perubahan Triwulan (rhs)": 0.4, "% Perubahan Tahunan (rhs)": 1.5 },
      { "Periode": "2020 II", "IHPR (lhs)": 102.6, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 1.6 },
      { "Periode": "2020 III", "IHPR (lhs)": 102.8, "% Perubahan Triwulan (rhs)": 0.2, "% Perubahan Tahunan (rhs)": 1.4 },
      { "Periode": "2020 IV", "IHPR (lhs)": 103.1, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 1.2 },
      { "Periode": "2021 I", "IHPR (lhs)": 103.4, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 1.1 },
      { "Periode": "2021 II", "IHPR (lhs)": 103.7, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 1.1 },
      { "Periode": "2021 III", "IHPR (lhs)": 104.0, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 1.2 },
      { "Periode": "2021 IV", "IHPR (lhs)": 104.4, "% Perubahan Triwulan (rhs)": 0.4, "% Perubahan Tahunan (rhs)": 1.4 },
      { "Periode": "2022 I", "IHPR (lhs)": 105.1, "% Perubahan Triwulan (rhs)": 0.7, "% Perubahan Tahunan (rhs)": 1.8 },
      { "Periode": "2022 II", "IHPR (lhs)": 105.3, "% Perubahan Triwulan (rhs)": 0.2, "% Perubahan Tahunan (rhs)": 1.9 },
      { "Periode": "2022 III", "IHPR (lhs)": 106.8, "% Perubahan Triwulan (rhs)": 0.4, "% Perubahan Tahunan (rhs)": 2.1 },
      { "Periode": "2022 IV", "IHPR (lhs)": 107.1, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 2.2 },
      { "Periode": "2023 I", "IHPR (lhs)": 107.5, "% Perubahan Triwulan (rhs)": 0.4, "% Perubahan Tahunan (rhs)": 2.1 },
      { "Periode": "2023 II", "IHPR (lhs)": 108.0, "% Perubahan Triwulan (rhs)": 0.5, "% Perubahan Tahunan (rhs)": 2.2 },
      { "Periode": "2023 III", "IHPR (lhs)": 108.3, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 2.2 },
      { "Periode": "2023 IV", "IHPR (lhs)": 108.6, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 2.0 },
      { "Periode": "2024 I", "IHPR (lhs)": 109.1, "% Perubahan Triwulan (rhs)": 0.5, "% Perubahan Tahunan (rhs)": 2.1 },
      { "Periode": "2024 II", "IHPR (lhs)": 109.4, "% Perubahan Triwulan (rhs)": 0.3, "% Perubahan Tahunan (rhs)": 1.9 },
      { "Periode": "2024 III", "IHPR (lhs)": 109.65, "% Perubahan Triwulan (rhs)": 0.2, "% Perubahan Tahunan (rhs)": 1.7 },
      { "Periode": "2024 IV", "IHPR (lhs)": 109.8, "% Perubahan Triwulan (rhs)": 0.15, "% Perubahan Tahunan (rhs)": 1.6 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-04-14T00:00:00.000Z",
  },
];

export const SEED_PAGES: Page[] = [
  // ─── Home ───────────────────────────────────────────────────────────────────
  {
    id: 1,
    slug: "/",
    locale: "en",
    status: "published",
    title: "AndaraLab — Independent Economic Research for Indonesia",
    description: "AndaraLab produces independent macroeconomic research, sectoral analysis, and market intelligence for Indonesia and emerging markets.",
    navLabel: "Home",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Independent Economic Research for Indonesia",
        subheadline: "Independent. Rigorous. Indonesia-focused. We bridge the gap between complex macro-economic data and actionable intelligence.",
        ctaText: "Explore Research",
        ctaHref: "/macro/macro-outlooks",
      },
      {
        type: "stats",
        items: [
          { label: "Macro Reports", value: "24+" },
          { label: "Sectors Covered", value: "8" },
          { label: "Years of Data", value: "28+" },
          { label: "Research Team", value: "6" },
        ],
      },
      {
        type: "featured",
        slugs: ["nickel-ev-indonesia", "digital-economy-indonesia-2026", "bank-mandatory-ratio-q1-2026"],
        limit: 3,
      },
      {
        type: "chart",
        datasetId: "gdp-growth",
        title: "GDP Growth Trend",
      },
      {
        type: "cta",
        heading: "Stay ahead of Indonesia's economic landscape",
        body: "Subscribe to receive our latest macro research, sectoral deep-dives, and market intelligence directly to your inbox.",
        buttonText: "Subscribe to Research",
        buttonHref: "/contact",
      },
    ],
  },
  {
    id: 2,
    slug: "/",
    locale: "id",
    status: "published",
    title: "AndaraLab — Riset Ekonomi Independen untuk Indonesia",
    description: "AndaraLab memproduksi riset makroekonomi independen, analisis sektoral, dan intelijen pasar untuk Indonesia dan pasar berkembang.",
    navLabel: "Beranda",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Riset Ekonomi Independen untuk Indonesia",
        subheadline: "Independen. Ketat. Berfokus pada Indonesia. Kami menjembatani kesenjangan antara data makroekonomi dan intelijen pasar.",
        ctaText: "Jelajahi Riset",
        ctaHref: "/macro/macro-outlooks",
      },
      {
        type: "stats",
        items: [
          { label: "Laporan Makro", value: "24+" },
          { label: "Sektor Tercakup", value: "8" },
          { label: "Tahun Data", value: "28+" },
          { label: "Tim Riset", value: "6" },
        ],
      },
      {
        type: "featured",
        slugs: ["ri-transmigration-nickel-downstreaming", "prospeks-makro-indonesia-2026-id", "food-inflation-handling-indonesia"],
        limit: 3,
      },
      {
        type: "chart",
        datasetId: "gdp-growth",
        title: "Tren Pertumbuhan PDB",
      },
      {
        type: "cta",
        heading: "Kuasai lanskap ekonomi Indonesia",
        body: "Berlangganan untuk menerima riset makro, analisis sektoral, dan intelijen pasar terbaru kami langsung ke kotak masuk Anda.",
        buttonText: "Berlangganan Riset",
        buttonHref: "/contact",
      },
    ],
  },

  // ─── About ──────────────────────────────────────────────────────────────────
  {
    id: 3,
    slug: "/about",
    locale: "en",
    status: "published",
    title: "About AndaraLab",
    description: "AndaraLab is a premier economic research hub under PT. Andara Investasi Cerdas, decoding economies and empowering growth.",
    navLabel: "About Us",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "A Laboratory for Economic Intelligence",
        subheadline: "AndaraLab bridges the gap between complex macro-economic data and actionable intelligence, built on the pillar of 'Tumbuh' (Growth).",
      },
      {
        type: "stats",
        items: [
          { label: "Economic Indicators Tracked", value: "100+" },
          { label: "Economies Monitored", value: "15+" },
          { label: "Research Verticals", value: "5+" },
          { label: "Founded, Jakarta", value: "2019" },
        ],
      },
      {
        type: "text",
        content: "At AndaraLab, we operate as a premier economic research hub under PT. Andara Investasi Cerdas. We bridge the gap between complex macro-economic data and actionable intelligence. Built on the pillar of \"Tumbuh\" (Growth), our mission is to provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape.",
      },
      {
        type: "about",
        headline: "Our Approach",
        items: [
          { label: "Rigor", value: "Every analysis is grounded in verified data sources, peer-reviewed methodology, and transparent assumptions." },
          { label: "Relevance", value: "We focus on what matters now — policy shifts, market dislocations, and structural economic changes." },
          { label: "Clarity", value: "Complex economic intelligence translated into clear, actionable insights for decision-makers." },
        ],
      },
      {
        type: "cta",
        heading: "Partner with AndaraLab",
        body: "Reach out to our research team for partnerships, research inquiries, or media requests.",
        buttonText: "Get in Touch",
        buttonHref: "/contact",
      },
    ],
  },
  {
    id: 4,
    slug: "/about",
    locale: "id",
    status: "published",
    title: "Tentang AndaraLab",
    description: "AndaraLab adalah pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas.",
    navLabel: "Tentang Kami",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Laboratorium untuk Intelijen Ekonomi",
        subheadline: "AndaraLab menjembatani kesenjangan antara data makroekonomi yang kompleks dan intelijen yang dapat ditindaklanjuti.",
      },
      {
        type: "stats",
        items: [
          { label: "Indikator Ekonomi Dipantau", value: "100+" },
          { label: "Ekonomi Dimonitor", value: "15+" },
          { label: "Vertikal Riset", value: "5+" },
          { label: "Didirikan, Jakarta", value: "2019" },
        ],
      },
      {
        type: "text",
        content: "Di AndaraLab, kami beroperasi sebagai pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas. Kami menjembatani kesenjangan antara data makroekonomi yang kompleks dan intelijen yang dapat ditindaklanjuti. Dibangun di atas pilar \"Tumbuh\", misi kami adalah menyediakan fondasi analitis yang memungkinkan mitra kami berkembang.",
      },
      {
        type: "about",
        headline: "Pendekatan Kami",
        items: [
          { label: "Ketelitian", value: "Setiap analisis didasarkan pada sumber data terverifikasi, metodologi yang ditinjau sejawat, dan asumsi yang transparan." },
          { label: "Relevansi", value: "Kami fokus pada apa yang penting sekarang — pergeseran kebijakan, dislokasi pasar, dan perubahan struktural ekonomi." },
          { label: "Kejelasan", value: "Intelijen ekonomi yang kompleks diterjemahkan menjadi wawasan yang jelas dan dapat ditindaklanjuti bagi pengambil keputusan." },
        ],
      },
      {
        type: "cta",
        heading: "Bermitra dengan AndaraLab",
        body: "Hubungi tim riset kami untuk kemitraan, pertanyaan riset, atau permintaan media.",
        buttonText: "Hubungi Kami",
        buttonHref: "/contact",
      },
    ],
  },

  // ─── Macro Foundations ──────────────────────────────────────────────────────
  {
    id: 5,
    slug: "/macro/macro-outlooks",
    locale: "en",
    status: "published",
    title: "Macro Outlooks",
    description: "In-depth analysis of Indonesia's macroeconomic trends, growth drivers, and risks.",
    navLabel: "Macro Outlooks",
    section: "Macro Foundations",
    content: [
      {
        type: "hero",
        headline: "Macro Outlooks",
        subheadline: "In-depth analysis of Indonesia's macroeconomic trends, growth drivers, and risks.",
      },
      {
        type: "chart",
        datasetId: "gdp-growth",
        title: "GDP Growth Rate",
      },
      {
        type: "posts",
        categories: ["macro-outlooks", "Macro Outlooks", "macro", "Macro"],
        title: "Latest Macro Research",
      },
    ],
  },
  {
    id: 6,
    slug: "/macro/macro-outlooks",
    locale: "id",
    status: "published",
    title: "Prospek Makro",
    description: "Analisis mendalam tentang tren makroekonomi Indonesia, pendorong pertumbuhan, dan risiko.",
    navLabel: "Prospek Makro",
    section: "Fondasi Makro",
    content: [
      {
        type: "hero",
        headline: "Prospek Makro",
        subheadline: "Analisis mendalam tentang tren makroekonomi Indonesia, pendorong pertumbuhan, dan risiko.",
      },
      {
        type: "chart",
        datasetId: "gdp-growth",
        title: "Tingkat Pertumbuhan PDB",
      },
      {
        type: "posts",
        categories: ["macro-outlooks", "Prospek Makro", "macro"],
        title: "Riset Makro Terbaru",
      },
    ],
  },
  {
    id: 7,
    slug: "/macro/policy-monetary",
    locale: "en",
    status: "published",
    title: "Policy & Monetary Watch",
    description: "Tracking Bank Indonesia policy, monetary conditions, and fiscal developments.",
    navLabel: "Policy & Monetary Watch",
    section: "Macro Foundations",
    content: [
      {
        type: "hero",
        headline: "Policy & Monetary Watch",
        subheadline: "Tracking Bank Indonesia policy, monetary conditions, and fiscal developments.",
      },
      {
        type: "chart",
        datasetId: "bi-rate",
        title: "BI Policy Rate",
      },
      {
        type: "posts",
        categories: ["monetary", "Monetary", "policy-monetary", "Policy & Monetary"],
        title: "Latest Policy Research",
      },
    ],
  },
  {
    id: 8,
    slug: "/macro/policy-monetary",
    locale: "id",
    status: "published",
    title: "Kebijakan & Moneter",
    description: "Memantau kebijakan Bank Indonesia, kondisi moneter, dan perkembangan fiskal.",
    navLabel: "Kebijakan & Moneter",
    section: "Fondasi Makro",
    content: [
      {
        type: "hero",
        headline: "Kebijakan & Moneter",
        subheadline: "Memantau kebijakan Bank Indonesia, kondisi moneter, dan perkembangan fiskal.",
      },
      {
        type: "chart",
        datasetId: "bi-rate",
        title: "Suku Bunga BI",
      },
      {
        type: "posts",
        categories: ["monetary", "policy-monetary"],
        title: "Riset Kebijakan Terbaru",
      },
    ],
  },
  {
    id: 9,
    slug: "/macro/geopolitical",
    locale: "en",
    status: "published",
    title: "Geopolitical & Structural Analysis",
    description: "Analyzing geopolitical dynamics and structural shifts affecting Indonesia and the region.",
    navLabel: "Geopolitical & Structural Analysis",
    section: "Macro Foundations",
    content: [
      {
        type: "hero",
        headline: "Geopolitical & Structural Analysis",
        subheadline: "Analyzing geopolitical dynamics and structural shifts affecting Indonesia and the region.",
      },
      {
        type: "posts",
        categories: ["geopolitical", "Geopolitical", "Geopolitical & Structural Analysis"],
        title: "Latest Geopolitical Research",
      },
    ],
  },
  {
    id: 10,
    slug: "/macro/geopolitical",
    locale: "id",
    status: "published",
    title: "Analisis Geopolitik & Struktural",
    description: "Menganalisis dinamika geopolitik dan pergeseran struktural yang mempengaruhi Indonesia dan kawasan.",
    navLabel: "Analisis Geopolitik & Struktural",
    section: "Fondasi Makro",
    content: [
      {
        type: "hero",
        headline: "Analisis Geopolitik & Struktural",
        subheadline: "Menganalisis dinamika geopolitik dan pergeseran struktural yang mempengaruhi Indonesia dan kawasan.",
      },
      {
        type: "posts",
        categories: ["geopolitical", "Geopolitical", "Geopolitical & Structural Analysis"],
        title: "Riset Geopolitik Terbaru",
      },
    ],
  },

  // ─── Sectoral Intelligence ──────────────────────────────────────────────────
  {
    id: 11,
    slug: "/sectoral/deep-dives",
    locale: "en",
    status: "published",
    title: "Strategic Industry Deep-dives",
    description: "Rigorous sector-level analysis of Indonesia's key industries and their strategic outlook.",
    navLabel: "Strategic Industry Deep-dives",
    section: "Sectoral Intelligence",
    content: [
      {
        type: "hero",
        headline: "Strategic Industry Deep-dives",
        subheadline: "Rigorous sector-level analysis of Indonesia's key industries and their strategic outlook.",
      },
      {
        type: "chart",
        datasetId: "nickel-production",
        title: "Nickel Production",
      },
      {
        type: "posts",
        categories: ["sectoral", "Sectoral Intelligence", "deep-dives", "sectoral-analysis"],
        title: "Latest Sectoral Research",
      },
    ],
  },
  {
    id: 12,
    slug: "/sectoral/deep-dives",
    locale: "id",
    status: "published",
    title: "Analisis Mendalam Industri Strategis",
    description: "Analisis tingkat sektor yang ketat dari industri-industri utama Indonesia.",
    navLabel: "Analisis Mendalam Industri Strategis",
    section: "Intelijen Sektoral",
    content: [
      {
        type: "hero",
        headline: "Analisis Mendalam Industri Strategis",
        subheadline: "Analisis tingkat sektor yang ketat dari industri-industri utama Indonesia dan prospek strategisnya.",
      },
      {
        type: "chart",
        datasetId: "nickel-production",
        title: "Produksi Nikel",
      },
      {
        type: "posts",
        categories: ["sectoral", "sectoral-analysis", "deep-dives"],
        title: "Riset Sektoral Terbaru",
      },
    ],
  },
  {
    id: 13,
    slug: "/sectoral/regional",
    locale: "en",
    status: "published",
    title: "Regional Economic Monitor",
    description: "Monitoring regional economic performance across Java, Sumatra, Kalimantan, and beyond.",
    navLabel: "Regional Economic Monitor",
    section: "Sectoral Intelligence",
    content: [
      {
        type: "hero",
        headline: "Regional Economic Monitor",
        subheadline: "Monitoring regional economic performance across Java, Sumatra, Kalimantan, and beyond.",
      },
      {
        type: "posts",
        categories: ["regional", "Regional Monitor", "Regional"],
        title: "Latest Regional Research",
      },
    ],
  },
  {
    id: 14,
    slug: "/sectoral/regional",
    locale: "id",
    status: "published",
    title: "Monitor Ekonomi Regional",
    description: "Memantau kinerja ekonomi regional di Jawa, Sumatera, Kalimantan, dan sekitarnya.",
    navLabel: "Monitor Ekonomi Regional",
    section: "Intelijen Sektoral",
    content: [
      {
        type: "hero",
        headline: "Monitor Ekonomi Regional",
        subheadline: "Memantau kinerja ekonomi regional di Jawa, Sumatera, Kalimantan, dan sekitarnya.",
      },
      {
        type: "posts",
        categories: ["regional", "Regional"],
        title: "Riset Regional Terbaru",
      },
    ],
  },
  {
    id: 15,
    slug: "/sectoral/esg",
    locale: "en",
    status: "published",
    title: "ESG",
    description: "Environmental, social, and governance analysis for Indonesian corporations and investors.",
    navLabel: "ESG",
    section: "Sectoral Intelligence",
    content: [
      {
        type: "hero",
        headline: "ESG",
        subheadline: "Environmental, social, and governance analysis for Indonesian corporations and investors.",
      },
      {
        type: "posts",
        categories: ["esg", "ESG"],
        title: "Latest ESG Research",
      },
    ],
  },
  {
    id: 16,
    slug: "/sectoral/esg",
    locale: "id",
    status: "published",
    title: "ESG",
    description: "Analisis lingkungan, sosial, dan tata kelola untuk korporasi dan investor Indonesia.",
    navLabel: "ESG",
    section: "Intelijen Sektoral",
    content: [
      {
        type: "hero",
        headline: "ESG",
        subheadline: "Analisis lingkungan, sosial, dan tata kelola untuk korporasi dan investor Indonesia.",
      },
      {
        type: "posts",
        categories: ["esg", "ESG"],
        title: "Riset ESG Terbaru",
      },
    ],
  },

  // ─── Blog sections ──────────────────────────────────────────────────────────
  {
    id: 17,
    slug: "/blog/economics-101",
    locale: "en",
    status: "published",
    title: "Economics 101",
    description: "Foundational economic concepts explained through the lens of Indonesia's economy.",
    navLabel: "Economics 101",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Economics 101",
        subheadline: "Foundational economic concepts explained through the lens of Indonesia's economy.",
      },
      {
        type: "posts",
        categories: ["economics-101"],
        title: "Economics 101 Articles",
      },
    ],
  },
  {
    id: 18,
    slug: "/blog/economics-101",
    locale: "id",
    status: "published",
    title: "Ekonomi 101",
    description: "Konsep ekonomi dasar dijelaskan melalui lensa ekonomi Indonesia.",
    navLabel: "Ekonomi 101",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Ekonomi 101",
        subheadline: "Konsep ekonomi dasar dijelaskan melalui lensa ekonomi Indonesia.",
      },
      {
        type: "posts",
        categories: ["economics-101"],
        title: "Artikel Ekonomi 101",
      },
    ],
  },
  {
    id: 19,
    slug: "/blog/market-pulse",
    locale: "en",
    status: "published",
    title: "Market Pulse",
    description: "Short-form market commentary and real-time analysis of Indonesian financial markets.",
    navLabel: "Market Pulse",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Market Pulse",
        subheadline: "Short-form market commentary and real-time analysis of Indonesian financial markets.",
      },
      {
        type: "posts",
        categories: ["market-pulse"],
        title: "Market Pulse Articles",
      },
    ],
  },
  {
    id: 20,
    slug: "/blog/market-pulse",
    locale: "id",
    status: "published",
    title: "Pulsa Pasar",
    description: "Komentar pasar singkat dan analisis real-time pasar keuangan Indonesia.",
    navLabel: "Pulsa Pasar",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Pulsa Pasar",
        subheadline: "Komentar pasar singkat dan analisis real-time pasar keuangan Indonesia.",
      },
      {
        type: "posts",
        categories: ["market-pulse"],
        title: "Artikel Pulsa Pasar",
      },
    ],
  },
  {
    id: 21,
    slug: "/blog/lab-notes",
    locale: "en",
    status: "published",
    title: "Lab Notes",
    description: "Behind-the-scenes notes on our research methodology, data sources, and analytical frameworks.",
    navLabel: "Lab Notes",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Lab Notes",
        subheadline: "Behind-the-scenes notes on our research methodology, data sources, and analytical frameworks.",
      },
      {
        type: "posts",
        categories: ["lab-notes"],
        title: "Lab Notes Articles",
      },
    ],
  },
  {
    id: 22,
    slug: "/blog/lab-notes",
    locale: "id",
    status: "published",
    title: "Catatan Lab",
    description: "Catatan di balik layar tentang metodologi riset, sumber data, dan kerangka analitis kami.",
    navLabel: "Catatan Lab",
    section: "root",
    content: [
      {
        type: "hero",
        headline: "Catatan Lab",
        subheadline: "Catatan di balik layar tentang metodologi riset, sumber data, dan kerangka analitis kami.",
      },
      {
        type: "posts",
        categories: ["lab-notes"],
        title: "Artikel Catatan Lab",
      },
    ],
  },
];

export const SEED_BLOG_POSTS: BlogPost[] = [
  // ─── sectoral-analysis ──────────────────────────────────────────────────────
  {
    id: 1,
    slug: "nickel-ev-indonesia",
    locale: "en",
    status: "published",
    title: "The Future of Indonesia's Nickel Downstreaming in the EV Era",
    excerpt: "Analysis of the strategic importance of Indonesia's nickel reserves for the global electric vehicle supply chain.",
    body: [
      "Nickel is at the heart of the global transition to electric vehicles. Indonesia, holding the world's largest nickel reserves, has moved aggressively to ban raw ore exports and build a domestic industrial base.",
      "The 2020 nickel ore export ban was a watershed moment. By forcing downstream processing onshore, Indonesia has attracted billions in foreign direct investment — primarily from Chinese battery manufacturers — and created a nascent EV battery supply chain.",
      "However, the strategy is not without risks. Global nickel prices have been volatile, and the rapid expansion of Indonesian nickel processing capacity has contributed to a supply glut that has pressured margins across the value chain.",
      "Looking ahead, Indonesia's ability to move up the value chain — from nickel pig iron and ferronickel toward battery-grade nickel sulfate and ultimately battery cells — will determine whether the country captures the full economic rent from its resource endowment.",
    ],
    category: "sectoral-analysis",
    tag: "Nickel",
    readTime: "8 min read",
    publishedAt: "2026-01-15T00:00:00.000Z",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: 2,
    slug: "coal-transition-indonesia",
    locale: "en",
    status: "published",
    title: "Indonesia's Coal Sector: Managing the Energy Transition",
    excerpt: "How Indonesia balances its role as the world's top thermal coal exporter with growing pressure to decarbonize.",
    body: [
      "Indonesia is the world's largest exporter of thermal coal, a position that generates significant export revenues but increasingly conflicts with global climate commitments.",
      "The country's coal production hit a record 743 million tonnes in 2023, driven by strong demand from India and Southeast Asia even as European buyers retreated. This demand resilience has given Indonesian policymakers breathing room, but the structural shift away from coal in power generation is accelerating.",
      "The government's Just Energy Transition Partnership (JETP) framework, backed by $20 billion in international financing, aims to accelerate the retirement of coal-fired power plants and scale up renewables. Implementation, however, has been slow.",
      "For investors, the key question is the pace of coal demand decline in Asia. Our base case sees Indonesian coal exports remaining elevated through 2028 before a more pronounced structural decline sets in.",
    ],
    category: "sectoral-analysis",
    tag: "Energy",
    readTime: "7 min read",
    publishedAt: "2026-02-10T00:00:00.000Z",
    createdAt: "2026-02-10T00:00:00.000Z",
    updatedAt: "2026-02-10T00:00:00.000Z",
  },

  // ─── macro-outlooks ──────────────────────────────────────────────────────────
  {
    id: 3,
    slug: "indonesia-macro-outlook-2026",
    locale: "en",
    status: "published",
    title: "Indonesia Macro Outlook 2026: Resilience Amid Global Headwinds",
    excerpt: "Indonesia's economy is projected to grow 5.1% in 2026, supported by domestic consumption and infrastructure investment despite global uncertainty.",
    body: [
      "Indonesia enters 2026 with a solid macroeconomic foundation. GDP growth is projected at 5.1% for the full year, underpinned by robust household consumption, continued public infrastructure spending, and a recovery in commodity export revenues.",
      "The key risks to this outlook are external: a sharper-than-expected slowdown in China — Indonesia's largest trading partner — would weigh on commodity demand and export earnings. Elevated US interest rates have also kept the rupiah under pressure, complicating Bank Indonesia's monetary policy calculus.",
      "On the fiscal side, the government has maintained a prudent deficit target of 2.5% of GDP, providing room for counter-cyclical spending if growth disappoints. The new administration's focus on downstream industrialization and food security investment should provide additional demand support.",
      "Our base case remains constructive on Indonesian growth, with risks skewed to the downside from external factors rather than domestic fundamentals.",
    ],
    category: "macro-outlooks",
    tag: "Macro",
    readTime: "9 min read",
    publishedAt: "2026-01-20T00:00:00.000Z",
    createdAt: "2026-01-20T00:00:00.000Z",
    updatedAt: "2026-01-20T00:00:00.000Z",
  },
  {
    id: 4,
    slug: "prospeks-makro-indonesia-2026-id",
    locale: "id",
    status: "published",
    title: "Prospek Makro Indonesia 2026: Navigasi di Tengah Ketidakpastian Global",
    excerpt: "Analisis mendalam tentang kekuatan ekonomi domestik Indonesia menghadapi tantangan global.",
    body: [
      "Ekonomi Indonesia diprediksi akan tetap tangguh pada tahun 2026, didorong oleh konsumsi domestik yang kuat dan investasi infrastruktur yang berkelanjutan.",
      "Pertumbuhan PDB diproyeksikan sebesar 5,1% untuk tahun penuh, didukung oleh konsumsi rumah tangga yang kuat, belanja infrastruktur publik yang berkelanjutan, dan pemulihan pendapatan ekspor komoditas.",
      "Risiko utama terhadap outlook ini bersifat eksternal: perlambatan yang lebih tajam dari perkiraan di China — mitra dagang terbesar Indonesia — akan membebani permintaan komoditas dan pendapatan ekspor.",
      "Kasus dasar kami tetap konstruktif terhadap pertumbuhan Indonesia, dengan risiko condong ke bawah dari faktor eksternal daripada fundamental domestik.",
    ],
    category: "macro-outlooks",
    tag: "Makro",
    readTime: "9 menit baca",
    publishedAt: "2026-02-01T00:00:00.000Z",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },

  // ─── monetary / policy-monetary ─────────────────────────────────────────────
  {
    id: 5,
    slug: "bi-rate-hold-q1-2026",
    locale: "en",
    status: "published",
    title: "Bank Indonesia Holds Rate at 6.00%: What It Means for Markets",
    excerpt: "BI's decision to hold the benchmark rate steady reflects a careful balance between rupiah stability and supporting growth.",
    body: [
      "Bank Indonesia held its 7-Day Reverse Repo Rate at 6.00% at its March 2026 meeting, in line with market expectations. The decision reflects the central bank's ongoing effort to balance rupiah stability against the need to support economic growth.",
      "The rupiah has faced persistent depreciation pressure amid a strong US dollar environment. BI has intervened in the foreign exchange market and used its rate policy to anchor the currency, accepting some drag on domestic credit growth as a consequence.",
      "Core inflation remains well-anchored at around 2.0%, giving BI room to eventually ease policy once the external environment stabilizes. Our base case sees the first rate cut in Q3 2026, contingent on Fed easing and rupiah stabilization.",
      "For bond markets, the hold was broadly priced in. The 10-year SBN yield has stabilized around 7.0%, offering attractive real yields relative to regional peers.",
    ],
    category: "monetary",
    tag: "Monetary Policy",
    readTime: "6 min read",
    publishedAt: "2026-03-20T00:00:00.000Z",
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
  },
  {
    id: 6,
    slug: "kebijakan-bi-q1-2026-id",
    locale: "id",
    status: "published",
    title: "Bank Indonesia Tahan Suku Bunga 6,00%: Implikasi bagi Pasar",
    excerpt: "Keputusan BI mempertahankan suku bunga acuan mencerminkan keseimbangan antara stabilitas rupiah dan dukungan pertumbuhan.",
    body: [
      "Bank Indonesia mempertahankan Suku Bunga Acuan 7 Hari (BI-7DRR) di level 6,00% pada rapat Maret 2026, sesuai ekspektasi pasar.",
      "Rupiah menghadapi tekanan depresiasi yang persisten di tengah lingkungan dolar AS yang kuat. BI telah melakukan intervensi di pasar valuta asing dan menggunakan kebijakan suku bunga untuk menjangkar mata uang.",
      "Inflasi inti tetap terjangkar dengan baik di sekitar 2,0%, memberikan BI ruang untuk akhirnya melonggarkan kebijakan setelah lingkungan eksternal stabil.",
      "Kasus dasar kami melihat pemotongan suku bunga pertama pada Q3 2026, bergantung pada pelonggaran Fed dan stabilisasi rupiah.",
    ],
    category: "monetary",
    tag: "Kebijakan Moneter",
    readTime: "6 menit baca",
    publishedAt: "2026-03-20T00:00:00.000Z",
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
  },

  // ─── geopolitical ────────────────────────────────────────────────────────────
  {
    id: 7,
    slug: "asean-supply-chain-shift-2026",
    locale: "en",
    status: "published",
    title: "ASEAN's Supply Chain Moment: Indonesia's Strategic Position",
    excerpt: "As global supply chains restructure away from China, Indonesia is positioning itself as a key manufacturing and processing hub.",
    body: [
      "The restructuring of global supply chains — accelerated by US-China trade tensions and the COVID-19 pandemic — has created a significant opportunity for ASEAN economies, and Indonesia in particular.",
      "Indonesia's combination of large domestic market, abundant natural resources, and improving infrastructure makes it a compelling destination for supply chain diversification. FDI inflows have been rising, with particular strength in battery materials, electronics assembly, and food processing.",
      "However, Indonesia faces stiff competition from Vietnam, Thailand, and India for manufacturing investment. Regulatory complexity, infrastructure gaps outside Java, and labor market rigidities remain key constraints.",
      "Our view is that Indonesia will capture a meaningful share of supply chain diversification flows, but the gains will be concentrated in resource-linked industries rather than broad-based manufacturing.",
    ],
    category: "geopolitical",
    tag: "Geopolitics",
    readTime: "8 min read",
    publishedAt: "2026-02-25T00:00:00.000Z",
    createdAt: "2026-02-25T00:00:00.000Z",
    updatedAt: "2026-02-25T00:00:00.000Z",
  },

  // ─── regional ────────────────────────────────────────────────────────────────
  {
    id: 8,
    slug: "kalimantan-economic-monitor-2026",
    locale: "en",
    status: "published",
    title: "Kalimantan Economic Monitor: Beyond Coal and Palm Oil",
    excerpt: "Kalimantan's economy is diversifying as the new capital Nusantara drives construction activity and services growth.",
    body: [
      "Kalimantan has long been defined by its extractive industries — coal mining and palm oil plantations. But the construction of Indonesia's new capital city, Nusantara, is beginning to reshape the island's economic profile.",
      "Construction activity in East Kalimantan has surged, driving demand for cement, steel, and construction services. The government's infrastructure investment in roads, ports, and utilities is also improving connectivity across the island.",
      "Coal production remains a significant contributor to regional GDP, but the long-term trajectory is one of managed decline as global energy transition accelerates. Palm oil faces its own headwinds from EU deforestation regulations.",
      "The Nusantara project, if executed successfully, could catalyze a broader economic transformation of Kalimantan — shifting the center of gravity from extraction toward services, government, and technology.",
    ],
    category: "regional",
    tag: "Regional",
    readTime: "7 min read",
    publishedAt: "2026-03-05T00:00:00.000Z",
    createdAt: "2026-03-05T00:00:00.000Z",
    updatedAt: "2026-03-05T00:00:00.000Z",
  },
  {
    id: 9,
    slug: "monitor-ekonomi-jawa-2026-id",
    locale: "id",
    status: "published",
    title: "Monitor Ekonomi Jawa 2026: Pusat Pertumbuhan yang Terus Bergerak",
    excerpt: "Jawa tetap menjadi mesin pertumbuhan ekonomi Indonesia, dengan sektor manufaktur dan jasa yang terus berkembang.",
    body: [
      "Jawa tetap menjadi pusat ekonomi Indonesia, menyumbang sekitar 57% dari PDB nasional. Konsentrasi industri manufaktur, jasa keuangan, dan perdagangan di pulau ini memberikan fondasi yang kuat untuk pertumbuhan berkelanjutan.",
      "Kawasan industri di Jawa Barat dan Jawa Tengah terus menarik investasi asing, terutama di sektor elektronik, tekstil, dan komponen otomotif. Upah yang kompetitif dan infrastruktur yang relatif baik menjadi daya tarik utama.",
      "Namun, kemacetan infrastruktur di Jabodetabek dan tekanan biaya hidup yang meningkat mulai mendorong relokasi sebagian aktivitas industri ke luar Jawa.",
    ],
    category: "regional",
    tag: "Regional",
    readTime: "6 menit baca",
    publishedAt: "2026-03-10T00:00:00.000Z",
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
  },

  // ─── esg ─────────────────────────────────────────────────────────────────────
  {
    id: 10,
    slug: "indonesia-esg-investment-landscape",
    locale: "en",
    status: "published",
    title: "Indonesia's ESG Investment Landscape: Progress and Gaps",
    excerpt: "ESG investing is gaining traction in Indonesia, but significant gaps remain in disclosure standards, green finance infrastructure, and corporate governance.",
    body: [
      "Environmental, social, and governance (ESG) considerations are increasingly shaping investment decisions in Indonesia, driven by both domestic regulatory push and international investor demand.",
      "The OJK (Financial Services Authority) has introduced mandatory sustainability reporting requirements for listed companies, and the Indonesia Stock Exchange has launched an ESG index. Green bond issuance has grown rapidly, with the government's sovereign green sukuk program attracting strong international demand.",
      "However, significant gaps remain. Corporate ESG disclosure quality is uneven, with many companies providing boilerplate reporting rather than substantive data. Deforestation and land use change remain major ESG risks for Indonesian corporates, particularly in palm oil and mining.",
      "For investors, the opportunity lies in identifying companies that are genuinely improving their ESG performance rather than simply improving their reporting. This requires deep sector knowledge and on-the-ground due diligence.",
    ],
    category: "esg",
    tag: "ESG",
    readTime: "8 min read",
    publishedAt: "2026-01-30T00:00:00.000Z",
    createdAt: "2026-01-30T00:00:00.000Z",
    updatedAt: "2026-01-30T00:00:00.000Z",
  },

  // ─── economics-101 ───────────────────────────────────────────────────────────
  {
    id: 11,
    slug: "understanding-inflation-indonesia",
    locale: "en",
    status: "published",
    title: "Understanding Inflation: Why Prices Rise and What It Means for You",
    excerpt: "A clear explanation of inflation mechanics, how Bank Indonesia manages it, and what it means for everyday Indonesians.",
    body: [
      "Inflation is one of the most discussed but least understood economic concepts. At its core, inflation simply means that the general level of prices in an economy is rising over time — which means each unit of currency buys less than it did before.",
      "In Indonesia, inflation is measured by the Consumer Price Index (CPI), which tracks the prices of a basket of goods and services that a typical household buys. The basket includes food, housing, transportation, healthcare, and education.",
      "Bank Indonesia's primary mandate is to maintain price stability, which it defines as keeping inflation within a target band of 2.5% ± 1%. When inflation rises above this band, BI typically raises interest rates to cool demand. When inflation falls below, it may cut rates to stimulate the economy.",
      "For everyday Indonesians, inflation matters most through its impact on purchasing power. If your salary rises by 5% but inflation is 4%, your real purchasing power has only increased by 1%. This is why wage negotiations and cost-of-living adjustments are so important.",
    ],
    category: "economics-101",
    tag: "Basics",
    readTime: "6 min read",
    publishedAt: "2026-01-10T00:00:00.000Z",
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: 12,
    slug: "apa-itu-inflasi-id",
    locale: "id",
    status: "published",
    title: "Apa Itu Inflasi? Penjelasan Sederhana untuk Semua Orang",
    excerpt: "Penjelasan sederhana tentang mekanisme inflasi, bagaimana Bank Indonesia mengelolanya, dan apa artinya bagi masyarakat.",
    body: [
      "Inflasi adalah salah satu konsep ekonomi yang paling banyak dibicarakan namun paling sedikit dipahami. Pada intinya, inflasi berarti tingkat harga umum dalam suatu perekonomian naik dari waktu ke waktu.",
      "Di Indonesia, inflasi diukur oleh Indeks Harga Konsumen (IHK), yang melacak harga sekeranjang barang dan jasa yang dibeli oleh rumah tangga tipikal.",
      "Mandat utama Bank Indonesia adalah menjaga stabilitas harga, yang didefinisikan sebagai menjaga inflasi dalam kisaran target 2,5% ± 1%. Ketika inflasi naik di atas kisaran ini, BI biasanya menaikkan suku bunga untuk mendinginkan permintaan.",
      "Bagi masyarakat Indonesia sehari-hari, inflasi paling terasa melalui dampaknya pada daya beli. Jika gaji Anda naik 5% tetapi inflasi 4%, daya beli riil Anda hanya meningkat 1%.",
    ],
    category: "economics-101",
    tag: "Dasar",
    readTime: "6 menit baca",
    publishedAt: "2026-01-12T00:00:00.000Z",
    createdAt: "2026-01-12T00:00:00.000Z",
    updatedAt: "2026-01-12T00:00:00.000Z",
  },
  {
    id: 13,
    slug: "gdp-explained-indonesia",
    locale: "en",
    status: "published",
    title: "GDP Explained: How We Measure Indonesia's Economic Size",
    excerpt: "What GDP actually measures, why it matters, and the key drivers of Indonesia's economic growth.",
    body: [
      "Gross Domestic Product (GDP) is the most widely used measure of an economy's size and health. It represents the total monetary value of all goods and services produced within a country's borders in a given period.",
      "Indonesia's GDP is measured quarterly by BPS (Statistics Indonesia) using three approaches: the expenditure approach (consumption + investment + government spending + net exports), the production approach (value added across sectors), and the income approach.",
      "Indonesia's GDP growth has been remarkably stable, averaging around 5% per year over the past decade. This stability reflects the economy's diversified structure — no single sector dominates, and domestic consumption provides a large and relatively stable demand base.",
      "The key drivers of Indonesia's growth are private consumption (around 55% of GDP), investment (around 30%), and government spending (around 10%). Net exports have been a smaller contributor, reflecting Indonesia's position as a commodity exporter but manufactured goods importer.",
    ],
    category: "economics-101",
    tag: "Basics",
    readTime: "7 min read",
    publishedAt: "2026-02-05T00:00:00.000Z",
    createdAt: "2026-02-05T00:00:00.000Z",
    updatedAt: "2026-02-05T00:00:00.000Z",
  },

  // ─── market-pulse ────────────────────────────────────────────────────────────
  {
    id: 14,
    slug: "jci-recovery-march-2026",
    locale: "en",
    status: "published",
    title: "JCI Recovery: What's Driving the March 2026 Rally",
    excerpt: "The Jakarta Composite Index has rebounded sharply in March, led by banking and consumer stocks. We break down the drivers.",
    body: [
      "The Jakarta Composite Index (JCI) has staged a notable recovery in March 2026, rising approximately 4% from its February lows. The rally has been broad-based but led by the banking sector and large-cap consumer names.",
      "The primary catalyst has been a shift in global risk sentiment following softer-than-expected US inflation data, which has revived expectations for Fed rate cuts later in 2026. This has provided relief for emerging market currencies and equities, including Indonesia.",
      "Domestically, Q4 2025 earnings results have been broadly in line with expectations, with banks reporting solid net interest margin expansion and consumer companies benefiting from resilient household spending.",
      "We maintain a constructive view on Indonesian equities for 2026, with a preference for domestic-oriented sectors (banking, consumer staples, telecommunications) over commodity exporters, which face more uncertain demand outlooks.",
    ],
    category: "market-pulse",
    tag: "Equities",
    readTime: "5 min read",
    publishedAt: "2026-03-15T00:00:00.000Z",
    createdAt: "2026-03-15T00:00:00.000Z",
    updatedAt: "2026-03-15T00:00:00.000Z",
  },
  {
    id: 15,
    slug: "rupiah-outlook-q2-2026",
    locale: "en",
    status: "published",
    title: "Rupiah Outlook Q2 2026: Navigating Dollar Strength",
    excerpt: "The rupiah faces continued pressure from a strong dollar, but Indonesia's current account dynamics and BI intervention provide support.",
    body: [
      "The Indonesian rupiah has depreciated approximately 3% against the US dollar year-to-date in 2026, reflecting broad dollar strength rather than Indonesia-specific factors.",
      "Bank Indonesia has been active in the foreign exchange market, using its substantial reserves to smooth excessive volatility. The central bank's dual intervention strategy — spot market purchases and domestic non-deliverable forward (DNDF) operations — has been effective in preventing disorderly depreciation.",
      "Indonesia's current account deficit has narrowed to around 1.5% of GDP, supported by strong commodity export revenues. This provides a more favorable external balance position compared to previous episodes of rupiah weakness.",
      "Our Q2 2026 forecast is for the rupiah to trade in the 16,000-16,500 range against the dollar, with risks skewed toward further weakness if US data continues to surprise to the upside.",
    ],
    category: "market-pulse",
    tag: "FX",
    readTime: "5 min read",
    publishedAt: "2026-04-01T00:00:00.000Z",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },

  // ─── lab-notes ───────────────────────────────────────────────────────────────
  {
    id: 16,
    slug: "how-we-build-economic-models",
    locale: "en",
    status: "published",
    title: "How We Build Economic Models at AndaraLab",
    excerpt: "A behind-the-scenes look at our econometric modeling process, data sources, and validation methodology.",
    body: [
      "Economic modeling is at the core of what we do at AndaraLab. This note explains our approach to building, validating, and communicating quantitative economic models.",
      "Our modeling process starts with a clear research question. Before writing a single line of code, we define what we are trying to explain or forecast, what the relevant theoretical framework is, and what data we need.",
      "Data sourcing is often the most time-consuming part of the process. We draw on a combination of official statistics (BPS, Bank Indonesia, OJK), international databases (IMF, World Bank, BIS), and proprietary data sources. Data quality assessment — checking for revisions, breaks in series, and methodological changes — is a critical step that is often underestimated.",
      "Model validation is where many economic models fail. We use a combination of in-sample fit statistics, out-of-sample forecasting tests, and structural stability tests to assess model reliability. We are explicit about model uncertainty and always present confidence intervals alongside point forecasts.",
    ],
    category: "lab-notes",
    tag: "Methodology",
    readTime: "10 min read",
    publishedAt: "2026-02-20T00:00:00.000Z",
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: 17,
    slug: "data-sources-indonesia-economics",
    locale: "en",
    status: "published",
    title: "The Best Data Sources for Indonesian Economic Research",
    excerpt: "A curated guide to the most reliable and comprehensive data sources for researching Indonesia's economy.",
    body: [
      "Good economic research starts with good data. This note documents the primary data sources we use at AndaraLab for Indonesian economic research.",
      "BPS (Badan Pusat Statistik) is the primary source for national accounts, inflation, trade, and demographic data. Their website provides free access to a comprehensive database, though navigating it can be challenging. The BPS API is useful for programmatic data access.",
      "Bank Indonesia publishes detailed monetary, financial, and balance of payments statistics. Their Statistics page is well-organized and includes historical data going back several decades. The BI API provides machine-readable access to key series.",
      "For financial market data, we use a combination of Bloomberg (for real-time and historical prices), Refinitiv (for bond market data), and the Indonesia Stock Exchange (IDX) for equity data. Free alternatives include Yahoo Finance and investing.com for basic price data.",
    ],
    category: "lab-notes",
    tag: "Data",
    readTime: "8 min read",
    publishedAt: "2026-03-01T00:00:00.000Z",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
];

// ─── Helper functions for localStorage caching ─────────────────────────────────

// Bump this version whenever SEED_PAGES changes significantly so stale caches are cleared.
const SEED_VERSION = "v4";
const SEED_VERSION_KEY = "andara_seed_version";

function checkAndClearStaleCache() {
  try {
    const stored = localStorage.getItem(SEED_VERSION_KEY);
    if (stored !== SEED_VERSION) {
      localStorage.removeItem("andara_datasets");
      localStorage.removeItem("andara_pages");
      localStorage.removeItem("andara_posts");
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    }
  } catch (e) {
    // ignore
  }
}

// Run once on module load
checkAndClearStaleCache();

export function getSeedDatasets(): ChartDataset[] {
  try {
    const cached = localStorage.getItem('andara_datasets');
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn('Failed to read datasets from localStorage:', e);
  }
  return SEED_DATASETS;
}

export function saveDatasetsToStorage(datasets: ChartDataset[]): void {
  try {
    localStorage.setItem('andara_datasets', JSON.stringify(datasets));
  } catch (e) {
    console.warn('Failed to save datasets to localStorage:', e);
  }
}

export function getSeedPages(): Page[] {
  try {
    const cached = localStorage.getItem('andara_pages');
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn('Failed to read pages from localStorage:', e);
  }
  return SEED_PAGES;
}

export function savePagesToStorage(pages: Page[]): void {
  try {
    localStorage.setItem('andara_pages', JSON.stringify(pages));
  } catch (e) {
    console.warn('Failed to save pages to localStorage:', e);
  }
}

export function getSeedPosts(): BlogPost[] {
  try {
    const cached = localStorage.getItem('andara_posts');
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn('Failed to read posts from localStorage:', e);
  }
  return SEED_BLOG_POSTS;
}

export function savePostsToStorage(posts: BlogPost[]): void {
  try {
    localStorage.setItem('andara_posts', JSON.stringify(posts));
  } catch (e) {
    console.warn('Failed to save posts to localStorage:', e);
  }
}

export function resetDatasetsToSeed(): ChartDataset[] {
  saveDatasetsToStorage(SEED_DATASETS);
  return SEED_DATASETS;
}

export function resetPagesToSeed(): Page[] {
  savePagesToStorage(SEED_PAGES);
  return SEED_PAGES;
}

export function resetPostsToSeed(): BlogPost[] {
  savePostsToStorage(SEED_BLOG_POSTS);
  return SEED_BLOG_POSTS;
}
