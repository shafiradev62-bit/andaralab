// i18n — Locale Context and Translation System
//
// Architecture:
// - Locale state lives at the app root, propagated via React Context.
// - Only UI chrome strings are translated (nav labels, section headers, button text, etc.).
// - Article body content is stored per-locale in the articles table (CMS-managed).
//   For the current static articles, EN is the canonical version.
// - Locale is persisted in localStorage so it survives page reloads.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type Locale = "en" | "id";
export type TranslationKey = keyof typeof translations.en;

const STORAGE_KEY = "andaralab_locale";

// ─── UI Translations ────────────────────────────────────────────────────────────

const translations = {
  en: {
    // Nav
    nav_home: "Home",
    nav_about: "About Us",
    nav_macro: "Macro Foundations",
    nav_sectoral: "Sectoral Intelligence",
    nav_data: "Data Hub",
    nav_blog: "Blog",
    nav_contact: "Contact",
    nav_macro_outlooks: "Macro Outlooks",
    nav_policy_monetary: "Policy & Monetary Watch",
    nav_geopolitical: "Geopolitical & Structural Analysis",
    nav_deep_dives: "Strategic Industry Deep-dives",
    nav_regional: "Regional Economic Monitor",
    nav_esg: "ESG",
    nav_interactive_charts: "Interactive Charts",
    nav_model_comparison: "LLM Model Comparison",
    nav_economic_calendar: "Economic Calendar",
    nav_market_dashboard: "Market Dashboard",
    nav_economics_101: "Economics 101",
    nav_market_pulse: "Market Pulse",
    nav_lab_notes: "Lab Notes",
    nav_get_in_touch: "Get in Touch",

    // Data Hub
    data_hub_title: "Economic Data & Market Intelligence",
    data_hub_subtitle: "Interactive charts, economic calendar, and live market data for Indonesia and global economies.",
    data_hub: "Data Hub",
    economic_data_market_intelligence: "Economic Data & Market Intelligence",
    interactive_charts: "Interactive Charts",
    economic_calendar: "Economic Calendar",
    market_overview: "Market Overview",
    available_datasets: "Available Datasets",
    manage_in_cms: "Manage in CMS",
    view_full_chart: "View full chart",
    chart: "Chart",
    table: "Table",
    loading_datasets: "Loading datasets…",
    no_datasets: "No datasets available.",
    could_not_reach_api: "Could not reach API server",
    api_error: "Could not reach API server",
    back_to_all_charts: "Back to all charts",
    unit_label: "Unit",
    updated_label: "Updated",
    dataset_label: "Dataset",
    category_label: "Category",
    last_updated_label: "Last Updated",
    view_all: "View all",
    all_datasets: "All Datasets",
    add_in_cms: "Add in CMS",
    dataset_not_found: "Dataset not found",
    add_one_cms: "Add one in the CMS →",
    start_api_server: "pnpm --filter api-server dev",
    showing_cached_data: "Showing cached data. Start the API server",

    // Market overview
    idr_usd: "IDR/USD",
    jci_ihsg: "JCI (IHSG)",
    bi_rate: "BI Rate",
    us_10y_yield: "US 10Y Yield",
    brent_crude: "Brent Crude",
    gold: "Gold",
    featured_charts: "Featured Charts",

    // Economic calendar
    date: "Date",
    event: "Event",
    impact: "Impact",
    actual: "Actual",
    forecast: "Forecast",
    high: "High",
    medium: "Medium",
    low: "Low",

    // Article categories
    macro_outlooks: "Macro Outlooks",
    policy_monetary: "Policy & Monetary Watch",
    geopolitical: "Geopolitical & Structural Analysis",
    deep_dives: "Strategic Industry Deep-dives",
    regional: "Regional Economic Monitor",
    esg: "ESG",
    economics_101: "Economics 101",
    market_pulse: "Market Pulse",
    lab_notes: "Lab Notes",

    // SEO / document meta (no visual layout)
    meta_site_description:
      "Independent macroeconomic research, sectoral intelligence, and interactive data for Indonesia and emerging markets.",
    meta_contact_description:
      "Contact AndaraLab for research partnerships, media inquiries, and data collaborations.",
    meta_data_description: "Interactive economic charts, calendar, and market intelligence dashboards.",
    meta_models_description:
      "Compare large language models for research: context length, pricing, and capabilities — curated by AndaraLab.",
    meta_not_found_title: "Page not found",
    meta_not_found_description: "This page does not exist or is still unpublished in the CMS.",
    meta_article_not_found_title: "Article not found",
    meta_article_not_found_description: "This article does not exist or is still a draft in the CMS.",

    // Key Metrics
    gdp_growth: "GDP Growth",
    inflation_cpi: "Inflation (CPI)",
    bi_rate_label: "BI Rate",
    idr_usd_label: "IDR/USD",
    trade_balance: "Trade Balance",
    spot_rate: "Spot rate",
    unchanged: "Unchanged",

    // Market Ticker
    live_label: "Live",

    // Hero
    independent_research_indonesia: "Independent Economic Research · Indonesia",
    decoding_economies: "Decoding Economies,",
    empowering_growth: "Empowering Growth",
    view_research_overview: "View Research Overview",
    macro_outlooks_label: "Macro Outlooks",
    data_hub_label: "Data Hub",

    // Footer
    research: "Research",
    explore: "Explore",
    company: "Company",
    about_us: "About Us",
    contact_label: "Contact",
    admin_cms: "Admin CMS",
    premier_research_hub: "A premier economic research hub under PT. Andara Investasi Cerdas.",
    decoding_empowering: "Decoding economies, empowering growth.",
    get_in_touch_label: "Get in Touch",
    all_rights_reserved: "All rights reserved.",

    // Featured Insights
    featured_insights: "Featured Insights",
    featured_insights_title: "Featured Insights",
    lihat_semua: "View all",

    // DynamicPage / 404
    page_not_found_title: "Page not found",
    page_not_found_desc: "This page does not exist or is still a draft in the CMS.",
    halamn_tidak_ada: "Halaman tidak ada atau belum dipublikasikan (masih Draft di CMS).",
    halaman_tidak_ditemukan: "Halaman tidak ditemukan",
    ke_beranda: "Ke beranda",
    go_home: "Go Home",
    untitled_page: "Untitled Page",
    no_content_yet: "This page has been created but no content blocks have been added yet.",
    structure_json_blocks: "You can structure this page using JSON blocks via the CMS.",
    loading_label: "Loading",

    // Article
    no_articles_match: "No articles match this section yet.",
    read_more_label: "Read More",
    loading_articles: "Loading articles…",

    // About section
    about_andaralab: "About AndaraLab",
    our_approach: "Our Approach",

    // Market Dashboard cards
    jun_2024: "Jun 2024",

    // Dataset editor / admin
    columns_label: "Columns",
    rows_label: "Rows",
    unit: "Unit",
    unit_type: "Unit Type",
    chart_type: "Chart Type",
    color: "Color",
    title_label: "Title",
    description_label: "Description",
    series: "Series",
    add_column: "Add Column",
    add_row: "Add Row",
    remove: "Remove",
    preview: "Preview",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    reset: "Reset",
    published: "published",
    draft: "draft",

    // Exchange Rate
    exchange_rates: "Exchange Rates",
    add_exchange_rate: "Add Exchange Rate",
    edit_exchange_rate: "Edit Exchange Rate",
    base_currency: "Base Currency",
    target_currency: "Target Currency",
    rate: "Rate",
    inverse_rate: "Inverse Rate",
    source: "Source",
    last_updated_rate: "Last Updated",
    auto_update: "Auto Update",
    manual: "Manual",

    // Generic
    back: "Back",
    loading: "Loading…",
    error: "An error occurred",
    no_results: "No results found",
    read_more: "Read more",
    min_read: "min read",
  },

  id: {
    // Nav
    nav_home: "Beranda",
    nav_about: "Tentang Kami",
    nav_macro: "Fondasi Makro",
    nav_sectoral: "Intelijen Sektoral",
    nav_data: "Pusat Data",
    nav_blog: "Blog",
    nav_contact: "Kontak",
    nav_macro_outlooks: "Prospek Makro",
    nav_policy_monetary: "Kebijakan & Moneter",
    nav_geopolitical: "Analisis Geopolitik & Struktural",
    nav_deep_dives: "Analisis Mendalam Industri Strategis",
    nav_regional: "Monitor Ekonomi Regional",
    nav_esg: "ESG",
    nav_interactive_charts: "Grafik Interaktif",
    nav_model_comparison: "Perbandingan Model LLM",
    nav_economic_calendar: "Kalender Ekonomi",
    nav_market_dashboard: "Dashboard Pasar",
    nav_economics_101: "Ekonomi 101",
    nav_market_pulse: "Pulsa Pasar",
    nav_lab_notes: "Catatan Lab",
    nav_get_in_touch: "Hubungi Kami",

    // Data Hub
    data_hub_title: "Data Ekonomi & Intelijen Pasar",
    data_hub_subtitle: "Grafik interaktif, kalender ekonomi, dan data pasar live untuk ekonomi Indonesia dan global.",
    data_hub: "Pusat Data",
    economic_data_market_intelligence: "Data Ekonomi & Intelijen Pasar",
    interactive_charts: "Grafik Interaktif",
    economic_calendar: "Kalender Ekonomi",
    market_overview: "Ikhtisar Pasar",
    available_datasets: "Dataset Tersedia",
    manage_in_cms: "Kelola di CMS",
    view_full_chart: "Lihat grafik lengkap",
    chart: "Grafik",
    table: "Tabel",
    loading_datasets: "Memuat dataset…",
    no_datasets: "Tidak ada dataset.",
    could_not_reach_api: "Tidak dapat terhubung ke server API",
    api_error: "Tidak dapat terhubung ke server API",
    back_to_all_charts: "Kembali ke semua grafik",
    unit_label: "Unit",
    updated_label: "Diperbarui",
    dataset_label: "Dataset",
    category_label: "Kategori",
    last_updated_label: "Terakhir Diperbarui",
    view_all: "Lihat semua",
    all_datasets: "Semua Dataset",
    add_in_cms: "Tambah di CMS",
    dataset_not_found: "Dataset tidak ditemukan",
    add_one_cms: "Tambah di CMS →",
    start_api_server: "pnpm --filter api-server dev",
    showing_cached_data: "Menampilkan data tersimpan. Jalankan server API",

    // Market overview
    idr_usd: "IDR/USD",
    jci_ihsg: "JCI (IHSG)",
    bi_rate: "Suku Bunga BI",
    us_10y_yield: "Imbal Hasil US 10Y",
    brent_crude: "Minyak Brent",
    gold: "Emas",

    // Economic calendar
    date: "Tanggal",
    event: "Peristiwa",
    impact: "Dampak",
    actual: "Aktual",
    forecast: "Forecast",
    high: "Tinggi",
    medium: "Sedang",
    low: "Rendah",

    // Article categories
    macro_outlooks: "Prospek Makro",
    policy_monetary: "Kebijakan & Moneter",
    geopolitical: "Analisis Geopolitik & Struktural",
    deep_dives: "Analisis Mendalam Industri Strategis",
    regional: "Monitor Ekonomi Regional",
    esg: "ESG",
    economics_101: "Ekonomi 101",
    market_pulse: "Pulsa Pasar",
    lab_notes: "Catatan Lab",

    // SEO / document meta
    meta_site_description:
      "Riset makro independen, intelijen sektoral, dan data interaktif untuk Indonesia dan pasar berkembang.",
    meta_contact_description:
      "Hubungi AndaraLab untuk kemitraan riset, media, dan kolaborasi data.",
    meta_data_description: "Grafik ekonomi interaktif, kalender ekonomi, dan dashboard intelijen pasar.",
    meta_models_description:
      "Bandingkan model bahasa besar untuk riset: panjang konteks, harga, dan kemampuan — kurasi AndaraLab.",
    meta_not_found_title: "Halaman tidak ditemukan",
    meta_not_found_description: "Halaman ini tidak ada atau belum dipublikasikan di CMS.",
    meta_article_not_found_title: "Artikel tidak ditemukan",
    meta_article_not_found_description: "Artikel ini tidak ada atau masih berstatus draf di CMS.",

    // Key Metrics
    gdp_growth: "Pertumbuhan PDB",
    inflation_cpi: "Inflasi (IHK)",
    bi_rate_label: "Suku Bunga BI",
    idr_usd_label: "IDR/USD",
    trade_balance: "Neraca Perdagangan",
    spot_rate: "Kurs spot",
    unchanged: "Tidak berubah",

    // Market Ticker
    live_label: "Live",

    // Hero
    independent_research_indonesia: "Riset Ekonomi Independen · Indonesia",
    decoding_economies: "Menguraikan Ekonomi,",
    empowering_growth: "Mendorong Pertumbuhan",
    view_research_overview: "Lihat Gambaran Riset",
    macro_outlooks_label: "Prospek Makro",
    data_hub_label: "Pusat Data",

    // Footer
    research: "Riset",
    explore: "Jelajahi",
    company: "Perusahaan",
    about_us: "Tentang Kami",
    contact_label: "Kontak",
    admin_cms: "Admin CMS",
    premier_research_hub: "Pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas.",
    decoding_empowering: "Menguraikan ekonomi, mendorong pertumbuhan.",
    get_in_touch_label: "Hubungi Kami",
    all_rights_reserved: "Hak cipta dilindungi.",

    // Featured Insights
    featured_insights: "Wawasan Pilihan",
    featured_insights_title: "Wawasan Pilihan",
    lihat_semua: "Lihat semua",

    // DynamicPage / 404
    halamn_tidak_ada: "Halaman tidak ada atau belum dipublikasikan (masih Draft di CMS).",
    halaman_tidak_ditemukan: "Halaman tidak ditemukan",
    ke_beranda: "Ke beranda",
    go_home: "Kembali ke Beranda",
    untitled_page: "Halaman Tanpa Judul",
    no_content_yet: "Halaman ini telah dibuat tetapi belum ada blok konten yang ditambahkan.",
    structure_json_blocks: "Anda dapat menyusun halaman ini menggunakan blok JSON melalui CMS.",
    loading_label: "Memuat",

    // Article
    no_articles_match: "Tidak ada artikel yang cocok dengan bagian ini.",
    read_more_label: "Baca selengkapnya",
    loading_articles: "Memuat artikel…",

    // About section
    about_andaralab: "Tentang AndaraLab",
    our_approach: "Pendekatan Kami",

    // Market Dashboard cards
    jun_2024: "Jun 2024",

    // Dataset editor / admin
    columns_label: "Kolom",
    rows_label: "Baris",
    unit: "Unit",
    unit_type: "Tipe Unit",
    chart_type: "Tipe Grafik",
    color: "Warna",
    title_label: "Judul",
    description_label: "Deskripsi",
    series: "Seri",
    add_column: "Tambah Kolom",
    add_row: "Tambah Baris",
    remove: "Hapus",
    preview: "Pratinjau",
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    reset: "Reset",
    published: "dipublikasikan",
    draft: "draf",

    // Exchange Rate
    exchange_rates: "Kurs Mata Uang",
    add_exchange_rate: "Tambah Kurs",
    edit_exchange_rate: "Edit Kurs",
    base_currency: "Mata Uang Dasar",
    target_currency: "Mata Uang Target",
    rate: "Kurs",
    inverse_rate: "Kurs Balik",
    source: "Sumber",
    last_updated_rate: "Terakhir Diperbarui",
    auto_update: "Otomatis",
    manual: "Manual",

    // Generic
    back: "Kembali",
    loading: "Memuat…",
    error: "Terjadi kesalahan",
    no_results: "Tidak ada hasil",
    read_more: "Baca selengkapnya",
    min_read: "menit baca",
  },
} as const;

// ─── Context ──────────────────────────────────────────────────────────────────

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Locale) ?? "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {}
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  useEffect(() => {
    document.documentElement.lang = locale === "id" ? "id" : "en";
  }, [locale]);

  const t = useCallback(
    (key: string): string => {
      const localeStrings = translations[locale] as Record<string, string>;
      return localeStrings[key] ?? (translations.en as Record<string, string>)[key] ?? key;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
