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
    data_hub_subtitle:
      "Interactive charts, economic calendar, and live market data for Indonesia and global economies.",
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
    data_hub_snapshot: "Data Hub Snapshot",
    data_hub_latest_desc: "Latest research and market data from CMS",
    explore_full_data_hub: "Explore full Data Hub",
    latest_research: "Latest Research",
    all_research: "All Research",
    no_articles_yet: "No articles yet.",
    idr_usd_historical: "IDR/USD — Historical",

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
    meta_data_description:
      "Interactive economic charts, calendar, and market intelligence dashboards.",
    meta_models_description:
      "Compare large language models for research: context length, pricing, and capabilities — curated by AndaraLab.",
    meta_not_found_title: "Page not found",
    meta_not_found_description:
      "This page does not exist or is still unpublished in the CMS.",
    meta_article_not_found_title: "Article not found",
    meta_article_not_found_description:
      "This article does not exist or is still a draft in the CMS.",

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
    premier_research_hub:
      "A premier economic research hub under PT. Andara Investasi Cerdas.",
    decoding_empowering: "Decoding economies, empowering growth.",
    get_in_touch_label: "Get in Touch",
    all_rights_reserved: "All rights reserved.",
    newsletter_label: "Research Digest",
    newsletter_title: "Stay Ahead of the Data",
    newsletter_desc:
      "Get AndaraLab's weekly digest of Indonesia's key economic indicators, policy updates, and market-moving insights — delivered every Monday.",
    newsletter_email_label: "Email Address",
    newsletter_topics_label: "Topics (Optional)",
    newsletter_subscribe: "Subscribe to Digest",
    newsletter_no_spam: "No spam. Unsubscribe anytime.",
    newsletter_subscribed: "You're subscribed!",
    newsletter_first_digest: "First digest arrives Monday.",

    // Featured Insights
    featured_insights: "Featured Insights",
    featured_insights_title: "Featured Insights",
    lihat_semua: "View all",

    // DynamicPage / 404
    page_not_found_title: "Page not found",
    page_not_found_desc:
      "This page does not exist or is still a draft in the CMS.",
    halamn_tidak_ada:
      "Halaman tidak ada atau belum dipublikasikan (masih Draft di CMS).",
    halaman_tidak_ditemukan: "Halaman tidak ditemukan",
    ke_beranda: "Ke beranda",
    go_home: "Go Home",
    untitled_page: "Untitled Page",
    no_content_yet:
      "This page has been created but no content blocks have been added yet.",
    structure_json_blocks:
      "You can structure this page using JSON blocks via the CMS.",
    loading_label: "Loading",

    // Article
    no_articles_match: "No articles match this section yet.",
    read_more_label: "Read More",
    loading_articles: "Loading articles…",

    // About section (home)
    about_andaralab: "About AndaraLab",
    our_approach: "Our Approach",
    about_lab_headline: "A Laboratory for",
    about_lab_headline2: "Economic Intelligence",
    about_lab_body:
      'At AndaraLab, we operate as a premier economic research hub under PT. Andara Investasi Cerdas. We bridge the gap between complex macro-economic data and actionable intelligence. Built on the pillar of "Tumbuh" (Growth), our mission is to provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape.',
    about_pillar_rigor_title: "Rigor",
    about_pillar_rigor_desc:
      "Every analysis is grounded in verified data sources, peer-reviewed methodology, and transparent assumptions.",
    about_pillar_relevance_title: "Relevance",
    about_pillar_relevance_desc:
      "We focus on what matters now — policy shifts, market dislocations, and structural economic changes.",
    about_pillar_clarity_title: "Clarity",
    about_pillar_clarity_desc:
      "Complex economic intelligence translated into clear, actionable insights for decision-makers.",
    stat_indicators: "Economic Indicators Tracked",
    stat_economies: "Economies Monitored",
    stat_verticals: "Research Verticals",
    stat_founded: "Founded, Jakarta",

    // About page
    about_page_label: "About AndaraLab",
    about_page_title: "A Premier Economic Research Hub",
    about_page_body1:
      'At AndaraLab, we operate as a premier economic research hub under PT. Andara Investasi Cerdas. We bridge the gap between complex macro-economic data and actionable intelligence. Built on the pillar of "Tumbuh" (Growth), our mission is to provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape.',
    about_page_body2:
      'At AndaraLab, we bridge the gap between complex global shifts and local investment opportunities by transforming raw economic data into high-precision strategic intelligence. As the dedicated research arm of PT. Andara Investasi Cerdas, our "laboratory" approach combines rigorous econometric modeling with deep institutional expertise to ensure every insight is both scientifically grounded and practically actionable. We don\'t just track the market; we decode the underlying forces of the Indonesian economy to fulfill our core promise of "Tumbuh"—empowering our partners with the clarity and foresight needed to achieve sustainable, long-term growth in an ever-evolving financial landscape.',
    about_foundation: "Our Foundation",
    about_mission_title: "Mission",
    about_mission_text:
      "To provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape.",
    about_vision_title: "Vision",
    about_vision_text:
      "To become the premier economic intelligence hub in Southeast Asia, bridging macro-economic data and actionable strategy.",
    about_approach_title: "Approach",
    about_approach_text:
      "Our 'laboratory' approach combines rigorous econometric modeling with deep institutional expertise for scientifically grounded insights.",
    about_institutional_label: "PT. Andara Investasi Cerdas",
    about_institutional_title: "The Institutional Backbone",
    about_institutional_body1:
      "AndaraLab is the dedicated research division of PT. Andara Investasi Cerdas, bringing together economists, data scientists, and regional experts committed to producing credible, actionable research.",
    about_institutional_body2:
      "Our team combines deep local knowledge of Indonesia and Southeast Asia with rigorous quantitative methods, delivering intelligence that is both globally relevant and locally grounded.",
    about_years_label: "Years of Research Excellence",
    about_data_points_label: "Data Points Tracked Monthly",
    get_in_touch: "Get in Touch",

    // Contact page
    contact_label_header: "Contact",
    contact_get_in_touch: "Get in Touch",
    contact_subtitle:
      "Reach out to our research team for partnerships, research inquiries, or media requests.",
    contact_info_title: "Contact Information",
    contact_email_label: "Email",
    contact_phone_label: "Phone",
    contact_address_label: "Address",
    contact_form_fullname: "Full Name",
    contact_form_email: "Email Address",
    contact_form_org: "Organization",
    contact_form_subject: "Subject",
    contact_form_message: "Message",
    contact_form_select: "Select subject",
    contact_form_partnership: "Research Partnership",
    contact_form_subscription: "Data Subscription",
    contact_form_media: "Media Inquiry",
    contact_form_general: "General Question",
    contact_form_placeholder_name: "Your name",
    contact_form_placeholder_email: "your@email.com",
    contact_form_placeholder_org: "Company or institution",
    contact_form_placeholder_message: "Describe your inquiry...",
    contact_form_send: "Send Message",
    contact_sent_title: "Message Sent",
    contact_sent_body: "We'll get back to you within 1-2 business days.",
    contact_send_another: "Send another message",

    // Latest Insights
    latest_insights: "Latest Insights",
    read_label: "Read",

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
    data_hub_subtitle:
      "Grafik interaktif, kalender ekonomi, dan data pasar live untuk ekonomi Indonesia dan global.",
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
    featured_charts: "Grafik Pilihan",
    data_hub_snapshot: "Snapshot Pusat Data",
    data_hub_latest_desc: "Data riset dan pasar terbaru dari CMS",
    explore_full_data_hub: "Jelajahi Pusat Data",
    latest_research: "Riset Terbaru",
    all_research: "Semua Riset",
    no_articles_yet: "Belum ada artikel.",
    idr_usd_historical: "IDR/USD — Historis",

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
    meta_data_description:
      "Grafik ekonomi interaktif, kalender ekonomi, dan dashboard intelijen pasar.",
    meta_models_description:
      "Bandingkan model bahasa besar untuk riset: panjang konteks, harga, dan kemampuan — kurasi AndaraLab.",
    meta_not_found_title: "Halaman tidak ditemukan",
    meta_not_found_description:
      "Halaman ini tidak ada atau belum dipublikasikan di CMS.",
    meta_article_not_found_title: "Artikel tidak ditemukan",
    meta_article_not_found_description:
      "Artikel ini tidak ada atau masih berstatus draf di CMS.",

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
    premier_research_hub:
      "Pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas.",
    decoding_empowering: "Menguraikan ekonomi, mendorong pertumbuhan.",
    get_in_touch_label: "Hubungi Kami",
    all_rights_reserved: "Hak cipta dilindungi.",
    newsletter_label: "Intisari Riset",
    newsletter_title: "Tetap Terdepan dalam Data",
    newsletter_desc:
      "Dapatkan intisari mingguan AndaraLab tentang indikator ekonomi utama Indonesia, pembaruan kebijakan, dan wawasan penggerak pasar — dikirim setiap Senin.",
    newsletter_email_label: "Alamat Email",
    newsletter_topics_label: "Topik (Opsional)",
    newsletter_subscribe: "Berlangganan Intisari",
    newsletter_no_spam: "Tanpa spam. Berhenti berlangganan kapan saja.",
    newsletter_subscribed: "Berhasil berlangganan!",
    newsletter_first_digest: "Intisari pertama tiba hari Senin.",

    // Featured Insights
    featured_insights: "Wawasan Pilihan",
    featured_insights_title: "Wawasan Pilihan",
    lihat_semua: "Lihat semua",

    // DynamicPage / 404
    halamn_tidak_ada:
      "Halaman tidak ada atau belum dipublikasikan (masih Draft di CMS).",
    halaman_tidak_ditemukan: "Halaman tidak ditemukan",
    ke_beranda: "Ke beranda",
    go_home: "Kembali ke Beranda",
    untitled_page: "Halaman Tanpa Judul",
    no_content_yet:
      "Halaman ini telah dibuat tetapi belum ada blok konten yang ditambahkan.",
    structure_json_blocks:
      "Anda dapat menyusun halaman ini menggunakan blok JSON melalui CMS.",
    loading_label: "Memuat",

    // Article
    no_articles_match: "Tidak ada artikel yang cocok dengan bagian ini.",
    read_more_label: "Baca selengkapnya",
    loading_articles: "Memuat artikel…",

    // About section (home)
    about_andaralab: "Tentang AndaraLab",
    our_approach: "Pendekatan Kami",
    about_lab_headline: "Laboratorium untuk",
    about_lab_headline2: "Intelijen Ekonomi",
    about_lab_body:
      'Di AndaraLab, kami beroperasi sebagai pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas. Kami menjembatani kesenjangan antara data makroekonomi yang kompleks dan intelijen yang dapat ditindaklanjuti. Dibangun di atas pilar "Tumbuh" (Pertumbuhan), misi kami adalah menyediakan fondasi analitik yang memungkinkan mitra kami berkembang dalam lanskap ekonomi yang terus berubah.',
    about_pillar_rigor_title: "Rigor",
    about_pillar_rigor_desc:
      "Setiap analisis didasarkan pada sumber data terverifikasi, metodologi yang telah ditinjau sejawat, dan asumsi yang transparan.",
    about_pillar_relevance_title: "Relevansi",
    about_pillar_relevance_desc:
      "Kami fokus pada hal yang penting saat ini — pergeseran kebijakan, dislokasi pasar, dan perubahan struktural ekonomi.",
    about_pillar_clarity_title: "Kejelasan",
    about_pillar_clarity_desc:
      "Intelijen ekonomi yang kompleks diterjemahkan menjadi wawasan yang jelas dan dapat ditindaklanjuti bagi para pengambil keputusan.",
    stat_indicators: "Indikator Ekonomi Dipantau",
    stat_economies: "Ekonomi Dimonitor",
    stat_verticals: "Vertikal Riset",
    stat_founded: "Didirikan, Jakarta",

    // About page
    about_page_label: "Tentang AndaraLab",
    about_page_title: "Pusat Riset Ekonomi Terkemuka",
    about_page_body1:
      'Di AndaraLab, kami beroperasi sebagai pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas. Kami menjembatani kesenjangan antara data makroekonomi yang kompleks dan intelijen yang dapat ditindaklanjuti. Dibangun di atas pilar "Tumbuh" (Pertumbuhan), misi kami adalah menyediakan fondasi analitik yang memungkinkan mitra kami berkembang dalam lanskap ekonomi yang terus berubah.',
    about_page_body2:
      "Di AndaraLab, kami menjembatani kesenjangan antara pergeseran global yang kompleks dan peluang investasi lokal dengan mengubah data ekonomi mentah menjadi intelijen strategis presisi tinggi. Sebagai lengan riset khusus dari PT. Andara Investasi Cerdas, pendekatan 'laboratorium' kami menggabungkan pemodelan ekonometrik yang ketat dengan keahlian institusional yang mendalam untuk memastikan setiap wawasan didasarkan secara ilmiah dan dapat ditindaklanjuti secara praktis. Kami tidak hanya memantau pasar; kami menguraikan kekuatan yang mendasari ekonomi Indonesia untuk memenuhi janji inti kami yaitu 'Tumbuh' — memberdayakan mitra kami dengan kejelasan dan pandangan ke depan yang diperlukan untuk mencapai pertumbuhan berkelanjutan jangka panjang.",
    about_foundation: "Fondasi Kami",
    about_mission_title: "Misi",
    about_mission_text:
      "Menyediakan fondasi analitik yang memungkinkan mitra kami berkembang dalam lanskap ekonomi yang terus berubah.",
    about_vision_title: "Visi",
    about_vision_text:
      "Menjadi pusat intelijen ekonomi terkemuka di Asia Tenggara, menjembatani data makroekonomi dan strategi yang dapat ditindaklanjuti.",
    about_approach_title: "Pendekatan",
    about_approach_text:
      "Pendekatan 'laboratorium' kami menggabungkan pemodelan ekonometrik yang ketat dengan keahlian institusional mendalam untuk wawasan yang berlandaskan sains.",
    about_institutional_label: "PT. Andara Investasi Cerdas",
    about_institutional_title: "Tulang Punggung Institusional",
    about_institutional_body1:
      "AndaraLab adalah divisi riset khusus PT. Andara Investasi Cerdas, menyatukan ekonom, ilmuwan data, dan pakar regional yang berkomitmen menghasilkan riset yang kredibel dan dapat ditindaklanjuti.",
    about_institutional_body2:
      "Tim kami menggabungkan pengetahuan lokal mendalam tentang Indonesia dan Asia Tenggara dengan metode kuantitatif yang ketat, menghasilkan intelijen yang relevan secara global dan berakar secara lokal.",
    about_years_label: "Tahun Keunggulan Riset",
    about_data_points_label: "Data Dipantau Setiap Bulan",
    get_in_touch: "Hubungi Kami",

    // Contact page
    contact_label_header: "Kontak",
    contact_get_in_touch: "Hubungi Kami",
    contact_subtitle:
      "Hubungi tim riset kami untuk kemitraan, pertanyaan riset, atau permintaan media.",
    contact_info_title: "Informasi Kontak",
    contact_email_label: "Email",
    contact_phone_label: "Telepon",
    contact_address_label: "Alamat",
    contact_form_fullname: "Nama Lengkap",
    contact_form_email: "Alamat Email",
    contact_form_org: "Organisasi",
    contact_form_subject: "Subjek",
    contact_form_message: "Pesan",
    contact_form_select: "Pilih subjek",
    contact_form_partnership: "Kemitraan Riset",
    contact_form_subscription: "Langganan Data",
    contact_form_media: "Pertanyaan Media",
    contact_form_general: "Pertanyaan Umum",
    contact_form_placeholder_name: "Nama Anda",
    contact_form_placeholder_email: "email@anda.com",
    contact_form_placeholder_org: "Perusahaan atau institusi",
    contact_form_placeholder_message: "Jelaskan pertanyaan Anda...",
    contact_form_send: "Kirim Pesan",
    contact_sent_title: "Pesan Terkirim",
    contact_sent_body: "Kami akan menghubungi Anda dalam 1-2 hari kerja.",
    contact_send_another: "Kirim pesan lain",

    // Latest Insights
    latest_insights: "Wawasan Terbaru",
    read_label: "Baca",

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

  // Overrides from CMS Language Texts (/api/ui-texts)
  const [overrides, setOverrides] = useState<{
    en: Record<string, string>;
    id: Record<string, string>;
  }>({ en: {}, id: {} });

  useEffect(() => {
    fetch("/api/ui-texts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data) {
          setOverrides({
            en:
              json.data.en && typeof json.data.en === "object"
                ? json.data.en
                : {},
            id:
              json.data.id && typeof json.data.id === "object"
                ? json.data.id
                : {},
          });
        }
      })
      .catch(() => {}); // silent fail — hardcoded translations remain as fallback
  }, []);

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
      const localeOverrides = overrides[locale] as Record<string, string>;
      const localeStrings = translations[locale] as Record<string, string>;
      return (
        localeOverrides[key] ??
        localeStrings[key] ??
        (overrides.en as Record<string, string>)[key] ??
        (translations.en as Record<string, string>)[key] ??
        key
      );
    },
    [locale, overrides],
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
