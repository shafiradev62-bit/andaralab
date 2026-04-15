import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useDatasets, useExchangeRates } from "@/lib/cms-store";
import { useLocale } from "@/lib/locale";
import { applyDocumentSeo } from "@/lib/document-meta";
import { formatValue } from "@/lib/utils";
import InteractiveChart from "@/components/InteractiveChart";
import CalendarWidget from "@/components/CalendarWidget";
import IPRGroupChart, { type IPRSeries } from "@/components/IPRGroupChart";
import { BarChart2, LineChart as LineChartIcon, TrendingUp, Calendar, Table as TableIcon, ArrowRight, ExternalLink, AlertCircle, Loader2, Search, X, Filter, SortAsc, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getLastTwo(rows: Record<string, string | number>[], key: string) {
  const vals = rows.map((r) => {
    const v = r[key];
    return typeof v === "number" ? v : parseFloat(String(v));
  }).filter((v) => !isNaN(v));
  const last = vals[vals.length - 1] ?? 0;
  const prev = vals.length > 1 ? vals[vals.length - 2] : last;
  return { last, prev };
}

function fmtChange(last: number, prev: number, unchangedLabel: string = "Unchanged"): { label: string; positive: boolean | null } {
  const diff = last - prev;
  if (Math.abs(diff) < 0.001) return { label: unchangedLabel, positive: null };
  return { label: `${diff > 0 ? "+" : ""}${diff.toFixed(2)}`, positive: diff > 0 };
}

export default function DataHubPage() {
  const [location] = useLocation();
  const { t, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<"charts" | "calendar" | "market">("charts");
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"chart" | "table">("chart");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"alphabetical-asc" | "alphabetical-desc" | "category" | "latest">("latest");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: datasets = [], isLoading, error } = useDatasets();
  const { data: exchangeRates = [] } = useExchangeRates();

  useEffect(() => {
    const path =
      location && location !== "/" ? (location.startsWith("/") ? location : `/${location}`) : "/data";
    applyDocumentSeo({
      title: t("data_hub"),
      description: t("meta_data_description"),
      pathname: path,
    });
  }, [location, t]);

  const isCalendar = location.includes("economic-calendar");
  const isDashboard = location.includes("market-dashboard");

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync tab from URL on route change
  useEffect(() => {
    if (isCalendar) setActiveTab("calendar");
    else if (isDashboard) setActiveTab("market");
    else setActiveTab("charts");
  }, [isCalendar, isDashboard]);

  const selectedDataset = selectedChart ? datasets.find((d) => d.id === selectedChart) : null;

  // Derived filter options
  const categories = Array.from(new Set(datasets.map(d => d.category))).sort();
  
  // Extract years from the first column of each dataset's rows
  const years = Array.from(new Set(datasets.flatMap(ds => 
    ds.rows.map(r => {
      const val = String(r[ds.columns[0]] || "");
      const match = val.match(/\d{4}/);
      return match ? match[0] : null;
    })
  ))).filter((y): y is string => y !== null).sort((a, b) => b.localeCompare(a));

  const filteredDatasets = datasets.filter(ds => {
    const matchesSearch = !searchQuery || 
      ds.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ds.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || ds.category === selectedCategory;
    
    const matchesYear = selectedYear === "all" || ds.rows.some(r => {
      const val = String(r[ds.columns[0]] || "");
      return val.includes(selectedYear);
    });

    return matchesSearch && matchesCategory && matchesYear;
  });

  // Apply sorting
  const sortedDatasets = [...filteredDatasets].sort((a, b) => {
    if (sortBy === "alphabetical-asc") return a.title.localeCompare(b.title);
    if (sortBy === "alphabetical-desc") return b.title.localeCompare(a.title);
    if (sortBy === "category") return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
    if (sortBy === "latest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return 0;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedYear("all");
    setSortBy("latest");
  };

  // ─── Data IPR (Indeks Penjualan Riil) per kelompok ─────────────────────────
  // Sumber: Tabel Series SPE, format: { period, value } yoy %
  const iprSeries: IPRSeries[] = [
    {
      label: "IPR Suku Cadang dan Aksesori",
      data: [
        { period: "8", value: 10.2 }, { period: "9", value: 11.5 }, { period: "10", value: 12.0 },
        { period: "11", value: 11.8 }, { period: "12", value: 13.1 }, { period: "1", value: 11.3 },
        { period: "2", value: 9.8 }, { period: "3*", value: 9.8 },
      ],
    },
    {
      label: "IPR Makanan, Minuman & Tembakau",
      data: [
        { period: "8", value: 7.2 }, { period: "9", value: 6.8 }, { period: "10", value: 7.5 },
        { period: "11", value: 6.9 }, { period: "12", value: 8.8 }, { period: "1", value: 4.0 },
        { period: "2", value: 3.5 }, { period: "3*", value: 3.5 },
      ],
    },
    {
      label: "IPR Bahan Bakar Kendaraan Bermotor",
      data: [
        { period: "8", value: 5.1 }, { period: "9", value: 3.2 }, { period: "10", value: 2.8 },
        { period: "11", value: 1.5 }, { period: "12", value: -0.6 }, { period: "1", value: -9.3 },
        { period: "2", value: -8.0 }, { period: "3*", value: -8.0 },
      ],
      isPrakiraan: true,
    },
    {
      label: "IPR Peralatan Informasi dan Komunikasi",
      data: [
        { period: "8", value: -28.0 }, { period: "9", value: -27.5 }, { period: "10", value: -26.8 },
        { period: "11", value: -27.0 }, { period: "12", value: -28.3 }, { period: "1", value: -25.0 },
        { period: "2", value: -24.0 }, { period: "3*", value: -24.0 },
      ],
      isPrakiraan: true,
    },
    {
      label: "IPR Perlengkapan Rumah Tangga dan Lainnya",
      data: [
        { period: "8", value: 2.1 }, { period: "9", value: 1.8 }, { period: "10", value: 0.9 },
        { period: "11", value: 0.5 }, { period: "12", value: 0.5 }, { period: "1", value: -4.1 },
        { period: "2", value: -3.5 }, { period: "3*", value: -3.5 },
      ],
      isPrakiraan: true,
    },
    {
      label: "IPR Barang Budaya dan Rekreasi",
      data: [
        { period: "8", value: 8.5 }, { period: "9", value: 9.2 }, { period: "10", value: 10.1 },
        { period: "11", value: 9.8 }, { period: "12", value: 1.7 }, { period: "1", value: -5.4 },
        { period: "2", value: 5.7 }, { period: "3*", value: 5.7 },
      ],
      isPrakiraan: true,
    },
    {
      label: "IPR Sub Kel. Sandang",
      data: [
        { period: "8", value: 3.2 }, { period: "9", value: 2.8 }, { period: "10", value: 3.5 },
        { period: "11", value: 4.9 }, { period: "12", value: 4.9 }, { period: "1", value: -8.3 },
        { period: "2", value: -7.0 }, { period: "3*", value: -7.0 },
      ],
      isPrakiraan: true,
    },
  ];

  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-3">{t("data_hub")}</div>
          <h1 className="text-[34px] font-bold text-gray-900 mb-3">{t("economic_data_market_intelligence")}</h1>
          <p className="text-[14.5px] text-gray-500 max-w-[540px]">
            {t("data_hub_subtitle")}
          </p>
        </div>
      </section>

      {/* Tab Nav */}
      <div className="border-b border-[#E5E7EB] bg-white sticky top-14 z-30">
        <div className="max-w-[1200px] mx-auto px-6 flex gap-0">
          {[
            { key: "charts", label: t("interactive_charts"), icon: BarChart2 },
            { key: "calendar", label: t("economic_calendar"), icon: Calendar },
            { key: "market", label: t("market_overview"), icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Tab */}
      {activeTab === "charts" && (
        <div className="max-w-[1200px] mx-auto px-6 py-10">

          {/* IPR Group Chart — Grafik 3 style */}
          {!selectedDataset && (
            <div className="mb-10">
              <IPRGroupChart
                chartNumber="Grafik 3"
                title="Pertumbuhan IPR Menurut Kelompok (%, yoy)"
                unit="%, yoy"
                footnote="*) Angka Prakiraan"
                series={iprSeries}
              />
            </div>
          )}

          {!selectedDataset && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 mb-12"
            >
              {/* Header & Search */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-gray-400" />
                    {t("available_datasets")}
                  </h2>
                  <p className="text-[13.5px] text-gray-500 mt-1">
                    Showing <span className="font-bold text-gray-900">{filteredDatasets.length}</span> of <span className="font-bold text-gray-400">{datasets.length}</span> indicators
                  </p>
                </div>
                
                <div className="relative w-full lg:w-[450px]" ref={searchRef}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <Search className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search indicators, metrics, or categories..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-12 py-3.5 text-[14.5px] focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-sm placeholder:text-gray-400"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => {
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Auto-suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && searchQuery.length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[380px] overflow-y-auto backdrop-blur-xl"
                      >
                        <div className="p-2 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Suggestions</span>
                          <span className="text-[10px] text-gray-400 px-2">{filteredDatasets.length} found</span>
                        </div>
                        {filteredDatasets.length > 0 ? (
                          <div className="py-1">
                            {filteredDatasets.slice(0, 8).map((ds) => (
                              <button
                                key={ds.id}
                                onClick={() => {
                                  setSelectedChart(ds.id);
                                  setShowSuggestions(false);
                                  setSearchQuery(""); // Clear search to show selected chart context
                                }}
                                className="w-full flex flex-col items-start px-4 py-3 hover:bg-gray-50 transition-colors text-left group border-b border-gray-50 last:border-0"
                              >
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded uppercase group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                    {ds.category}
                                  </span>
                                  <TrendingUp className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
                                </div>
                                <span className="text-[14px] font-semibold text-gray-900 group-hover:text-gray-900 truncate w-full">
                                  {ds.title}
                                </span>
                                {ds.description && (
                                  <span className="text-[11.5px] text-gray-400 line-clamp-1 mt-0.5">
                                    {ds.description}
                                  </span>
                                )}
                              </button>
                            ))}
                            {filteredDatasets.length > 8 && (
                              <div className="px-4 py-2 bg-gray-50 text-[11px] text-gray-500 font-medium text-center">
                                Use the selector below to see all {filteredDatasets.length} results
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <AlertCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-[13px] text-gray-400">No indicators match your search</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Quick Pills */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2.5 py-1">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-5 py-2 rounded-xl text-[12.5px] font-bold transition-all border ${
                      selectedCategory === "all" 
                        ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200" 
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    All Types
                  </button>
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`px-5 py-2 rounded-xl text-[12.5px] font-bold transition-all border ${
                        selectedCategory === c 
                          ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200" 
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* Advanced Controls Box */}
              <div className="bg-gray-50/60 p-8 rounded-[2rem] border border-gray-100 shadow-inner backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Year Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Series Year</label>
                    </div>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all cursor-pointer"
                    >
                      <option value="all">Any Period</option>
                      {years.map(y => <option key={y} value={y}>FY {y} Dataset</option>)}
                    </select>
                  </div>

                  {/* Sort Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4 text-gray-400" />
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Ordering</label>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-[14px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all cursor-pointer"
                    >
                      <option value="latest">Newest First</option>
                      <option value="alphabetical-asc">Title A-Z</option>
                      <option value="alphabetical-desc">Title Z-A</option>
                      <option value="category">GroupBy Category</option>
                    </select>
                  </div>

                  {/* Indicator Dropdown (Main Action) */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Select Dataset</label>
                      </div>
                      {(searchQuery || selectedCategory !== "all" || selectedYear !== "all") && (
                        <button 
                          onClick={resetFilters}
                          className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3 h-3" /> Clear All
                        </button>
                      )}
                    </div>
                    <select
                      className="w-full bg-white border-2 border-gray-900/5 rounded-2xl px-5 py-3 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 focus:border-gray-900 shadow-sm transition-all cursor-pointer"
                      onChange={(e) => setSelectedChart(e.target.value)}
                      value={selectedChart || ""}
                    >
                      <option value="" disabled>-- Choose an indicator ({filteredDatasets.length}) --</option>
                      {sortedDatasets.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                          {ds.category}: {ds.title}
                        </option>
                      ))}
                      {sortedDatasets.length === 0 && <option disabled>No indicators found for these filters</option>}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[13.5px]">{t("loading_datasets")}</span>
            </div>
          )}

          {/* Error state — fallback to localStorage */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-red-700">{t("could_not_reach_api")}</p>
                <p className="text-[12px] text-red-500 mt-0.5">
                  {t("showing_cached_data")}: <code className="bg-red-100 px-1 rounded">{t("start_api_server")}</code>
                </p>
              </div>
            </div>
          )}

          {!isLoading && !selectedDataset && datasets.length === 0 && !error && (
            <div className="col-span-full text-center py-16 text-gray-400 border border-dashed border-[#E5E7EB] rounded-xl">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">{t("no_datasets")}</p>
              <Link href="/admin" className="text-[13px] text-gray-900 hover:underline mt-1 inline-block">
                {t("add_one_cms")}
              </Link>
            </div>
          )}

          {!isLoading && !selectedDataset && datasets.length > 0 && (
            <div className="border border-dashed border-[#E5E7EB] rounded-xl p-16 flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50/50">
               <LineChartIcon className="w-12 h-12 mb-4 text-gray-400 opacity-50" />
               <p className="text-[14px] font-medium text-gray-600 mb-1">No chart selected</p>
               <p className="text-[13px] max-w-sm">Please select an indicator from the dropdown above to view the interactive chart and corresponding data table.</p>
            </div>
          )}

          {selectedDataset ? (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <button
                  onClick={() => setSelectedChart(null)}
                  className="flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-gray-900 font-medium"
                >
                  ← {t("back_to_all_charts")}
                </button>
                <div className="w-full sm:w-auto">
                  <select
                    className="w-full sm:w-[300px] border border-[#E5E7EB] bg-white rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    onChange={(e) => setSelectedChart(e.target.value)}
                    value={selectedChart || ""}
                  >
                    {datasets.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.category.toUpperCase()} - {ds.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="border border-[#E5E7EB] p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-widest text-gray-900 bg-gray-100 px-2 py-0.5 mb-3 inline-block">
                      {selectedDataset.category}
                    </span>
                    <h2 className="text-[22px] font-semibold text-gray-900 mt-2">{selectedDataset.title}</h2>
                    <p className="text-[13px] text-gray-500 mt-1">{selectedDataset.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveView("chart")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] border transition-colors ${activeView === "chart" ? "bg-gray-900 text-white border-gray-900" : "border-[#E5E7EB] text-gray-600 hover:border-gray-400"}`}
                    >
                      <LineChartIcon className="w-3.5 h-3.5" /> {t("chart")}
                    </button>
                    <button
                      onClick={() => setActiveView("table")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] border transition-colors ${activeView === "table" ? "bg-gray-900 text-white border-gray-900" : "border-[#E5E7EB] text-gray-600 hover:border-gray-400"}`}
                    >
                      <TableIcon className="w-3.5 h-3.5" /> {t("table")}
                    </button>
                  </div>
                </div>
                <div className="h-px bg-[#E5E7EB] my-5" />
                {activeView === "chart" ? (
                  <InteractiveChart dataset={selectedDataset} height={360} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-[#E5E7EB]">
                          {selectedDataset.columns.map((col) => (
                            <th key={col} className="text-left py-2.5 px-3 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDataset.rows.map((row, i) => (
                          <tr key={i} className="border-b border-[#F3F4F6] hover:bg-gray-50">
                            {selectedDataset.columns.map((col) => (
                              <td key={col} className="py-2.5 px-3 text-gray-700">
                                {row[col] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-4">
                  {t("unit_label")}: {selectedDataset.unit} · {t("updated_label")}: {selectedDataset.updatedAt}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <CalendarWidget />
        </div>
      )}

      {/* Market Tab */}
      {activeTab === "market" && (
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <h2 className="text-[18px] font-semibold text-gray-900 mb-6">{t("market_overview")}</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[13.5px]">{t("loading")}</span>
            </div>
          ) : (
            <>
              {/* Exchange Rates */}
              {exchangeRates.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[16px] font-semibold text-gray-900 mb-5">{t("exchange_rates") || "Exchange Rates"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                    {exchangeRates
                      .filter((er) => er.enabled)
                      .map((er) => (
                        <div
                          key={er.id}
                          className="border border-[#E5E7EB] p-5 cursor-pointer hover:border-gray-900 transition-colors"
                        >
                          <div className="text-[11.5px] text-gray-400 mb-1.5">{er.label}</div>
                          <div className="text-[24px] font-bold text-gray-900 mb-1">
                            {er.value}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[12px] font-semibold ${
                                er.up === null ? "text-gray-400" : er.up ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {er.change}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Market cards from CMS datasets */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {datasets
                  .filter((ds) => ["bi-rate", "idr-usd", "trade-balance", "gdp-growth", "inflation-rate", "sovereign-bond-yield", "investment-credit-trend"].includes(ds.id))
                  .map((ds) => {
                    const valueKey = ds.columns[1];
                    const { last, prev } = getLastTwo(ds.rows, valueKey);
                    const { label, positive } = fmtChange(last, prev, t("unchanged"));
                    const lastRow = ds.rows[ds.rows.length - 1];
                    const periodKey = ds.columns[0];
                    return (
                      <div
                        key={ds.id}
                        className="border border-[#E5E7EB] p-5 cursor-pointer hover:border-gray-900 transition-colors"
                        onClick={() => { setSelectedChart(ds.id); setActiveTab("charts"); }}
                      >
                        <div className="text-[11.5px] text-gray-400 mb-1.5">{ds.title}</div>
                        <div className="text-[24px] font-bold text-gray-900 mb-1">
                          {formatValue(last, ds.unitType, ds.unit)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-semibold text-gray-600">
                            {label}
                          </span>
                          <span className="text-[11px] text-gray-400">{String(lastRow?.[periodKey] ?? "")}</span>
                        </div>
                      </div>
                    );
                  })}
                {datasets.filter((ds) => ["bi-rate", "idr-usd", "trade-balance", "gdp-growth", "inflation-rate", "sovereign-bond-yield", "investment-credit-trend"].includes(ds.id)).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400 text-[13px]">
                    {t("no_datasets")} <Link href="/admin" className="text-gray-900 hover:underline">{t("add_in_cms")}</Link>
                  </div>
                )}
              </div>
              <h3 className="text-[16px] font-semibold text-gray-900 mb-5">{t("all_datasets")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {datasets.map((ds) => (
                  <div
                    key={ds.id}
                    className="border border-[#E5E7EB] p-5 cursor-pointer hover:border-gray-900 transition-colors"
                    onClick={() => { setSelectedChart(ds.id); setActiveTab("charts"); }}
                  >
                    <h4 className="text-[14px] font-semibold text-gray-900 mb-1">{ds.title}</h4>
                    <p className="text-[12px] text-gray-400 mb-4">{ds.description}</p>
                    <InteractiveChart dataset={ds} height={200} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
