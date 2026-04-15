import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useDatasets, useCreateDataset, useUpdateDataset,
  useDeleteDataset, useResetDatasets, useBulkCreateDatasets, useDeployToVPS,
  usePages, useCreatePage, useUpdatePage, useDeletePage, useResetPages,
  usePosts, useCreatePost, useUpdatePost, useDeletePost, useResetPosts,
  useAnalisisList, useAnalisis, useCreateAnalisis, useUpdateAnalisis,
  useDeleteAnalisis, useResetAnalisis,
  useFeaturedInsights, useUpdateFeaturedInsights, useResetFeaturedInsights,
  useExchangeRates, useCreateExchangeRate, useUpdateExchangeRate,
  useDeleteExchangeRate, useResetExchangeRates,
  useCalendarEvents, useCalendarConfig,
  useCreateCalendarEvent, useUpdateCalendarEvent,
  useDeleteCalendarEvent, useResetCalendarEvents, useUpdateCalendarConfig,
  type ChartDataset, type Page, type BlogPost,
  type AnalisisDeskriptif, type AnalysisSection, type AnalysisWidget,
  type AnalysisMetric, type AnalysisWidgetType,
  type FeaturedInsight, type FeaturedInsightsConfig,
  type DataUnitType, type ExchangeRate,
  type CalendarEvent, type CalendarConfig,
  type CalendarImpact, type CalendarRegion,
} from "@/lib/cms-store";
import InteractiveChart from "@/components/InteractiveChart";
import { UNIT_TYPE_LABELS } from "@/lib/utils";
import {
  Plus, Trash2, Save, ChevronLeft, BarChart2, LineChart,
  TrendingUp, AlertCircle, CheckCircle, Loader2, RefreshCw,
  Database, FileText, BookOpen, ChevronDown, ChevronRight,
  Globe, Eye, EyeOff, Link2, Unlink,
  BarChart3, PieChart, LayoutGrid, List, ArrowUp, ArrowDown,
  ArrowRight, Type, Layout, Star, Zap, Shield, Target,
  GripVertical, Edit3, Archive, UploadCloud, Check,
  Image as ImageIcon, LogOut, Menu, MoreVertical, ExternalLink,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const COLORS = ["#1a3a5c", "#2a5a8c", "#0d9fbf", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#5b21b6"];
const CHART_PALETTE = ["#1a3a5c", "#2a5a8c", "#0d9fbf", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#5b21b6"];
const CATEGORIES = [
  "Macro Foundations", "Sectoral Intelligence",
  "Market Dashboard",
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Macro Foundations": [
    "Macro Outlooks",
    "Policy & Monetary Watch",
    "Geopolitical & Structural Analysis"
  ],
  "Sectoral Intelligence": [
    "Strategic Industry Deep-dives",
    "Regional Economic Monitor",
    "ESG"
  ]
};

const MONTH_NAMES = [
  'jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'januari', 'pebruari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'nopember', 'desember'
];

const looksLikeTimePeriod = (s: string) => {
  const v = s.toLowerCase().trim();
  if (MONTH_NAMES.some(m => v.includes(m))) return true;
  if (/^(19|20)\d{2}$/.test(v)) return true;
  if (/\b(19|20)\d{2}\b/.test(v)) return true;
  if (/^[qQ][1-4]/.test(v)) return true;
  return false;
};
const BLOG_CATEGORIES = [
  "economics-101", "market-pulse", "lab-notes",
  "Macro Foundations", "Sectoral Intelligence",
];
const SECTIONS = [
  "root", "Macro Foundations", "Sectoral Intelligence",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newDataset(): Omit<ChartDataset, "id" | "createdAt" | "updatedAt"> {
  return {
    title: "New Dataset",
    description: "",
    category: "Macro Foundations",
    chartType: "line",
    color: "#1a3a5c",
    unit: "%",
    unitType: "percent",
    columns: ["Period", "Value"],
    columnNames: { en: ["Period", "Value"], id: ["Periode", "Nilai"] },
    rows: [
      { Period: "2023 Q1", Value: 0 },
      { Period: "2023 Q2", Value: 0 },
      { Period: "2023 Q3", Value: 0 },
      { Period: "2023 Q4", Value: 0 },
    ],
    colors: ["#1a3a5c"],
    subcategory: "",
  };
}

/** New page draft — `status` must be chosen in the editor before Save. */
function newPage(locale: "en" | "id" = "en"): Partial<Page> {
  return {
    slug: "/new-page",
    locale,
    title: "New Page",
    description: "",
    content: [],
    navLabel: "",
    section: "root",
  };
}

/** New post draft — `status` must be chosen before Save. */
function newPost(locale: "en" | "id" = "en"): Partial<BlogPost> {
  return {
    slug: "new-post",
    locale,
    title: "New Post",
    excerpt: "",
    body: [""],
    category: "economics-101",
    tag: "",
    readTime: "5 min read",
    subcategory: "",
  };
}

function normalizePageSlug(raw: string): string {
  const t = raw.trim().replace(/\s+/g, "-");
  if (!t || t === "/") return "/";
  return t.startsWith("/") ? t : `/${t}`;
}

function normalizeBlogSlug(raw: string): string {
  return raw.trim().replace(/^\/+/g, "").replace(/\s+/g, "-") || "new-post";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${
      status === "published"
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-500"
    }`}>
      {status === "published" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {status}
    </span>
  );
}

function LocaleBadge({ locale }: { locale: string }) {
  return (
    <span className={`text-[10.5px] font-semibold uppercase px-1.5 py-0.5 ${
      locale === "id" ? "bg-gray-700 text-white" : "bg-gray-900 text-white"
    }`}>
      {locale === "id" ? "ID" : "EN"}
    </span>
  );
}

// ─── Dataset Editor ─────────────────────────────────────────────────────────────

function DatasetEditor({
  selected, draft, setDraft, onBack, onSave, isSaving, isSuccess, lastSaved, isAutoSaving,
}: {
  selected: ChartDataset | null; draft: Partial<ChartDataset> | null;
  setDraft: (d: Partial<ChartDataset> | null) => void;
  onBack: () => void; onSave: () => void;
  isSaving: boolean; isSuccess: boolean;
  lastSaved: string | null;
  isAutoSaving: boolean;
}) {
  const [tab, setTab] = useState<"meta" | "chart" | "columns" | "data" | "preview">("meta");
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const effective = draft !== null ? { ...selected, ...draft } as ChartDataset : selected;

  useEffect(() => {
    if (isSuccess) {
      setShowSavedMsg(true);
      const timer = setTimeout(() => setShowSavedMsg(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  // Keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);

  if (!effective) return null;

  const patch = (fields: Partial<ChartDataset>) =>
    setDraft({ ...(draft ?? {}), ...fields } as Partial<ChartDataset>);

  const isInvalid = !effective.title || !effective.category;

  const addColumn = () => {
    const name = `Series ${effective.columns.length}`;
    const prevColors = effective.colors ?? [];
    const defaultColor = "#1a3a5c";
    const newColors = [...prevColors, defaultColor];
    patch({ columns: [...effective.columns, name], rows: effective.rows.map((r) => ({ ...r, [name]: 0 })), colors: newColors });
  };

  const removeColumn = (col: string) => {
    if (effective.columns.length <= 2) return;
    const colIdx = effective.columns.indexOf(col);
    const newColors = (effective.colors ?? []).filter((_, i) => i !== colIdx - 1);
    patch({ columns: effective.columns.filter((c) => c !== col), rows: effective.rows.map((r) => { const nr = { ...r }; delete nr[col]; return nr; }), colors: newColors });
  };

  const renameColumn = (oldName: string, newName: string) => {
    patch({ columns: effective.columns.map((c) => c === oldName ? newName : c), rows: effective.rows.map((r) => { const nr = { ...r }; nr[newName] = nr[oldName]; delete nr[oldName]; return nr; }) });
  };

  const updateSeriesColor = (seriesIdx: number, color: string) => {
    const prevColors = effective.colors ?? [];
    const newColors = [...prevColors];
    newColors[seriesIdx] = color;
    patch({ colors: newColors });
  };

  const addRow = () => {
    const newRow: Record<string, string | number> = {};
    effective.columns.forEach((c, i) => { newRow[c] = i === 0 ? "New Row" : 0; });
    patch({ rows: [...effective.rows, newRow] });
  };

  const removeRow = (idx: number) => patch({ rows: effective.rows.filter((_, i) => i !== idx) });

  const updateCell = (rowIdx: number, col: string, val: string) => {
    patch({ rows: effective.rows.map((r, i) => {
      if (i !== rowIdx) return r;
      const colIdx = effective.columns.indexOf(col);
      return { ...r, [col]: colIdx > 0 ? (isNaN(Number(val)) ? val : Number(val)) : val };
    })});
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 font-medium">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-gray-300">·</span>
          <span className="text-[13px] font-medium text-gray-700 truncate max-w-[300px]">{effective.title}</span>
        </div>
        
        {/* Auto-save status indicator */}
        <div className="flex items-center gap-2">
          {isAutoSaving && (
            <div className="flex items-center gap-1.5 text-[12px] text-blue-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Auto-saving...</span>
            </div>
          )}
          {lastSaved && !isAutoSaving && (
            <div className="flex items-center gap-1.5 text-[12px] text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saved at {lastSaved}</span>
            </div>
          )}
          {draft && !isAutoSaving && (
            <div className="flex items-center gap-1.5 text-[12px] text-amber-600">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor tabs */}
      <div className="flex gap-0 border-b border-[#E5E7EB] mb-6">
        {(["meta", "chart", "columns", "data", "preview"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-[13px] font-medium border-b-2 capitalize transition-colors ${
              tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {t === "meta" ? "Metadata" : t === "chart" ? "Chart Labels" : t === "columns" ? "Column Labels" : t === "data" ? "Table Data" : "Preview"}
          </button>
        ))}
      </div>

      {/* Metadata tab */}
      {tab === "meta" && (
        <div className="bg-white border border-[#E5E7EB] p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title - English */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Title (English) <span className="text-red-500 font-bold">*</span>
            </label>
            <input type="text" value={effective.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 shadow-sm" />
          </div>

          {/* Title - Indonesian */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Title (Bahasa Indonesia)
            </label>
            <input type="text" value={effective.titleId ?? ""}
              onChange={(e) => patch({ titleId: e.target.value })}
              placeholder="Judul dalam Bahasa Indonesia"
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 shadow-sm" />
          </div>

          {/* Description - English */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Description (English)
            </label>
            <textarea rows={2} value={effective.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 resize-none shadow-sm" />
          </div>

          {/* Description - Indonesian */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Description (Bahasa Indonesia)
            </label>
            <textarea rows={2} value={effective.descriptionId ?? ""}
              onChange={(e) => patch({ descriptionId: e.target.value })}
              placeholder="Deskripsi dalam Bahasa Indonesia"
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 resize-none shadow-sm" />
          </div>

          {/* Series Year */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Series Year / Period
            </label>
            <input type="text" value={effective.seriesYear ?? ""}
              onChange={(e) => patch({ seriesYear: e.target.value })}
              placeholder="e.g., 2016-2024, Q1 2023 - Q4 2024, 2024"
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 shadow-sm" />
            <p className="text-[10.5px] text-gray-400 mt-1">Time period covered by this dataset</p>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Unit Type</label>
            <select value={effective.unitType ?? "number"}
              onChange={(e) => patch({ unitType: e.target.value as DataUnitType })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white">
              {(Object.entries(UNIT_TYPE_LABELS) as [DataUnitType, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          {(effective.unitType ?? "number") === "custom" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Custom Unit Label</label>
              <input type="text" value={effective.unit ?? ""}
                onChange={(e) => patch({ unit: e.target.value })}
                placeholder="e.g. 000 Barel / MMscf"
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 shadow-sm transition-all" />
            </div>
          )}

          {/* Y-Axis Range Controls */}
          <div className="md:col-span-2 border border-gray-200 rounded-xl px-4 py-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Y-Axis Range</span>
              {(effective.yAxisMin !== undefined || effective.yAxisMax !== undefined) && (
                <button
                  onClick={() => { patch({ yAxisMin: undefined, yAxisMax: undefined }); }}
                  className="text-[10px] text-red-500 hover:text-red-700 underline ml-1"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Min Value</label>
                <input
                  type="number"
                  value={effective.yAxisMin ?? ""}
                  onChange={(e) => patch({ yAxisMin: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="Auto (e.g. 0)"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Max Value</label>
                <input
                  type="number"
                  value={effective.yAxisMax ?? ""}
                  onChange={(e) => patch({ yAxisMax: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="Auto (e.g. 100)"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 shadow-sm"
                />
              </div>
            </div>
            <p className="text-[10.5px] text-gray-400">Leave empty for auto-scale. Example: set Min = 90 to start Y-axis at 90 instead of 0.</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Category <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-1 border border-dashed border-gray-200 rounded-lg">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => patch({ category: c })}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                      effective.category === c 
                        ? "bg-gray-900 text-white" 
                        : "bg-gray-50 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-2">
                <select 
                  value={CATEGORIES.includes(effective.category) && effective.category !== "" ? effective.category : "custom"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== "custom") {
                      patch({ category: val });
                    } else {
                      // Only clear it if it's currently a standard category
                      // to avoid clearing what the user is currently typing in custom.
                      if (CATEGORIES.includes(effective.category)) {
                        patch({ category: "" });
                      }
                    }
                  }}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 bg-white shadow-sm"
                >
                  <option value="custom">-- Other (Custom) --</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                
                {(!CATEGORIES.includes(effective.category) || effective.category === "") && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <input 
                      type="text"
                      value={effective.category}
                      onChange={(e) => patch({ category: e.target.value })}
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 bg-white shadow-sm"
                      placeholder="Type your custom category here..."
                      autoFocus
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Subcategory
            </label>
            {SUBCATEGORIES[effective.category] ? (
              <select 
                value={effective.subcategory ?? ""}
                onChange={(e) => patch({ subcategory: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 bg-white shadow-sm"
              >
                <option value="">-- No Subcategory --</option>
                {SUBCATEGORIES[effective.category].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text"
                value={effective.subcategory ?? ""}
                onChange={(e) => patch({ subcategory: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 shadow-sm"
                placeholder="e.g. niche-topic"
              />
            )}
            <p className="text-[10.5px] text-gray-400 mt-1">Used for granular filtering on sub-menus.</p>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Chart Type</label>
            <div className="flex flex-wrap gap-2">
              {(["line", "bar", "area", "combo", "donut"] as const).map((t) => (
                <button key={t} onClick={() => patch({ chartType: t })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold border capitalize transition-all ${
                    effective.chartType === t
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200"
                      : "bg-white border-[#E5E7EB] text-gray-600 hover:border-gray-400"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              {effective.chartType === "combo" ? "Bar + Line dual-axis chart. Configure below." :
               effective.chartType === "donut" ? "Pie chart with center hole. Configure below." :
               "Pick the best visualization for this data series."}
            </p>
          </div>
        </div>
      )}

      {/* Chart Labels tab */}
      {tab === "chart" && (
        <div className="bg-white border border-[#E5E7EB] p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E5E7EB]">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <span className="text-[12.5px] text-gray-600">These labels override the chart display title and axis labels. Both English and Indonesian versions can be set.</span>
            </div>
          </div>
          
          {/* Chart Title - English */}
          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Chart Title (English)</label>
            <input type="text" value={effective.chartTitle ?? ""}
              onChange={(e) => patch({ chartTitle: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>

          {/* Chart Title - Indonesian */}
          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Chart Title (Bahasa Indonesia)</label>
            <input type="text" value={effective.chartTitleId ?? ""}
              onChange={(e) => patch({ chartTitleId: e.target.value })}
              placeholder="Judul grafik dalam Bahasa Indonesia"
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>

          {/* X-Axis Label - English */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">X-Axis Label (English)</label>
            <input type="text" value={effective.xAxisLabel ?? ""}
              onChange={(e) => patch({ xAxisLabel: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>

          {/* X-Axis Label - Indonesian */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">X-Axis Label (Bahasa Indonesia)</label>
            <input type="text" value={effective.xAxisLabelId ?? ""}
              onChange={(e) => patch({ xAxisLabelId: e.target.value })}
              placeholder="Label sumbu X dalam Bahasa Indonesia"
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>

          {/* Y-Axis Label - English */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Y-Axis Label (English)</label>
            <input type="text" value={effective.yAxisLabel ?? ""}
              onChange={(e) => patch({ yAxisLabel: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>

          {/* Y-Axis Label - Indonesian */}
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Y-Axis Label (Bahasa Indonesia)</label>
            <input type="text" value={effective.yAxisLabelId ?? ""}
              onChange={(e) => patch({ yAxisLabelId: e.target.value })}
              placeholder="Label sumbu Y dalam Bahasa Indonesia"
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>

          {/* Subtitle - English */}
          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subtitle (English)</label>
            <textarea rows={2} value={effective.subtitle ?? ""}
              onChange={(e) => patch({ subtitle: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 resize-none" />
          </div>

          {/* Subtitle - Indonesian */}
          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subtitle (Bahasa Indonesia)</label>
            <textarea rows={2} value={effective.subtitleId ?? ""}
              onChange={(e) => patch({ subtitleId: e.target.value })}
              placeholder="Subtitel dalam Bahasa Indonesia"
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 resize-none" />
          </div>

          {/* ─── COMBO CHART CONFIG ───────────────────────────────────── */}
          {effective.chartType === "combo" && (
            <div className="md:col-span-2 border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span className="text-[13px] font-bold text-blue-800">Combo Chart Configuration</span>
              </div>
              <p className="text-[11.5px] text-blue-600 -mt-1">Pilih kolom mana yang jadi <strong>bar</strong> (sumbu kiri) vs <strong>line</strong> (sumbu kanan).</p>

              {/* Bar columns */}
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Bar Columns — Left Axis (e.g. GDP Index)
                </label>
                <div className="flex flex-wrap gap-2">
                  {effective.columns.slice(1).map((col) => {
                    const isBar = effective.comboConfig?.barColumns?.includes(col);
                    return (
                      <button key={col} onClick={() => {
                        const prev = effective.comboConfig?.barColumns ?? effective.columns.slice(1);
                        const next = isBar ? prev.filter(c => c !== col) : [...prev.filter(c => c !== col), col];
                        patch({ comboConfig: { ...effective.comboConfig, barColumns: next, lineColumns: effective.columns.slice(1).filter(c => !next.includes(c)) } });
                      }}
                        className={`px-3 py-1.5 text-[11.5px] font-medium rounded-lg border transition-colors ${
                          isBar ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                        }`}>
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Line columns */}
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Line Columns — Right Axis (e.g. YoY %)
                </label>
                <div className="flex flex-wrap gap-2">
                  {effective.columns.slice(1).map((col) => {
                    const isLine = effective.comboConfig?.lineColumns?.includes(col);
                    return (
                      <button key={col} onClick={() => {
                        const prev = effective.comboConfig?.lineColumns ?? [];
                        const next = isLine ? prev.filter(c => c !== col) : [...prev.filter(c => c !== col), col];
                        patch({ comboConfig: { ...effective.comboConfig, lineColumns: next, barColumns: effective.columns.slice(1).filter(c => !next.includes(c)) } });
                      }}
                        className={`px-3 py-1.5 text-[11.5px] font-medium rounded-lg border transition-colors ${
                          isLine ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-200 hover:border-orange-400"
                        }`}>
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Axis labels */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Left Axis Label</label>
                  <input type="text" value={effective.comboConfig?.leftLabel ?? ""}
                    onChange={(e) => patch({ comboConfig: { ...effective.comboConfig, leftLabel: e.target.value, barColumns: effective.columns.slice(1), lineColumns: effective.comboConfig?.lineColumns ?? [] } })}
                    placeholder="e.g. (Indeks)"
                    className="w-full border border-gray-200 px-3 py-2 text-[12.5px] rounded-lg focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Right Axis Label</label>
                  <input type="text" value={effective.comboConfig?.rightLabel ?? ""}
                    onChange={(e) => patch({ comboConfig: { ...effective.comboConfig, rightLabel: e.target.value, barColumns: effective.columns.slice(1), lineColumns: effective.comboConfig?.lineColumns ?? [] } })}
                    placeholder="e.g. (%)"
                    className="w-full border border-gray-200 px-3 py-2 text-[12.5px] rounded-lg focus:outline-none focus:border-orange-400" />
                </div>
              </div>

              {/* GDP breakdown section */}
              <div className="border-t border-blue-200 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="enableBreakdown"
                    checked={!!(effective.donutConfig?.breakdownRows?.length)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const sample = effective.rows[0];
                        const labelKey = Object.keys(sample ?? {}).find(k => typeof sample[k] === 'string') ?? effective.columns[0];
                        const valKey = effective.columns[1] ?? "";
                        patch({ donutConfig: { ...effective.donutConfig, labelColumn: effective.columns[0], valueColumn: valKey, breakdownRows: effective.rows.slice(), breakdownLabelCol: labelKey, breakdownValueCol: valKey } });
                      } else {
                        patch({ donutConfig: { ...effective.donutConfig, breakdownRows: undefined, breakdownLabelCol: undefined, breakdownValueCol: undefined } });
                      }
                    }}
                    className="w-3.5 h-3.5 accent-blue-600" />
                  <label htmlFor="enableBreakdown" className="text-[12px] font-semibold text-blue-700">Add GDP Composition Breakdown Below Chart</label>
                </div>
                {effective.donutConfig?.breakdownRows?.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10.5px] text-gray-500 mb-1">Breakdown Label Column</label>
                        <select value={effective.donutConfig.breakdownLabelCol ?? effective.columns[0]}
                          onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, breakdownLabelCol: e.target.value } })}
                          className="w-full border border-gray-200 px-2 py-1.5 text-[12px] rounded focus:outline-none focus:border-blue-400 bg-white">
                          {effective.columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-gray-500 mb-1">Breakdown Value Column</label>
                        <select value={effective.donutConfig.breakdownValueCol ?? effective.columns[1] ?? ""}
                          onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, breakdownValueCol: e.target.value } })}
                          className="w-full border border-gray-200 px-2 py-1.5 text-[12px] rounded focus:outline-none focus:border-blue-400 bg-white">
                          {effective.columns.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Breakdown Border Color */}
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-[10.5px] text-gray-500 mb-1">Border Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={effective.donutConfig?.breakdownBorderColor ?? "#E5E7EB"}
                            onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, breakdownBorderColor: e.target.value } })}
                            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={effective.donutConfig?.breakdownBorderColor ?? "#E5E7EB"}
                            onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, breakdownBorderColor: e.target.value } })}
                            placeholder="#E5E7EB"
                            className="border border-gray-200 px-2 py-1 text-[12px] rounded w-[100px] focus:outline-none focus:border-blue-400 font-mono"
                          />
                        </div>
                      </div>
                      <div className="text-[10.5px] text-gray-400 mt-4">Border & top-line color for the breakdown section</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── DONUT CHART CONFIG ─────────────────────────────────── */}
          {effective.chartType === "donut" && (
            <div className="md:col-span-2 border border-purple-200 bg-purple-50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                <span className="text-[13px] font-bold text-purple-800">Donut Chart Configuration</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Label Column (Categories)</label>
                  <select value={effective.donutConfig?.labelColumn ?? effective.columns[0]}
                    onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, labelColumn: e.target.value, valueColumn: effective.donutConfig?.valueColumn ?? effective.columns[1] ?? "" } })}
                    className="w-full border border-gray-200 px-2 py-2 text-[12.5px] rounded-lg focus:outline-none focus:border-purple-400 bg-white">
                    {effective.columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Value Column</label>
                  <select value={effective.donutConfig?.valueColumn ?? effective.columns[1] ?? ""}
                    onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, valueColumn: e.target.value } })}
                    className="w-full border border-gray-200 px-2 py-2 text-[12.5px] rounded-lg focus:outline-none focus:border-purple-400 bg-white">
                    {effective.columns.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="donutShowPct"
                    checked={effective.donutConfig?.showPercentage ?? true}
                    onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, showPercentage: e.target.checked } })}
                    className="w-3.5 h-3.5 accent-purple-600" />
                  <label htmlFor="donutShowPct" className="text-[12px] font-medium text-gray-600">Show % instead of raw value</label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11.5px] font-medium text-gray-500">Inner Radius:</label>
                  <input type="range" min="0" max="90" value={effective.donutConfig?.innerRadiusPercent ?? 60}
                    onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, innerRadiusPercent: Number(e.target.value) } })}
                    className="w-24 accent-purple-600" />
                  <span className="text-[12px] text-gray-600">{effective.donutConfig?.innerRadiusPercent ?? 60}%</span>
                </div>
              </div>

              {/* Breakdown section for donut */}
              <div className="border-t border-purple-200 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="enableDonutBreakdown"
                    checked={!!(effective.donutConfig?.breakdownRows?.length)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const labelKey = Object.keys(effective.rows[0] ?? {}).find(k => typeof effective.rows[0][k] === 'string') ?? effective.columns[0];
                        const valKey = effective.donutConfig?.valueColumn ?? effective.columns[1] ?? "";
                        patch({ donutConfig: { ...effective.donutConfig, breakdownRows: effective.rows.slice(), breakdownLabelCol: labelKey, breakdownValueCol: valKey } });
                      } else {
                        patch({ donutConfig: { ...effective.donutConfig, breakdownRows: undefined, breakdownLabelCol: undefined, breakdownValueCol: undefined } });
                      }
                    }}
                    className="w-3.5 h-3.5 accent-purple-600" />
                  <label htmlFor="enableDonutBreakdown" className="text-[12px] font-semibold text-purple-700">Add Breakdown Table Below Donut</label>
                </div>
                {effective.donutConfig?.breakdownRows?.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Breakdown Label Column</label>
                      <select value={effective.donutConfig.breakdownLabelCol ?? effective.columns[0]}
                        onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, breakdownLabelCol: e.target.value } })}
                        className="w-full border border-gray-200 px-2 py-1.5 text-[12px] rounded focus:outline-none focus:border-purple-400 bg-white">
                        {effective.columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Breakdown Value Column</label>
                      <select value={effective.donutConfig.breakdownValueCol ?? effective.columns[1] ?? ""}
                        onChange={(e) => patch({ donutConfig: { ...effective.donutConfig, breakdownValueCol: e.target.value } })}
                        className="w-full border border-gray-200 px-2 py-1.5 text-[12px] rounded focus:outline-none focus:border-purple-400 bg-white">
                        {effective.columns.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Series Colors */}
          {effective.columns.slice(1).map((col, i) => {
            const currentColor = (effective.colors ?? [])[i] ?? "#1a3a5c";
            return (
              <div key={col} className="md:col-span-2">
                <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Color — {col}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {CHART_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateSeriesColor(i, c)}
                      className={`w-6 h-6 rounded border-2 cursor-pointer transition-transform ${currentColor.toLowerCase() === c.toLowerCase() ? "border-gray-900 scale-110" : "border-gray-200 hover:border-gray-400"}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <span className="text-[11px] text-gray-400 font-mono ml-1">{currentColor}</span>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => updateSeriesColor(i, e.target.value)}
                    className="w-8 h-6 cursor-pointer border border-gray-200 rounded"
                    title="Custom color"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Column Labels tab — locale-specific display names */}
      {tab === "columns" && (
        <div className="bg-white border border-[#E5E7EB] p-6">
          <div className="mb-5 pb-4 border-b border-[#E5E7EB]">
            <p className="text-[12.5px] text-gray-600">
              Set display names for columns per language. Leave blank to use the raw column key.
            </p>
          </div>
          {effective.columns.map((col, colIdx) => (
            <div key={col} className="mb-5 p-4 border border-[#E5E7EB]">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                Column {colIdx + 1}: <span className="text-gray-700 font-mono">{col}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    English Label
                  </label>
                  <input
                    type="text"
                    value={(effective.columnNames?.en ?? [])[colIdx] ?? ""}
                    onChange={(e) => {
                      const currentEn = effective.columnNames?.en ?? [...effective.columns];
                      const newEn = [...currentEn];
                      newEn[colIdx] = e.target.value;
                      patch({
                        columnNames: {
                          ...effective.columnNames,
                          en: newEn,
                        },
                      });
                    }}
                    placeholder={col}
                    className="w-full border border-[#E5E7EB] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Indonesian Label
                  </label>
                  <input
                    type="text"
                    value={(effective.columnNames?.id ?? [])[colIdx] ?? ""}
                    onChange={(e) => {
                      const currentId = effective.columnNames?.id ?? [...effective.columns];
                      const newId = [...currentId];
                      newId[colIdx] = e.target.value;
                      patch({
                        columnNames: {
                          ...effective.columnNames,
                          id: newId,
                        },
                      });
                    }}
                    placeholder={col}
                    className="w-full border border-[#E5E7EB] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data table tab */}
      {tab === "data" && (
        <div className="bg-white border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-gray-600">First column = X-axis labels. Remaining columns = data series.</p>
            <div className="flex gap-2">
              <button onClick={addColumn} className="flex items-center gap-1 text-[12px] font-medium text-gray-700 border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                <Plus className="w-3.5 h-3.5" /> Add Series
              </button>
              <button onClick={addRow} className="flex items-center gap-1 text-[12px] font-medium text-white bg-gray-900 px-3 py-1.5 hover:bg-gray-700">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {/* Series Colors */}
            {effective.columns.slice(1).length > 0 && (
              <div className="mb-3 pb-3 border-b border-[#E5E7EB]">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Series Colors</div>
                <div className="flex flex-wrap gap-3">
                  {effective.columns.slice(1).map((col, i) => {
                    const currentColor = (effective.colors ?? [])[i] ?? "#1a3a5c";
                    return (
                      <div key={col} className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-600 font-medium w-20 truncate">{col}</span>
                        <div className="flex items-center gap-0.5">
                          {CHART_PALETTE.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateSeriesColor(i, c)}
                              className={`w-4 h-4 rounded border cursor-pointer transition-transform ${currentColor.toLowerCase() === c.toLowerCase() ? "border-gray-900 scale-110" : "border-gray-200 hover:border-gray-400"}`}
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                          <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => updateSeriesColor(i, e.target.value)}
                            className="w-5 h-4 cursor-pointer border border-gray-200 rounded"
                            title="Custom color"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr>
                  {effective.columns.map((col, i) => (
                    <th key={col} className="border border-[#E5E7EB] bg-gray-50 px-2 py-1.5 text-left min-w-[100px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <input value={col} onChange={(e) => renameColumn(col, e.target.value)}
                            className="text-[12px] font-semibold text-gray-700 bg-transparent focus:outline-none w-full" />
                          {i > 1 && (
                            <button onClick={() => removeColumn(col)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="border border-[#E5E7EB] bg-gray-50 px-2 py-1.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {effective.rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-50">
                    {effective.columns.map((col) => (
                      <td key={col} className="border border-[#F3F4F6] px-2 py-1">
                        <input value={row[col] ?? ""} onChange={(e) => updateCell(ri, col, e.target.value)}
                          className="w-full text-[12.5px] text-gray-800 focus:outline-none bg-transparent" />
                      </td>
                    ))}
                    <td className="border border-[#F3F4F6] px-2 py-1 text-center">
                      <button onClick={() => removeRow(ri)} className="text-gray-300 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview tab */}
      {tab === "preview" && (
        <div className="bg-white border border-[#E5E7EB] p-6">
          {/* Series Colors */}
          <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Series Colors</div>
            <div className="flex flex-wrap gap-4">
              {effective.columns.slice(1).map((col, i) => {
                const currentColor = (effective.colors ?? [])[i] ?? "#1a3a5c";
                return (
                  <div key={col} className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-gray-700 w-28 truncate">{col}</span>
                    <div className="flex items-center gap-1">
                      {CHART_PALETTE.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateSeriesColor(i, c)}
                          className={`w-5 h-5 rounded border-2 cursor-pointer transition-transform ${currentColor.toLowerCase() === c.toLowerCase() ? "border-gray-900 scale-110" : "border-gray-200 hover:border-gray-400"}`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => updateSeriesColor(i, e.target.value)}
                        className="w-6 h-5 cursor-pointer border border-gray-200 rounded"
                        title="Custom color"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <h3 className="text-[16px] font-semibold text-gray-900 mb-1">{effective.title}</h3>
          {effective.description && <p className="text-[12.5px] text-gray-500 mb-5">{effective.description}</p>}
          <InteractiveChart dataset={effective} height={320} />
          <p className="text-[11px] text-gray-400 mt-4">
            Unit: {effective.unit} · {effective.rows.length} rows
            {(effective as any).chartTitle && ` · Chart title: ${(effective as any).chartTitle}`}
          </p>
        </div>
      )}

      {/* Save button sticky bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-6 -mx-6 -mb-10 mt-12 flex items-center justify-between z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-6">
          <button
            onClick={onSave}
            disabled={isSaving || isInvalid}
            className={`flex items-center gap-2.5 text-[14px] font-bold text-white px-8 py-3.5 rounded-2xl transition-all shadow-xl ${
              isSaving 
                ? "bg-gray-400 cursor-not-allowed" 
                : isInvalid 
                  ? "bg-gray-300 cursor-not-allowed opacity-50" 
                  : "bg-gray-900 hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-gray-200"
            }`}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : isSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Saving Dataset..." : isSuccess ? "Changes Saved!" : "Save Dataset"}
          </button>
          
          {isInvalid && (
            <div className="flex items-center gap-2 text-red-500 text-[12px] font-semibold animate-pulse">
              <AlertCircle className="w-4 h-4" />
              Title and Category are required.
            </div>
          )}
          
          <AnimatePresence>
            {showSavedMsg && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-[13px] font-bold text-green-600 flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Ready for live view
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="text-[11px] text-gray-400 font-medium">
          Shortcut: <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">Ctrl + S</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page Editor ────────────────────────────────────────────────────────────────

function PageEditor({
  page, onBack, isNew, defaultLocaleForNew = "en",
}: {
  page: Page | null;
  onBack: () => void;
  isNew?: boolean;
  defaultLocaleForNew?: "en" | "id";
}) {
  const updateMut = useUpdatePage();
  const createMut = useCreatePage();
  const isSaving = updateMut.isPending || createMut.isPending;
  const [draft, setDraft] = useState<Partial<Page>>(() => (page ? { ...page } : { ...newPage(defaultLocaleForNew) }));
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasEverSaved, setHasEverSaved] = useState(!isNew);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSaveError(null);
    setSavedSlug(null);
    setLastSaved(null);
    setIsAutoSaving(false);
    setHasEverSaved(!isNew);
    if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    if (page) setDraft({ ...page });
    else if (isNew) setDraft({ ...newPage(defaultLocaleForNew) });
  }, [page?.id, isNew, defaultLocaleForNew]);

  const statusOk = draft.status === "draft" || draft.status === "published";

  const doSave = (onSuccess?: () => void) => {
    if (!draft) return;
    setSaveError(null);
    if (!statusOk) {
      setSaveError("Pilih status dulu: Draft (hidden) atau Published (live), baru klik Save.");
      return;
    }
    const slug = normalizePageSlug(draft.slug ?? "");
    const title = (draft.title ?? "").trim();
    if (!title) {
      setSaveError("Judul halaman wajib diisi.");
      return;
    }
    const payload: Partial<Page> = { ...draft, slug, title, status: draft.status };

    if (isNew) {
      createMut.mutate(payload as Omit<Page, "id" | "createdAt" | "updatedAt">, {
        onSuccess: (saved: Page) => {
          setSavedSlug(saved.slug ?? slug);
          setHasEverSaved(true);
          onSuccess?.();
        },
        onError: (e: Error) => setSaveError(e.message || "Gagal menyimpan"),
      });
    } else if (page?.id) {
      updateMut.mutate(
        { id: page.id, data: payload },
        {
          onSuccess: () => {
            setSavedSlug(slug);
            setLastSaved(new Date().toLocaleTimeString());
            onSuccess?.();
          },
          onError: (e: Error) => setSaveError(e.message || "Gagal menyimpan"),
        }
      );
    }
  };

  const handleSave = () => doSave();

  // Auto-save after 2 seconds of inactivity (only for existing pages that have been saved once)
  useEffect(() => {
    if (!hasEverSaved || !draft || isNew || !statusOk) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setIsAutoSaving(true);
      doSave(() => setIsAutoSaving(false));
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [draft, hasEverSaved, isNew, statusOk]);

  const patch = (fields: Partial<Page>) => {
    setSaveError(null);
    setDraft((prev) => ({ ...prev, ...fields }));
  };

  const viewHref = savedSlug ? (savedSlug.startsWith("/") ? savedSlug : `/${savedSlug}`) : "/";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 font-medium">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-gray-300">·</span>
          <span className="text-[13px] font-medium text-gray-700">
            {isNew ? "New Page" : (draft.title ?? page?.title ?? "Untitled")}
          </span>
          {page ? <StatusBadge status={page.status} /> : draft.status ? <StatusBadge status={draft.status} /> : null}
          <LocaleBadge locale={(draft.locale ?? page?.locale ?? "en") as "en" | "id"} />
        </div>
        {/* Auto-save status indicator */}
        <div className="flex items-center gap-2">
          {isAutoSaving && (
            <div className="flex items-center gap-1.5 text-[12px] text-blue-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Auto-saving...</span>
            </div>
          )}
          {lastSaved && !isAutoSaving && (
            <div className="flex items-center gap-1.5 text-[12px] text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saved at {lastSaved}</span>
            </div>
          )}
          {draft && !isAutoSaving && !isNew && hasEverSaved && (
            <div className="flex items-center gap-1.5 text-[12px] text-amber-600">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] p-6 grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="md:col-span-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-4 pb-3 border-b border-[#E5E7EB]">Page Identity</div>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Slug (URL path)</label>
          <input type="text" value={draft.slug ?? ""}
            onChange={(e) => patch({ slug: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 font-mono" />
          <p className="text-[10.5px] text-gray-400 mt-1">e.g. /macro/macro-outlooks or /about</p>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Language</label>
          <div className="flex gap-2">
            {(["en", "id"] as const).map((l) => (
              <button key={l} onClick={() => patch({ locale: l })}
                className={`px-4 py-2 text-[12.5px] font-semibold border capitalize ${
                  draft.locale === l ? "bg-gray-900 text-white border-gray-900" : "border-[#E5E7EB] text-gray-600 hover:bg-gray-50"
                }`}>
                {l === "en" ? "English" : "Bahasa Indonesia"}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Page Title</label>
          <input type="text" value={draft.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-gray-900" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Meta Description (SEO)</label>
          <textarea rows={2} value={draft.description ?? ""}
            onChange={(e) => patch({ description: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 resize-none" />
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Navigation Label</label>
          <input type="text" value={draft.navLabel ?? ""}
            onChange={(e) => patch({ navLabel: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          <p className="text-[10.5px] text-gray-400 mt-1">Short label shown in the top navigation bar</p>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Section</label>
          <input
            type="text"
            list="section-suggestions"
            value={draft.section ?? "root"}
            onChange={(e) => patch({ section: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900"
            placeholder="e.g. Macro Foundations"
          />
          <datalist id="section-suggestions">
            {SECTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
          <p className="text-[10.5px] text-gray-400 mt-1">
            Pilih dari daftar atau ketik nama section baru. Pages dengan section sama akan dikelompokkan di submenu navbar.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Status <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {(["draft", "published"] as const).map((s) => (
              <button key={s} type="button" onClick={() => patch({ status: s })}
                className={`px-4 py-2 text-[12.5px] font-semibold border capitalize ${
                  draft.status === s ? "bg-gray-900 text-white border-gray-900" : "border-[#E5E7EB] text-gray-600 hover:bg-gray-50"
                }`}>
                {s === "published" ? "Published (live)" : "Draft (hidden)"}
              </button>
            ))}
          </div>
          <p className="text-[10.5px] text-gray-500 mt-2">
            Wajib pilih salah satu sebelum Save. Hanya <strong>Published (live)</strong> yang tampil di situs publik.
          </p>
        </div>

        {/* Linked page info */}
        {!isNew && page?.linkedIdRecord && (
          <div className="md:col-span-2 bg-gray-50 border border-gray-200 p-4 flex items-start gap-3">
            <Link2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[12.5px] font-semibold text-gray-700">Linked translation</p>
              <p className="text-[12px] text-gray-500 mt-0.5">
                This page is linked to the <LocaleBadge locale={page.linkedIdRecord.locale} /> version:
                <strong className="ml-1">{page.linkedIdRecord.title}</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content Blocks */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Content Blocks</div>
          <div className="flex gap-2 flex-wrap">
            {(["hero", "text", "stats", "chart", "about"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => { const defaults = { hero: { type: t as "hero", headline: "New Section", subheadline: "" }, text: { type: t as "text", content: "" }, stats: { type: t as "stats", items: [{ label: "Label", value: "Value" }] }, chart: { type: t as "chart", datasetId: "" }, about: { type: t as "about", headline: "Our Approach", items: [{ label: "Item", value: "Description" }] } }; patch({ content: [...(draft.content ?? []), defaults[t]] }); }}
                className="flex items-center gap-1.5 text-[11.5px] font-medium text-gray-600 border border-[#E5E7EB] px-2.5 py-1.5 hover:bg-gray-50 bg-white">
                <Plus className="w-3 h-3" /> + {t}
              </button>
            ))}
          </div>
        </div>
        {(draft.content ?? []).length === 0 ? (
          <div className="text-center text-gray-400 text-[12.5px] py-10 border border-dashed border-[#E5E7EB]">
            No content blocks yet. Click + hero / + text / + stats / + chart / + about above to add.
          </div>
        ) : (
          <div className="space-y-3">
            {(draft.content ?? []).map((block: any, i: number) => (
              <div key={i} className="bg-white border border-[#E5E7EB] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase bg-gray-100 px-2 py-0.5">{block.type}</span>
                  <button type="button" onClick={() => patch({ content: (draft.content ?? []).filter((_: any, j: number) => j !== i) })}
                    className="ml-auto text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {block.type === "hero" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Headline</label>
                      <input value={block.headline ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], headline: e.target.value }; patch({ content: c }); }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Subheadline</label>
                      <input value={block.subheadline ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], subheadline: e.target.value }; patch({ content: c }); }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900" />
                    </div>
                  </div>
                )}
                {block.type === "text" && (
                  <div>
                    <label className="block text-[10.5px] text-gray-500 mb-1">Content</label>
                    <textarea rows={3} value={block.content ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], content: e.target.value }; patch({ content: c }); }}
                      className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900 resize-none" />
                  </div>
                )}
                {block.type === "stats" && (
                  <div>
                    <label className="block text-[10.5px] text-gray-500 mb-1">Items (JSON array)</label>
                    <textarea rows={3} value={JSON.stringify(block.items ?? [], null, 2)} onChange={(e) => {
                      try { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], items: JSON.parse(e.target.value) }; patch({ content: c }); } catch {}
                    }}
                      className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12px] font-mono focus:outline-none focus:border-gray-900 resize-none" />
                  </div>
                )}
                {block.type === "chart" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Dataset ID</label>
                      <input value={block.datasetId ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], datasetId: e.target.value }; patch({ content: c }); }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Title</label>
                      <input value={block.title ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], title: e.target.value }; patch({ content: c }); }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Description</label>
                      <input value={block.description ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], description: e.target.value }; patch({ content: c }); }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900" />
                    </div>
                  </div>
                )}
                {block.type === "about" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Headline</label>
                      <input value={block.headline ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], headline: e.target.value }; patch({ content: c }); }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Description</label>
                      <textarea rows={2} value={block.description ?? ""} onChange={(e) => { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], description: e.target.value }; patch({ content: c }); }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900 resize-none" />
                    </div>
                    <div>
                      <label className="block text-[10.5px] text-gray-500 mb-1">Items (JSON array)</label>
                      <textarea rows={4} value={JSON.stringify(block.items ?? [], null, 2)} onChange={(e) => {
                        try { const c = [...(draft.content ?? [])]; c[i] = { ...c[i], items: JSON.parse(e.target.value) }; patch({ content: c }); } catch {}
                      }}
                        className="w-full border border-[#E5E7EB] px-2 py-1.5 text-[12px] font-mono focus:outline-none focus:border-gray-900 resize-none" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {saveError && (
        <div className="mb-4 text-[12.5px] text-red-600">
          {saveError}
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !statusOk}
          title={!statusOk ? "Pilih Draft atau Published terlebih dahulu" : undefined}
          className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-5 py-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving…" : "Save Page"}
        </button>
        {(updateMut.isSuccess || createMut.isSuccess) && !savedSlug && (
          <span className="text-[12px] text-gray-500">Saved</span>
        )}
      </div>

      {/* Post-save success panel */}
      {savedSlug && (
        <div className="mt-4 bg-gray-50 border border-gray-200 p-4">
          <p className="text-[12.5px] font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            Page saved successfully
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={viewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-medium text-gray-900 underline"
            >
              View on site → {window.location.origin}{viewHref}
            </a>
            {draft.status === "draft" && (
              <span className="text-[11px] text-gray-500">
                Draft tidak tampil di situs sampai Anda pilih Published lalu Save lagi.
              </span>
            )}
            <span className="text-gray-300">·</span>
            <button
              onClick={() => { setSavedSlug(null); onBack(); }}
              className="text-[12.5px] text-gray-500 hover:text-gray-800 underline"
            >
              Back to list
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Blog Post Editor ──────────────────────────────────────────────────────────

function PostEditor({
  post, onBack, isNew, defaultLocaleForNew = "en",
}: {
  post: BlogPost | null;
  onBack: () => void;
  isNew?: boolean;
  defaultLocaleForNew?: "en" | "id";
}) {
  const updateMut = useUpdatePost();
  const createMut = useCreatePost();
  const isSaving = updateMut.isPending || createMut.isPending;
  const [draft, setDraft] = useState<Partial<BlogPost>>(() =>
    post ? { ...post } : { ...newPost(defaultLocaleForNew) }
  );
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasEverSaved, setHasEverSaved] = useState(!isNew);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when post changes
  useEffect(() => {
    setSaveError(null);
    setSavedSlug(null);
    setLastSaved(null);
    setIsAutoSaving(false);
    setHasEverSaved(!isNew);
    if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    if (post) setDraft({ ...post });
    else if (isNew) setDraft({ ...newPost(defaultLocaleForNew) });
  }, [post?.id, isNew, defaultLocaleForNew]);

  const statusOk = draft.status === "draft" || draft.status === "published";

  const doSave = (onSuccess?: () => void) => {
    if (!draft) return;
    setSaveError(null);
    if (!statusOk) {
      setSaveError("Pilih status dulu: Draft atau Published, baru klik Save.");
      return;
    }
    const slug = normalizeBlogSlug(draft.slug ?? "");
    const title = (draft.title ?? "").trim();
    if (!title) {
      setSaveError("Judul posting wajib diisi.");
      return;
    }
    const bodyLines = Array.isArray(draft.body) ? draft.body : [""];
    const payload: Partial<BlogPost> = {
      ...draft,
      slug,
      title,
      body: bodyLines,
      status: draft.status,
    };

    if (isNew) {
      createMut.mutate(payload as Omit<BlogPost, "id" | "createdAt" | "updatedAt">, {
        onSuccess: (saved: BlogPost) => {
          setSavedSlug(saved.slug ?? slug);
          setHasEverSaved(true);
          onSuccess?.();
        },
        onError: (e: Error) => setSaveError(e.message || "Gagal menyimpan"),
      });
    } else if (post?.id) {
      updateMut.mutate(
        { id: post.id, data: payload },
        {
          onSuccess: () => {
            setSavedSlug(slug);
            setLastSaved(new Date().toLocaleTimeString());
            onSuccess?.();
          },
          onError: (e: Error) => setSaveError(e.message || "Gagal menyimpan"),
        }
      );
    }
  };

  const handleSave = () => doSave();

  // Auto-save after 2 seconds of inactivity (only for existing posts that have been saved once)
  useEffect(() => {
    if (!hasEverSaved || !draft || isNew || !statusOk) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setIsAutoSaving(true);
      doSave(() => setIsAutoSaving(false));
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [draft, hasEverSaved, isNew, statusOk]);

  const patch = (fields: Partial<BlogPost>) => {
    setSaveError(null);
    setDraft((prev) => ({ ...prev, ...fields }));
  };

  const bodyLines = Array.isArray(draft.body) ? draft.body : [""];
  const setBodyLines = (lines: string[]) => patch({ body: lines });

  const articleHref = savedSlug ? `/article/${savedSlug}` : "/blog";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 font-medium">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-gray-300">·</span>
          <span className="text-[13px] font-medium text-gray-700">
            {isNew ? "New Blog Post" : (draft.title ?? post?.title ?? "Untitled")}
          </span>
          {post ? <StatusBadge status={post.status} /> : draft.status ? <StatusBadge status={draft.status} /> : null}
          <LocaleBadge locale={(draft.locale ?? post?.locale ?? "en") as "en" | "id"} />
        </div>
        {/* Auto-save status indicator */}
        <div className="flex items-center gap-2">
          {isAutoSaving && (
            <div className="flex items-center gap-1.5 text-[12px] text-blue-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Auto-saving...</span>
            </div>
          )}
          {lastSaved && !isAutoSaving && (
            <div className="flex items-center gap-1.5 text-[12px] text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saved at {lastSaved}</span>
            </div>
          )}
          {draft && !isAutoSaving && !isNew && hasEverSaved && (
            <div className="flex items-center gap-1.5 text-[12px] text-amber-600">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] p-6 grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="md:col-span-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-4 pb-3 border-b border-[#E5E7EB]">Post Identity</div>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Slug</label>
          <input type="text" value={draft.slug ?? ""}
            onChange={(e) => patch({ slug: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 font-mono" />
          <p className="text-[10.5px] text-gray-400 mt-1">URL slug, e.g. my-post-title</p>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Language</label>
          <div className="flex gap-2">
            {(["en", "id"] as const).map((l) => (
              <button key={l} onClick={() => patch({ locale: l })}
                className={`px-4 py-2 text-[12.5px] font-semibold border capitalize ${
                  draft.locale === l ? "bg-gray-900 text-white border-gray-900" : "border-[#E5E7EB] text-gray-600 hover:bg-gray-50"
                }`}>
                {l === "en" ? "English" : "Bahasa Indonesia"}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
          <input type="text" value={draft.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-gray-900" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Excerpt</label>
          <textarea rows={2} value={draft.excerpt ?? ""}
            onChange={(e) => patch({ excerpt: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 resize-none" />
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
          <div className="flex flex-col gap-2">
            <select 
              value={BLOG_CATEGORIES.includes(draft.category ?? "") ? draft.category : "custom"}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "custom") patch({ category: val });
                else patch({ category: "" });
              }}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white"
            >
              {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="custom">-- Other (Custom) --</option>
            </select>
            
            {(!BLOG_CATEGORIES.includes(draft.category ?? "")) && (
              <input 
                type="text"
                value={draft.category ?? ""}
                onChange={(e) => patch({ category: e.target.value })}
                className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white"
                placeholder="Type your custom category..."
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subcategory</label>
          {SUBCATEGORIES[draft.category ?? ""] ? (
            <select 
              value={draft.subcategory ?? ""}
              onChange={(e) => patch({ subcategory: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white"
            >
              <option value="">-- No Subcategory --</option>
              {SUBCATEGORIES[draft.category ?? ""].map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          ) : (
            <input 
              type="text"
              value={draft.subcategory ?? ""}
              onChange={(e) => patch({ subcategory: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900"
              placeholder="e.g. niche-topic"
            />
          )}
          <p className="text-[10.5px] text-gray-400 mt-1">Filtering tag for sub-menu placement.</p>
        </div>
        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tag</label>
          <input type="text" value={draft.tag ?? ""}
            onChange={(e) => patch({ tag: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Read Time</label>
          <input type="text" value={draft.readTime ?? ""}
            onChange={(e) => patch({ readTime: e.target.value })}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900"
            placeholder="e.g. 5 min read" />
        </div>

        <div>
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Status <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {(["draft", "published"] as const).map((s) => (
              <button key={s} type="button" onClick={() => patch({ status: s })}
                className={`px-4 py-2 text-[12.5px] font-semibold border capitalize ${
                  draft.status === s ? "bg-gray-900 text-white border-gray-900" : "border-[#E5E7EB] text-gray-600 hover:bg-gray-50"
                }`}>
                {s === "published" ? "Published (live)" : "Draft (hidden)"}
              </button>
            ))}
          </div>
          <p className="text-[10.5px] text-gray-500 mt-2">
            Wajib pilih salah satu sebelum Save. Hanya <strong>Published (live)</strong> yang tampil di situs.
          </p>
        </div>

        {/* Body editor */}
        <div className="md:col-span-2">
          <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Body — Paragraphs (one per line)
          </label>
          <textarea rows={bodyLines.length + 2} value={bodyLines.join("\n")}
            onChange={(e) => setBodyLines(e.target.value.split("\n"))}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 resize-y font-mono leading-relaxed"
            placeholder="Enter paragraph text… Each line becomes a new paragraph." />
          <p className="text-[10.5px] text-gray-400 mt-1">{bodyLines.length} paragraph{bodyLines.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 text-[12.5px] text-red-600">
          {saveError}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !statusOk}
          title={!statusOk ? "Pilih Draft atau Published terlebih dahulu" : undefined}
          className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-5 py-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving…" : "Save Post"}
        </button>
        {(updateMut.isSuccess || createMut.isSuccess) && !savedSlug && (
          <span className="text-[12px] text-gray-500">Saved</span>
        )}
      </div>

      {/* Post-save success panel */}
      {savedSlug && (
        <div className="mt-4 bg-gray-50 border border-gray-200 p-4">
          <p className="text-[12.5px] font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            Post saved successfully
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={articleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-medium text-gray-900 underline"
            >
              View article → {window.location.origin}{articleHref}
            </a>
            {draft.status === "draft" && (
              <span className="text-[11px] text-gray-500">
                Draft: artikel tidak tampil sampai Published + Save.
              </span>
            )}
            <span className="text-gray-300">·</span>
            <button
              type="button"
              onClick={() => { setSavedSlug(null); onBack(); }}
              className="text-[12.5px] text-gray-500 hover:text-gray-800 underline"
            >
              Back to list
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Featured Insights Tab ──────────────────────────────────────────────────────

function FeaturedInsightsTab() {
  const [activeLocale, setActiveLocale] = useState<"en" | "id">("en");
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: config, isLoading, refetch } = useFeaturedInsights(activeLocale);
  const updateMut = useUpdateFeaturedInsights();
  const resetMut = useResetFeaturedInsights();

  const { data: allPosts = [] } = usePosts({ status: "published", locale: activeLocale });
  const postsBySlug = new Map(allPosts.map((p) => [p.slug, p]));

  const [draft, setDraft] = useState<FeaturedInsightsConfig | null>(null);

  useEffect(() => {
    if (config) setDraft({ ...config, slugs: [...config.slugs] });
  }, [config, refreshKey]);

  if (isLoading || !draft) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
      </div>
    );
  }

  const handleSave = () => {
    updateMut.mutate(
      { locale: activeLocale, data: draft },
      { 
        onSuccess: (updated) => {
          setDraft({ ...updated, slugs: [...updated.slugs] });
          // Force refresh by triggering refetch
          refetch();
          setRefreshKey(k => k + 1);
        }
      },
    );
  };

  const handleReset = () => {
    if (!confirm("Reset Featured Insights to seed state?")) return;
    resetMut.mutate(undefined, { onSuccess: () => setActiveLocale(activeLocale === "en" ? "id" : "en") });
  };

  const currentSlugs = new Set(draft.slugs.map((s) => s.slug));

  const addSlug = (slug: string) => {
    const order = draft.slugs.length > 0 ? Math.max(...draft.slugs.map((s) => s.order)) + 1 : 1;
    setDraft({ ...draft, slugs: [...draft.slugs, { slug, label: "", order }] });
  };

  const removeSlug = (slug: string) => {
    setDraft({ ...draft, slugs: draft.slugs.filter((s) => s.slug !== slug) });
  };

  const moveSlug = (slug: string, direction: -1 | 1) => {
    const sorted = [...draft.slugs].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.slug === slug);
    const target = idx + direction;
    if (target < 0 || target >= sorted.length) return;
    const reordered = sorted.map((s, i) => {
      if (i === idx) return { ...s, order: sorted[target].order };
      if (i === target) return { ...s, order: sorted[idx].order };
      return s;
    });
    setDraft({ ...draft, slugs: reordered });
  };

  const patchMeta = (field: keyof Pick<FeaturedInsightsConfig, "title" | "subtitle" | "sectionLabel" | "limit">, value: string | number) => {
    setDraft({ ...draft, [field]: value });
  };

  const isSaving = updateMut.isPending;
  const availablePosts = allPosts.filter((p) => !currentSlugs.has(p.slug));
  const orderedSlugs = [...draft.slugs].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-semibold text-gray-900">Featured Insights</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Configure which research posts appear on the homepage — order, title, subtitle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} disabled={resetMut.isPending}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
            {resetMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Reset
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-1.5 text-[12px] font-semibold bg-gray-900 text-white px-4 py-1.5 hover:bg-gray-700 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Changes
          </button>
        </div>
      </div>

      {/* Locale toggle */}
      <div className="flex items-center gap-1 border border-gray-200 rounded p-0.5 mb-6 w-fit">
        {(["en", "id"] as const).map((loc) => (
          <button key={loc} onClick={() => setActiveLocale(loc)}
            className={`px-4 py-1.5 text-[12px] font-semibold rounded transition-colors ${
              activeLocale === loc ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
            }`}>
            {loc === "en" ? "English" : "Bahasa Indonesia"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: config meta */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-900">Section Settings</h3>
            {(["sectionLabel", "title", "subtitle"] as const).map((field) => (
              <div key={field}>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  {field === "sectionLabel" ? "Section Label" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input value={draft[field]} onChange={(e) => patchMeta(field, e.target.value)}
                  className="mt-1 w-full text-[13px] border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900" />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Max Posts</label>
              <input type="number" min={1} max={10} value={draft.limit}
                onChange={(e) => patchMeta("limit", Number(e.target.value))}
                className="mt-1 w-full text-[13px] border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showOnHomepage" checked={draft.showOnHomepage}
                onChange={(e) => setDraft({ ...draft, showOnHomepage: e.target.checked })} className="w-4 h-4 accent-gray-900" />
              <label htmlFor="showOnHomepage" className="text-[12.5px] text-gray-700">Show on Homepage</label>
            </div>
          </div>
          {updateMut.isSuccess && (
            <div className="text-[12px] text-gray-500">Saved successfully
            </div>
          )}
        </div>

        {/* Right: post selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-1">Selected Posts</h3>
            <p className="text-[11px] text-gray-400 mb-4">
              Order 1 = hero card (spans 2 cols) · {draft.slugs.length}/{draft.limit} slots used
            </p>
            {orderedSlugs.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-gray-400 border border-dashed border-gray-200 rounded">
                No posts selected — add from below
              </div>
            ) : (
              <div className="space-y-2">
                {orderedSlugs.map((item, idx) => {
                  const post = postsBySlug.get(item.slug);
                  return (
                    <div key={item.slug} className="flex items-center gap-3 border border-gray-200 rounded px-3 py-2.5 hover:border-gray-300 transition-colors">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                      }`}>{item.order}</div>
                      <div className="flex-1 min-w-0">
                        {post ? (
                          <div>
                            <div className="text-[12.5px] font-semibold text-gray-900 truncate">{post.title}</div>
                            <div className="text-[11px] text-gray-400">{post.category} · {post.readTime}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[12.5px] font-medium text-gray-600 truncate">{item.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                            <div className="text-[11px] text-amber-600">Slug: {item.slug} (post not found in published posts)</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveSlug(item.slug, -1)} disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveSlug(item.slug, 1)} disabled={idx === orderedSlugs.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeSlug(item.slug)} className="p-1 text-gray-400 hover:text-red-500" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-3">Add a Post</h3>
            {availablePosts.length === 0 ? (
              <p className="text-[12px] text-gray-400">All published posts are already selected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availablePosts.map((post) => (
                  <button key={post.slug} onClick={() => addSlug(post.slug)}
                    className="flex items-center gap-1.5 text-[11.5px] font-medium border border-gray-300 rounded px-2.5 py-1 hover:border-gray-900 hover:text-gray-900 transition-colors bg-white text-gray-600">
                    <Plus className="w-3 h-3" />
                    <span className="truncate max-w-[180px]">{post.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data Hub Tab ──────────────────────────────────────────────────────────────

function DataHubTab() {
  const { data: datasets = [], isLoading } = useDatasets();
  const createMut  = useCreateDataset();
  const updateMut  = useUpdateDataset();
  const deleteMut = useDeleteDataset();
  const resetMut  = useResetDatasets();
  const bulkCreateMut = useBulkCreateDatasets();

  const [selected, setSelected]   = useState<ChartDataset | null>(null);
  const [draft, setDraft]         = useState<Partial<ChartDataset> | null>(null);
  const [view, setView]          = useState<"list" | "edit">("list");
  const [csvPreview, setCsvPreview] = useState<{
    headers: string[];
    rows: string[][];
    detectedFormat: string;
    suggestedChart: any;
    tableData: any[];
  } | null>(null);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<"line" | "bar" | "area">("line");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileNameRef = useRef<string>('');

  // ─── Unified File Import ──────────────────────────────────────────────────────

  /** Detect delimiter by scoring consistency: delimiter that appears the same number
   *  of times across most data rows wins. Ignores blank/header-only rows. */
  const detectDelimiter = (lines: string[]): string => {
    const candidates = [';', '\t', ',', '|'];
    let best = ',';
    let bestScore = -1;

    for (const d of candidates) {
      const counts: number[] = [];
      for (const line of lines) {
        let n = 0, inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; continue; }
          if (!inQ && ch === d) n++;
        }
        if (n > 0) counts.push(n);
      }
      if (counts.length === 0) continue;
      const mode = counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)];
      const consistent = counts.filter(n => n === mode).length;
      const score = mode * (consistent / lines.length);
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return best;
  };

  /** Parse one delimited line, handles double-quoted fields and escaped "" */
  const parseDelimitedLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        result.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  /** Parse numeric cell — handles ID/EU/US thousand separators, currency, percent */
  const parseNumericCell = (raw: string): number => {
    let v = raw.trim().replace(/[^0-9.,\-]/g, '');
    if (!v) return 0;
    const lastDot = v.lastIndexOf('.');
    const lastComma = v.lastIndexOf(',');
    if (lastDot !== -1 && lastComma !== -1) {
      // Both separators present — last one is decimal
      if (lastComma > lastDot) v = v.replace(/\./g, '').replace(',', '.');
      else v = v.replace(/,/g, '');
    } else if (lastComma !== -1) {
      const after = v.slice(lastComma + 1);
      v = after.length === 3 ? v.replace(/,/g, '') : v.replace(',', '.');
    } else if (lastDot !== -1) {
      const dotCount = (v.match(/\./g) || []).length;
      if (dotCount > 1) v = v.replace(/\./g, ''); // 1.234.567 → 1234567
      // single dot: leave as-is (1.234 stays 1.234, 1.5 stays 1.5)
    }
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  /** >50% of non-empty values are numeric → numeric column */
  const isNumericColumn = (values: string[]): boolean => {
    const nonEmpty = values.filter(v => v.trim() !== '');
    if (nonEmpty.length === 0) return false;
    const num = nonEmpty.filter(v => {
      const s = v.replace(/[^0-9.,\-]/g, '');
      return s !== '' && !isNaN(parseFloat(s.replace(',', '.')));
    }).length;
    return num / nonEmpty.length > 0.5;
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileName = file.name;
    importFileNameRef.current = fileName;
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

    // ── JSON ─────────────────────────────────────────────────────────────────
    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const list = Array.isArray(json) ? json : [json];
          for (const ds of list) {
            if (!ds.title || !Array.isArray(ds.columns) || !Array.isArray(ds.rows))
              throw new Error('Each entry needs "title", "columns", and "rows".');
          }
          await bulkCreateMut.mutateAsync(list);
          alert(`Imported ${list.length} dataset(s) from ${fileName}`);
        } catch (err) { alert('JSON import failed: ' + (err as Error).message); }
        event.target.value = '';
      };
      reader.readAsText(file);
      return;
    }

    // ── CSV / TSV / TXT ───────────────────────────────────────────────────────
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = e.target?.result as string;
          // Strip BOM, normalize line endings
          const content = (raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw)
            .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

          // Split into lines, keep raw (don't trim yet — needed for delimiter detection)
          const rawLines = content.split('\n');

          // Detect delimiter using lines that have actual content
          const nonEmptyRaw = rawLines.filter(l => l.trim() !== '');
          if (nonEmptyRaw.length < 2) {
            alert('File needs at least a header row and one data row.');
            event.target.value = ''; return;
          }
          const delim = ext === 'tsv' ? '\t' : detectDelimiter(nonEmptyRaw);
          const parse = (l: string) => parseDelimitedLine(l, delim);

          // Filter to substantive lines: at least one non-empty cell after parsing
          const lines = nonEmptyRaw.filter(l => parse(l).some(c => c.trim() !== ''));
          if (lines.length < 2) {
            alert('No data found after parsing. Check your file format.');
            event.target.value = ''; return;
          }

          // ── Detect header row(s) ────────────────────────────────────────
          // A row is "data" if it contains at least one numeric-looking cell
          const looksLikeData = (cells: string[]) =>
            cells.some(c => { const s = c.trim().replace(/[^0-9.,\-]/g, ''); return s !== '' && !isNaN(parseFloat(s.replace(',', '.'))); });

          // Find first substantive row
          let hi = 0;
          // If first row is all-empty after parse (shouldn't happen after filter, but safety)
          while (hi < lines.length && !parse(lines[hi]).some(c => c.trim())) hi++;

          const row0 = parse(lines[hi]);
          let headers: string[] = row0.map(h => h.trim());
          let dataStart = hi + 1;

          // Check if next row is a sub-header (all text, no numeric cells)
          if (dataStart < lines.length) {
            const row1 = parse(lines[dataStart]);
            if (!looksLikeData(row1)) {
              // Merge row0 + row1 as combined header
              const merged: string[] = [];
              const len = Math.max(row0.length, row1.length);
              for (let i = 0; i < len; i++) {
                const a = (row0[i] ?? '').trim();
                const b = (row1[i] ?? '').trim();
                if (a && b && a !== b) merged.push(`${a} ${b}`);
                else merged.push(a || b);
              }
              headers = merged;
              dataStart++;
            }
          }

          // Clean up headers: trim, remove trailing empties, deduplicate
          while (headers.length > 1 && headers[headers.length - 1] === '') headers.pop();
          const seenH: Record<string, number> = {};
          headers = headers.map(h => {
            const k = h || '_';
            if (seenH[k] === undefined) { seenH[k] = 0; return h || `col_${Object.keys(seenH).length}`; }
            seenH[k]++;
            return h ? `${h}_${seenH[k]}` : `col_${Object.keys(seenH).length}_${seenH[k]}`;
          });

          // ── Parse data rows ─────────────────────────────────────────────
          const allRows = lines.slice(dataStart).map(l => {
            const cells = parse(l);
            while (cells.length < headers.length) cells.push('');
            return cells.slice(0, headers.length);
          }).filter(r => r.some(c => c.trim() !== ''));

          if (allRows.length === 0) {
            alert('No data rows found after headers.');
            event.target.value = ''; return;
          }

          // ── Build tableData (exact strings for preview) ─────────────────
          const tableData = allRows.map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
            return obj;
          });

          // ── Classify columns ────────────────────────────────────────────
          const numericCols: string[] = [];
          const labelCols: string[] = [];
          headers.forEach((h, idx) => {
            const vals = allRows.map(r => r[idx]);
            (isNumericColumn(vals) ? numericCols : labelCols).push(h);
          });

          // X-axis: prefer label column with long text (category names), not "NO" / index
          const primaryCol =
            labelCols.find(h => allRows.some(r => (r[headers.indexOf(h)] ?? '').length > 5))
            ?? labelCols[0]
            ?? headers[0];

          const valueCols = (numericCols.length > 0 ? numericCols : headers)
            .filter(c => c !== primaryCol);

          // ── Build chart data ────────────────────────────────────────────
          const pIdx = headers.indexOf(primaryCol);
          const chartData = allRows
            .map(row => {
              const item: Record<string, string | number> = { [primaryCol]: row[pIdx] ?? '' };
              valueCols.forEach(col => {
                item[col] = parseNumericCell(row[headers.indexOf(col)] ?? '');
              });
              return item;
            })
            .filter(item => String(item[primaryCol]).trim() !== '');

          const chartType: 'line' | 'bar' | 'area' =
            valueCols.length === 1 && allRows.length <= 12 ? 'bar'
            : valueCols.length === 1 ? 'area' : 'line';

          const delimLabel = delim === ';' ? 'semicolon' : delim === '\t' ? 'tab' : delim === '|' ? 'pipe' : 'comma';
          
          let initialHeaders = headers;
          let initialRows = allRows;
          let initialTableData = tableData;
          let initialChartData = chartData;
          let initialPrimaryCol = primaryCol;
          let initialValueCols = valueCols;

          // ── Auto-Transpose Detection ───────────────────────────────────
          // If headers (except first) look like months/years and first col looks like names, 
          // we likely want to transpose so months are on the X-axis.
          const headersLookLikeTime = headers.slice(1).filter(h => looksLikeTimePeriod(h)).length > (headers.length - 1) * 0.5;
          const firstColLooksLikeNames = allRows.slice(0, 5).some(r => (r[0] ?? '').length > 5);
          
          if (headersLookLikeTime && firstColLooksLikeNames) {
            console.log("Auto-transposing: Headers look like time periods and first column looks like category names.");
            // Perform transpose
            initialHeaders = [headers[0], ...allRows.map(r => r[0])];
            initialRows = headers.slice(1).map((h, colIdx) => {
              const idx = colIdx + 1;
              return [h, ...allRows.map(r => r[idx])];
            });
            initialTableData = initialRows.map(row => {
              const obj: Record<string, string> = {};
              initialHeaders.forEach((nh, i) => { obj[nh] = row[i] ?? ''; });
              return obj;
            });
            const numC: string[] = [];
            const labC: string[] = [];
            initialHeaders.forEach((nh, idx) => {
              const vals = initialRows.map(r => r[idx]);
              (isNumericColumn(vals) ? numC : labC).push(nh);
            });
            initialPrimaryCol = labC[0] ?? initialHeaders[0];
            initialValueCols = (numC.length > 0 ? numC : initialHeaders).filter(c => c !== initialPrimaryCol);
            const pIdxNew = initialHeaders.indexOf(initialPrimaryCol);
            initialChartData = initialRows.map(row => {
              const item: Record<string, string | number> = { [initialPrimaryCol]: row[pIdxNew] ?? '' };
              initialValueCols.forEach(col => {
                item[col] = parseNumericCell(row[initialHeaders.indexOf(col)] ?? '');
              });
              return item;
            });
          }

          setCsvPreview({
            headers: initialHeaders,
            rows: initialRows.slice(0, 100),
            detectedFormat: `${delimLabel}-separated · ${initialHeaders.length} cols · ${initialRows.length} rows`,
            suggestedChart: {
              title: 'Chart Preview',
              chartType,
              unit: '', unitType: 'number', color: '#1a3a5c',
              columns: [initialPrimaryCol, ...initialValueCols],
              rows: initialChartData,
              colors: initialValueCols.map((_: string, i: number) => CHART_PALETTE[i % CHART_PALETTE.length]),
            },
            tableData: initialTableData,
          });
          setSelectedChartType(chartType);
          setShowCsvPreview(true);

        } catch (err) {
          alert('File parsing failed: ' + (err as Error).message);
        }
        event.target.value = '';
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }

    alert(`".${ext}" tidak didukung. Upload CSV, TSV, atau JSON.`);
    event.target.value = '';
  };

  const effective = draft !== null ? { ...selected, ...draft } as ChartDataset : selected;

  // Auto-save functionality
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Auto-save after changes (debounced 2 seconds)
  useEffect(() => {
    // Only auto-save if we're in edit mode and there are unsaved changes
    if (!draft || !effective || effective.id.startsWith("tmp-")) return;

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set a new timer to auto-save after 2 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      const { id, createdAt, updatedAt, ...rest } = effective;
      setIsAutoSaving(true);
      
      updateMut.mutate(
        { id: effective.id, data: rest },
        {
          onSuccess: (updated) => {
            setSelected(updated);
            setDraft(null);
            setIsAutoSaving(false);
            setLastSaved(new Date().toLocaleTimeString());
          },
          onError: () => {
            setIsAutoSaving(false);
          }
        }
      );
    }, 2000); // 2 second debounce

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [draft, effective]);

  const handleSave = () => {
    if (!effective) return;
    const { id, createdAt, updatedAt, ...rest } = effective;
    if (effective.id.startsWith("tmp-")) {
      createMut.mutate(rest as any, { onSuccess: (created) => { setSelected(created); setDraft(null); setView("list"); } });
    } else {
      updateMut.mutate({ id: effective.id, data: rest }, { onSuccess: (updated) => { setSelected(updated); setDraft(null); setLastSaved(new Date().toLocaleTimeString()); } });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this dataset? This cannot be undone.")) return;
    deleteMut.mutate(id, { onSuccess: () => { if (selected?.id === id) { setSelected(null); setDraft(null); setView("list"); } } });
  };

  const handleReset = () => {
    if (!confirm("Reset all datasets to seed state? All edits will be lost.")) return;
    resetMut.mutate(undefined, { onSuccess: () => { setSelected(null); setDraft(null); setView("list"); } });
  };

  const openNew = () => {
    const d = newDataset();
    const temp: ChartDataset = { ...d, id: `tmp-${Date.now()}`, createdAt: "", updatedAt: "" } as any;
    setSelected(temp); setDraft(d); setView("edit");
  };

  const createFromCsvPreview = async () => {
    if (!csvPreview) {
      alert("No CSV data available");
      return;
    }

    if (!csvPreview.suggestedChart) {
      alert("No chart data. Please check your CSV format.");
      return;
    }

    try {
      const chart = csvPreview.suggestedChart;
      
      // Make sure we have data
      if (!chart.rows || chart.rows.length === 0) {
        alert("Chart has no data rows");
        return;
      }

      // Use filename as dataset title (without extension)
      const fileName = importFileNameRef.current || 'CSV Import';
      const datasetTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

      const dataset: ChartDataset = {
        id: `csv-${Date.now()}`,
        title: datasetTitle, // Name from CSV filename
        description: `Imported from ${fileName} (${csvPreview.tableData.length} rows)`,
        category: "Macro Foundations",
        chartType: chart.chartType || "line",
        color: chart.color || "#1a3a5c",
        unit: chart.unit || "",
        unitType: chart.unitType || "number",
        chartTitle: datasetTitle, // Match title
        xAxisLabel: chart.columns?.[0] || "X",
        yAxisLabel: chart.columns?.[1] || "Y",
        subtitle: "",
        columns: chart.columns || [],
        columnNames: { 
          en: chart.columns || [], 
          id: chart.columns || [] 
        },
        rows: chart.rows || [], // REAL data from CSV
        colors: chart.colors || ["#1a3a5c"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("=== CREATING DATASET ===");
      console.log("Title (from filename):", datasetTitle);
      console.log("Rows count:", dataset.rows.length);
      console.log("Sample row:", dataset.rows[0]);
      console.log("Full dataset:", dataset);
      
      const created = await createMut.mutateAsync(dataset as any);
      
      console.log("Dataset created successfully:", created);
      
      setShowCsvPreview(false);
      setCsvPreview(null);
      alert(`Dataset "${datasetTitle}" created successfully with ${dataset.rows.length} rows!`);
    } catch (err: any) {
      console.error("Error creating dataset:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Unknown error";
      alert("Failed to create dataset: " + errorMsg);
    }
  };

  const closeCsvPreview = () => {
    setShowCsvPreview(false);
    setCsvPreview(null);
    setSelectedChartType("line");
  };

  const handleChartTypeChange = (newType: "line" | "bar" | "area") => {
    setSelectedChartType(newType);
    if (csvPreview?.suggestedChart) {
      setCsvPreview({
        ...csvPreview,
        suggestedChart: {
          ...csvPreview.suggestedChart,
          chartType: newType
        }
      });
    }
  };

  const toggleTranspose = () => {
    if (!csvPreview) return;
    
    const oldHeaders = csvPreview.headers;
    const oldTableData = csvPreview.tableData;
    
    // Extract actual row arrays from tableData using headers
    const oldRows = oldTableData.map(obj => oldHeaders.map(h => obj[h]));
    
    // Matrix Transpose logic
    // New X-axis labels come from original headings (excluding the first label column)
    // New Series labels come from original first column
    const newHeaders = [oldHeaders[0], ...oldRows.map(r => r[0])];
    const newRowsAsArrays = oldHeaders.slice(1).map((h, colIdx) => {
      const idx = colIdx + 1; // offset because we skip first column in slice
      return [h, ...oldRows.map(r => r[idx])];
    });

    const newTableData = newRowsAsArrays.map(row => {
      const obj: Record<string, string> = {};
      newHeaders.forEach((nh, i) => { obj[nh] = row[i] ?? ''; });
      return obj;
    });

    const numericCols: string[] = [];
    const labelCols: string[] = [];
    newHeaders.forEach((nh, idx) => {
      const vals = newRowsAsArrays.map(r => r[idx]);
      (isNumericColumn(vals) ? numericCols : labelCols).push(nh);
    });

    const primaryCol = labelCols[0] ?? newHeaders[0];
    const valueCols = (numericCols.length > 0 ? numericCols : newHeaders).filter(c => c !== primaryCol);
    const pIdx = newHeaders.indexOf(primaryCol);

    const chartData = newRowsAsArrays.map(row => {
      const item: Record<string, string | number> = { [primaryCol]: row[pIdx] ?? '' };
      valueCols.forEach(col => {
        item[col] = parseNumericCell(row[newHeaders.indexOf(col)] ?? '');
      });
      return item;
    });

    setCsvPreview({
      ...csvPreview,
      headers: newHeaders,
      rows: newRowsAsArrays,
      tableData: newTableData,
      suggestedChart: {
        ...csvPreview.suggestedChart,
        columns: [primaryCol, ...valueCols],
        rows: chartData,
        colors: valueCols.map((_: string, i: number) => CHART_PALETTE[i % CHART_PALETTE.length]),
      }
    });
  };

  const openEdit = (ds: ChartDataset) => {
    setSelected(ds); setDraft(null); setView("edit");
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      {/* CSV Preview Modal */}
      {showCsvPreview && csvPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Smart CSV Preview</h3>
                {csvPreview.detectedFormat && (
                  <p className="text-xs text-gray-400 mt-0.5">{csvPreview.detectedFormat}</p>
                )}
              </div>
              <button onClick={closeCsvPreview} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Table Preview */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Table Preview ({csvPreview.tableData.length} rows)
                </h4>
                <div className="border border-gray-300 overflow-hidden rounded">
                  <div className="overflow-auto max-h-72">
                    <table className="text-xs border-collapse" style={{ minWidth: '100%', tableLayout: 'auto' }}>
                      <thead>
                        <tr>
                          {csvPreview.headers.map((h, i) => (
                            <th key={i} style={{ position: 'sticky', top: 0, zIndex: 1 }}
                              className="bg-gray-100 border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                              {h || <span className="text-gray-400 italic">col_{i + 1}</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.tableData.slice(0, 100).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {csvPreview.headers.map((h, j) => (
                              <td key={j} className="border border-gray-200 px-3 py-1.5 text-gray-800 whitespace-nowrap">
                                {row[h] !== undefined && row[h] !== '' ? row[h] : <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Chart Preview */}
              {csvPreview.suggestedChart && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-900">Chart Preview</h4>
                    
                    {/* Chart Type Selector */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChartTypeChange('line')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          selectedChartType === 'line'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Line
                      </button>
                      <button
                        onClick={() => handleChartTypeChange('area')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          selectedChartType === 'area'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Area
                      </button>
                      <button
                        onClick={() => handleChartTypeChange('bar')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          selectedChartType === 'bar'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Bar
                      </button>
                      
                      <div className="w-px h-6 bg-gray-200 mx-1" />
                      
                      <button
                        onClick={toggleTranspose}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors"
                        title="Swap X-axis and Series (Transpose)"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Swap Axes (Transpose)
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <InteractiveChart
                      dataset={csvPreview.suggestedChart}
                      height={300}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeCsvPreview}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createFromCsvPreview}
                  disabled={createMut.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-800 border border-transparent rounded-md hover:bg-blue-900 disabled:opacity-50 flex items-center gap-2"
                >
                  {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Dataset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "list" ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[20px] font-semibold text-gray-900">Data Datasets</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {isLoading ? "Loading…" : `${datasets.length} datasets — served from API`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} disabled={resetMut.isPending}
                className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                {resetMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Reset to Seed
              </button>
              <input type="file" accept=".json,.csv,.pdf" className="hidden" ref={fileInputRef} onChange={handleBulkUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={bulkCreateMut.isPending}
                className="flex items-center gap-1 text-[12px] font-medium border border-[#E5E7EB] bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
                {bulkCreateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Smart Upload (CSV Auto-Detect)
              </button>
              <button onClick={openNew}
                className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700">
                <Plus className="w-4 h-4" /> New Dataset
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-[13.5px]">Fetching from API…</span>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB]">
              <div className="grid grid-cols-12 border-b border-[#E5E7EB] bg-gray-50 px-4 py-2.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Title</div>
                <div className="col-span-2">Category / Sub</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Rows</div>
                <div className="col-span-2">Actions</div>
              </div>
              {datasets.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-[14px]">No datasets found.</p>
                </div>
              ) : datasets.map((ds) => (
                <div key={ds.id} className="grid grid-cols-12 border-b border-[#F3F4F6] px-4 py-3.5 items-center hover:bg-gray-50">
                  <div className="col-span-4">
                    <div className="text-[13.5px] font-semibold text-gray-900">{ds.title}</div>
                    <div className="text-[11.5px] text-gray-400 mt-0.5">{ds.description?.slice(0, 55)}{ds.description?.length > 55 ? "…" : ""}</div>
                  </div>
                  <div className="col-span-2 text-[12.5px] text-gray-600">
                    {ds.category}
                    {ds.subcategory && <div className="text-[10px] text-gray-400 font-medium">↳ {ds.subcategory}</div>}
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11.5px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 capitalize">{ds.chartType}</span>
                  </div>
                  <div className="col-span-2 text-[12.5px] text-gray-600">{ds.rows.length} rows</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button onClick={() => openEdit(ds)} className="text-[12px] font-medium text-gray-900 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(ds.id)} disabled={deleteMut.isPending} className="text-gray-400 hover:text-red-500 disabled:opacity-40">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 bg-gray-50 border border-gray-200 p-4">
            <p className="text-[12px] text-gray-600 leading-relaxed">
              All data is served via the <strong>REST API</strong> backed by an in-memory store.
              Click "Reset to Seed" to restore original datasets.
              In production, replace the store with PostgreSQL + Drizzle ORM.
            </p>
          </div>
        </div>
      ) : (
        <DatasetEditor
          selected={selected} draft={draft} setDraft={setDraft}
          onBack={() => { setSelected(null); setDraft(null); setView("list"); }}
          onSave={handleSave}
          isSaving={isSaving}
          isSuccess={updateMut.isSuccess || createMut.isSuccess}
          lastSaved={lastSaved}
          isAutoSaving={isAutoSaving}
        />
      )}
    </div>
  );
}

// ─── Pages Tab ─────────────────────────────────────────────────────────────────

function PagesTab() {
  const [localeFilter, setLocaleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);
  const [newPageLocale, setNewPageLocale] = useState<"en" | "id">("en");
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const filter: any = {};
  if (localeFilter !== "all") filter.locale = localeFilter;
  if (statusFilter !== "all") filter.status = statusFilter;

  const { data: pages = [], isLoading } = usePages(filter);
  const deleteMut = useDeletePage();
  const resetMut = useResetPages();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete page "${title}"?`)) return;
    deleteMut.mutate(id, { onSuccess: () => {
      if (expandedId === id) setExpandedId(null);
      setDeleteSuccess(`"${title}" deleted`);
      setTimeout(() => setDeleteSuccess(null), 4000);
    } });
  };

  const openNew = (locale: "en" | "id") => {
    setNewPageLocale(locale);
    setEditPage(null as any);
    setIsNewPage(true);
  };

  const openEdit = (page: Page) => {
    setEditPage(page);
    setIsNewPage(false);
    setExpandedId(null);
  };

  // Group pages by slug to show EN↔ID pairs
  const grouped = pages.reduce<Record<string, Page[]>>((acc, p) => {
    const key = p.slug;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  if (editPage !== null || isNewPage) {
    return (
      <div>
        <PageEditor
          page={isNewPage ? null : editPage}
          onBack={() => { setEditPage(null); setIsNewPage(false); }}
          isNew={isNewPage}
          defaultLocaleForNew={newPageLocale}
        />
      </div>
    );
  }

  return (
    <div>
      {deleteSuccess && (
        <div className="mb-4 bg-gray-50 border border-gray-200 p-3 flex items-center justify-between">
          <span className="text-[12.5px] text-gray-700">
            <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
            {deleteSuccess}
          </span>
          <a href="/admin" className="text-[12px] text-gray-900 underline">Refresh list</a>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-semibold text-gray-900">Pages</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {isLoading ? "Loading…" : `${pages.length} page versions across ${Object.keys(grouped).length} pages`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => resetMut.mutate(undefined)} disabled={resetMut.isPending}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
            {resetMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Reset
          </button>
          <button onClick={() => openNew("en")}
            className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700">
            <Plus className="w-4 h-4" /> New Page (EN)
          </button>
          <button onClick={() => openNew("id")}
            className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-700 px-4 py-2 hover:bg-gray-800">
            <Plus className="w-4 h-4" /> New Page (ID)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11.5px] text-gray-500 font-medium">Filter:</span>
        {[["all", "All"], ["en", "English"], ["id", "Indonesia"]].map(([v, label]) => (
          <button key={v} onClick={() => setLocaleFilter(v)}
            className={`px-3 py-1 text-[12px] font-medium border ${
              localeFilter === v ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>{label}</button>
        ))}
        <div className="h-4 w-px bg-gray-200 mx-1" />
        {[["all", "All"], ["published", "Published"], ["draft", "Draft"]].map(([v, label]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-3 py-1 text-[12px] font-medium border ${
              statusFilter === v ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>{label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-[13.5px]">Loading…</span>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB]">
          {/* Table header */}
          <div className="grid grid-cols-12 border-b border-[#E5E7EB] bg-gray-50 px-4 py-2.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-1" />
            <div className="col-span-3">Title</div>
            <div className="col-span-3">Slug</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">No pages found for this filter.</p>
            </div>
          ) : Object.entries(grouped).map(([slug, pgList]) => {
            const enPage = pgList.find((p) => p.locale === "en");
            const idPage = pgList.find((p) => p.locale === "id");
            const anyPage = pgList[0];
            const isExpanded = expandedId === anyPage.id;

            return (
              <div key={slug}>
                {/* Group header / first row */}
                <div className="grid grid-cols-12 border-b border-[#F3F4F6] px-4 py-3 items-center hover:bg-gray-50">
                  <div className="col-span-1">
                    <button onClick={() => setExpandedId(isExpanded ? null : anyPage.id)}
                      className="text-gray-400 hover:text-gray-700">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      {enPage && <LocaleBadge locale="en" />}
                      {idPage && <LocaleBadge locale="id" />}
                      <span className="text-[13.5px] font-semibold text-gray-900 truncate">{anyPage.title}</span>
                    </div>
                    {enPage && idPage && (
                      <p className="text-[10.5px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Linked (EN + ID)
                      </p>
                    )}
                  </div>
                  <div className="col-span-3 text-[12px] text-gray-500 font-mono truncate">{slug}</div>
                  <div className="col-span-2 flex items-center gap-1">
                    {enPage && <LocaleBadge locale="en" />}
                    {idPage && <><span className="text-gray-300">·</span><LocaleBadge locale="id" /></>}
                  </div>
                  <div className="col-span-1">
                    <StatusBadge status={anyPage.status} />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button onClick={() => openEdit(anyPage)} className="text-[12px] font-medium text-gray-900 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(anyPage.id, anyPage.title)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded: show both EN and ID rows */}
                {isExpanded && pgList.map((p) => (
                  <div key={p.id} className="grid grid-cols-12 border-b border-[#F3F4F6] px-4 py-2.5 bg-gray-50/50 items-center">
                    <div className="col-span-1" />
                    <div className="col-span-3 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <LocaleBadge locale={p.locale} />
                        <span className="text-[12.5px] font-semibold text-gray-700">{p.title}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">{p.navLabel ? `Nav: "${p.navLabel}"` : `Section: ${p.section}`}</div>
                    </div>
                    <div className="col-span-3 text-[12px] text-gray-400 font-mono pl-4">{p.slug}</div>
                    <div className="col-span-2"><LocaleBadge locale={p.locale} /></div>
                    <div className="col-span-1"><StatusBadge status={p.status} /></div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-[12px] font-medium text-gray-900 hover:underline">Edit</button>
                      {p.linkedIdRecord && (
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> linked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Blog Tab ──────────────────────────────────────────────────────────────────

function BlogTab() {
  const [localeFilter, setLocaleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const [newPostLocale, setNewPostLocale] = useState<"en" | "id">("en");
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const filter: any = {};
  if (localeFilter !== "all") filter.locale = localeFilter;
  if (statusFilter !== "all") filter.status = statusFilter;
  if (categoryFilter !== "all") filter.category = categoryFilter;

  const { data: posts = [], isLoading } = usePosts(filter);
  const deleteMut = useDeletePost();
  const resetMut = useResetPosts();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete post "${title}"?`)) return;
    deleteMut.mutate(id, { onSuccess: () => {
      if (expandedId === id) setExpandedId(null);
      setDeleteSuccess(`"${title}" deleted`);
      setTimeout(() => setDeleteSuccess(null), 4000);
    } });
  };

  if (editPost !== null || isNewPost) {
    return (
      <div>
        <PostEditor
          post={isNewPost ? null : editPost}
          onBack={() => { setEditPost(null); setIsNewPost(false); }}
          isNew={isNewPost}
          defaultLocaleForNew={newPostLocale}
        />
      </div>
    );
  }

  // Group by slug to show EN↔ID pairs
  const grouped = posts.reduce<Record<string, BlogPost[]>>((acc, p) => {
    const key = p.slug;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div>
      {deleteSuccess && (
        <div className="mb-4 bg-gray-50 border border-gray-200 p-3 flex items-center justify-between">
          <span className="text-[12.5px] text-gray-700">
            <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
            {deleteSuccess}
          </span>
          <a href="/admin" className="text-[12px] text-gray-900 underline">Refresh list</a>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-semibold text-gray-900">Blog Posts</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {isLoading ? "Loading…" : `${posts.length} post versions across ${Object.keys(grouped).length} posts`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => resetMut.mutate(undefined)} disabled={resetMut.isPending}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
            {resetMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Reset
          </button>
          <button type="button" onClick={() => { setNewPostLocale("en"); setEditPost(null as any); setIsNewPost(true); }}
            className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700">
            <Plus className="w-4 h-4" /> New Post (EN)
          </button>
          <button type="button" onClick={() => { setNewPostLocale("id"); setEditPost(null as any); setIsNewPost(true); }}
            className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-700 px-4 py-2 hover:bg-gray-800">
            <Plus className="w-4 h-4" /> New Post (ID)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-[11.5px] text-gray-500 font-medium">Language:</span>
        {[["all", "All"], ["en", "English"], ["id", "Indonesia"]].map(([v, label]) => (
          <button key={v} onClick={() => setLocaleFilter(v)}
            className={`px-3 py-1 text-[12px] font-medium border ${
              localeFilter === v ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>{label}</button>
        ))}
        <div className="h-4 w-px bg-gray-200 mx-1" />
        <span className="text-[11.5px] text-gray-500 font-medium">Status:</span>
        {[["all", "All"], ["published", "Published"], ["draft", "Draft"]].map(([v, label]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-3 py-1 text-[12px] font-medium border ${
              statusFilter === v ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>{label}</button>
        ))}
        <div className="h-4 w-px bg-gray-200 mx-1" />
        <span className="text-[11.5px] text-gray-500 font-medium">Category:</span>
        {[["all", "All"], ...BLOG_CATEGORIES.map((c) => [c, c] as [string, string])].map(([v, label]) => (
          <button key={v} onClick={() => setCategoryFilter(v)}
            className={`px-3 py-1 text-[12px] font-medium border ${
              categoryFilter === v ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}>{label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-[13.5px]">Loading…</span>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB]">
          <div className="grid grid-cols-12 border-b border-[#E5E7EB] bg-gray-50 px-4 py-2.5 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-1" />
            <div className="col-span-3">Title</div>
            <div className="col-span-2">Category / Sub</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Tag</div>
            <div className="col-span-2">Actions</div>
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">No posts found for this filter.</p>
            </div>
          ) : Object.entries(grouped).map(([slug, postList]) => {
            const anyPost = postList[0];
            const isExpanded = expandedId === anyPost.id;

            return (
              <div key={slug}>
                <div className="grid grid-cols-12 border-b border-[#F3F4F6] px-4 py-3 items-center hover:bg-gray-50">
                  <div className="col-span-1">
                    <button onClick={() => setExpandedId(isExpanded ? null : anyPost.id)}
                      className="text-gray-400 hover:text-gray-700">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      {postList.find((p) => p.locale === "en") && <LocaleBadge locale="en" />}
                      {postList.find((p) => p.locale === "id") && <><span className="text-gray-300">·</span><LocaleBadge locale="id" /></>}
                      <span className="text-[13.5px] font-semibold text-gray-900 truncate">{anyPost.title}</span>
                    </div>
                    {postList.length > 1 && (
                      <p className="text-[10.5px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Linked (EN + ID)
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 text-[12px] text-gray-600">
                    {anyPost.category}
                    {anyPost.subcategory && <div className="text-[10px] text-gray-400 font-medium">↳ {anyPost.subcategory}</div>}
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    {postList.find((p) => p.locale === "en") && <LocaleBadge locale="en" />}
                    {postList.length > 1 && <><span className="text-gray-300">·</span><LocaleBadge locale="id" /></>}
                  </div>
                  <div className="col-span-1"><StatusBadge status={anyPost.status} /></div>
                  <div className="col-span-1 text-[12px] text-gray-400">{anyPost.tag}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button onClick={() => { setEditPost(anyPost); setIsNewPost(false); setExpandedId(null); }}
                      className="text-[12px] font-medium text-gray-900 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(anyPost.id, anyPost.title)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && postList.map((p) => (
                  <div key={p.id} className="grid grid-cols-12 border-b border-[#F3F4F6] px-4 py-2.5 bg-gray-50/50 items-center">
                    <div className="col-span-1" />
                    <div className="col-span-3 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <LocaleBadge locale={p.locale} />
                        <span className="text-[12.5px] font-semibold text-gray-700">{p.title}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 line-clamp-1">{p.excerpt}</div>
                    </div>
                    <div className="col-span-2 text-[12px] text-gray-600 pl-4">
                      {p.category}
                      {p.subcategory && <div className="text-[10px] text-gray-400 font-medium">↳ {p.subcategory}</div>}
                    </div>
                    <div className="col-span-2"><LocaleBadge locale={p.locale} /></div>
                    <div className="col-span-1"><StatusBadge status={p.status} /></div>
                    <div className="col-span-1 text-[12px] text-gray-400">{p.tag}</div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button onClick={() => { setEditPost(p); setIsNewPost(false); }}
                        className="text-[12px] font-medium text-gray-900 hover:underline">Edit</button>
                      <a 
                        href={`/article/${p.slug.replace(/^\//, "")}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[12px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                      {p.linkedIdRecord && <span className="text-[11px] text-gray-400 flex items-center gap-1"><Link2 className="w-3 h-3" /> linked</span>}
                    </div>

                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Analisis Deskriptif Tab ────────────────────────────────────────────────────

const WIDGET_TYPES: { value: AnalysisWidgetType; label: string; icon: React.ReactNode }[] = [
  { value: "metric-card", label: "Metric Card", icon: <Target className="w-3.5 h-3.5" /> },
  { value: "distribution", label: "Distribution", icon: <PieChart className="w-3.5 h-3.5" /> },
  { value: "comparison", label: "Comparison Table", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { value: "highlight", label: "Highlight / Callout", icon: <Zap className="w-3.5 h-3.5" /> },
  { value: "bar-chart", label: "Bar Chart", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { value: "donut-chart", label: "Donut Chart", icon: <PieChart className="w-3.5 h-3.5" /> },
  { value: "custom-text", label: "Custom Text", icon: <Type className="w-3.5 h-3.5" /> },
];

const SECTION_TYPES = [
  { value: "overview", label: "Overview / Summary" },
  { value: "dataset-breakdown", label: "Dataset Breakdown" },
  { value: "blog-insights", label: "Blog Insights" },
  { value: "custom", label: "Custom Analysis" },
];

function newMetric(): AnalysisMetric {
  return {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    label: "New Metric",
    value: "0",
    trend: "neutral",
    trendValue: "",
    note: "",
  };
}

function newWidget(type: AnalysisWidgetType): AnalysisWidget {
  const id = `w-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const base: AnalysisWidget = { id, type, title: "" };
  if (type === "metric-card") return { ...base, metrics: [newMetric()] };
  if (type === "distribution") return { ...base, distributionItems: [] };
  if (type === "comparison") return { ...base, compareHeaders: ["Item", "Value 1", "Value 2"], compareItems: [] };
  if (type === "highlight") return { ...base, calloutColor: "#1a3a5c", text: "" };
  if (type === "bar-chart") return { ...base, barData: [] };
  if (type === "donut-chart") return { ...base, barData: [] };
  if (type === "custom-text") return { ...base, text: "" };
  return base;
}

function newSection(order: number): AnalysisSection {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    title: "New Section",
    titleEn: "",
    description: "",
    descriptionEn: "",
    locale: "both",
    sectionType: "custom",
    order,
    sectionBg: undefined,
    widgets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function WidgetEditor({
  widget, onChange,
}: {
  widget: AnalysisWidget;
  onChange: (w: AnalysisWidget) => void;
}) {
  const patch = (fields: Partial<AnalysisWidget>) => onChange({ ...widget, ...fields });

  const addMetric = () => patch({ metrics: [...(widget.metrics ?? []), newMetric()] });
  const removeMetric = (mid: string) => patch({ metrics: widget.metrics?.filter((m) => m.id !== mid) });
  const updateMetric = (mid: string, fields: Partial<AnalysisMetric>) =>
    patch({ metrics: widget.metrics?.map((m) => (m.id === mid ? { ...m, ...fields } : m)) });

  const addDistItem = () =>
    patch({ distributionItems: [...(widget.distributionItems ?? []), { label: "New Item", value: 0, percentage: 0, color: "#1a3a5c" }] });
  const removeDistItem = (idx: number) =>
    patch({ distributionItems: widget.distributionItems?.filter((_, i) => i !== idx) });
  type DistItem = { label: string; value: number; percentage: number; color?: string };
  type CompareItem = { label: string; values: string[] };
  type BarItem = { label: string; value: number; color?: string };
  const updateDistItem = (idx: number, fields: Partial<DistItem>) =>
    patch({ distributionItems: widget.distributionItems?.map((d, i) => (i === idx ? { ...d, ...fields } : d)) });

  const addCompareRow = () =>
    patch({ compareItems: [...(widget.compareItems ?? []), { label: "New Row", values: ["", ""] }] });
  const removeCompareRow = (idx: number) =>
    patch({ compareItems: widget.compareItems?.filter((_, i) => i !== idx) });
  const updateCompareRow = (idx: number, fields: Partial<CompareItem>) =>
    patch({ compareItems: widget.compareItems?.map((c, i) => (i === idx ? { ...c, ...fields } : c)) });

  const addBarItem = () =>
    patch({ barData: [...(widget.barData ?? []), { label: "Item", value: 0, color: "#1a3a5c" }] });
  const removeBarItem = (idx: number) =>
    patch({ barData: widget.barData?.filter((_, i) => i !== idx) });
  const updateBarItem = (idx: number, fields: Partial<BarItem>) =>
    patch({ barData: widget.barData?.map((b, i) => (i === idx ? { ...b, ...fields } : b)) });

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
      {/* Common fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Widget Title</label>
          <input
            type="text"
            value={widget.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full border border-gray-300 px-3 py-1.5 text-[13px] focus:outline-none focus:border-gray-900"
            placeholder="Optional title"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Subtitle</label>
          <input
            type="text"
            value={widget.subtitle ?? ""}
            onChange={(e) => patch({ subtitle: e.target.value })}
            className="w-full border border-gray-300 px-3 py-1.5 text-[13px] focus:outline-none focus:border-gray-900"
            placeholder="Optional subtitle"
          />
        </div>
      </div>

      {/* Metric Card Editor */}
      {widget.type === "metric-card" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-gray-700">Metrics</span>
            <button onClick={addMetric} className="text-[11px] text-gray-900 font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Metric
            </button>
          </div>
          {(widget.metrics ?? []).map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded p-3 grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3">
                <label className="block text-[10px] text-gray-500 mb-1">Label</label>
                <input value={m.label} onChange={(e) => updateMetric(m.id, { label: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1">Value</label>
                <input value={m.value} onChange={(e) => updateMetric(m.id, { value: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1">Unit</label>
                <input value={m.unit ?? ""} onChange={(e) => updateMetric(m.id, { unit: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1">Trend</label>
                <select value={m.trend ?? "neutral"} onChange={(e) => updateMetric(m.id, { trend: e.target.value as "up" | "down" | "neutral" })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] bg-white focus:outline-none focus:border-gray-900">
                  <option value="up">↑ Up</option>
                  <option value="down">↓ Down</option>
                  <option value="neutral">→ Neutral</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1">Trend Value</label>
                <input value={m.trendValue ?? ""} onChange={(e) => updateMetric(m.id, { trendValue: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" placeholder="+2.3%" />
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => removeMetric(m.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="col-span-12">
                <label className="block text-[10px] text-gray-500 mb-1">Note</label>
                <input value={m.note ?? ""} onChange={(e) => updateMetric(m.id, { note: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" placeholder="Optional note" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Distribution Editor */}
      {widget.type === "distribution" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-gray-700">Distribution Items</span>
            <button onClick={addDistItem} className="text-[11px] text-gray-900 font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          {(widget.distributionItems ?? []).map((d, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded p-3 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1">
                <input type="color" value={d.color ?? "#1a3a5c"} onChange={(e) => updateDistItem(i, { color: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
              </div>
              <div className="col-span-4">
                <input value={d.label} onChange={(e) => updateDistItem(i, { label: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" />
              </div>
              <div className="col-span-2">
                <input type="number" value={d.value} onChange={(e) => updateDistItem(i, { value: Number(e.target.value) })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-1">
                  <input type="number" value={d.percentage} onChange={(e) => updateDistItem(i, { percentage: Number(e.target.value) })}
                    className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" />
                  <span className="text-[12px] text-gray-400">%</span>
                </div>
              </div>
              <div className="col-span-2 flex justify-end">
                <button onClick={() => removeDistItem(i)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Table Editor */}
      {widget.type === "comparison" && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Column Headers (comma-separated)</label>
            <input value={(widget.compareHeaders ?? []).join(", ")}
              onChange={(e) => patch({ compareHeaders: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              className="w-full border border-gray-300 px-3 py-1.5 text-[12px] focus:outline-none focus:border-gray-900"
              placeholder="Item, Value 1, Value 2, Mitigation" />
          </div>
          <div className="flex justify-end">
            <button onClick={addCompareRow} className="text-[11px] text-gray-900 font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>
          {(widget.compareItems ?? []).map((c, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded p-3 flex gap-2 items-center">
              <div className="flex-1">
                <input value={c.label} onChange={(e) => updateCompareRow(i, { label: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" placeholder="Row label" />
              </div>
              {c.values.map((v, vi) => (
                <div key={vi} className="flex-1">
                  <input value={v} onChange={(e) => {
                    const newVals = [...c.values];
                    newVals[vi] = e.target.value;
                    updateCompareRow(i, { values: newVals });
                  }}
                    className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" placeholder={`Value ${vi + 1}`} />
                </div>
              ))}
              <button onClick={() => removeCompareRow(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Highlight / Callout Editor */}
      {widget.type === "highlight" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Callout Color</label>
              <input type="color" value={widget.calloutColor ?? "#1a3a5c"}
                onChange={(e) => patch({ calloutColor: e.target.value })}
                className="w-16 h-9 rounded border border-gray-300 cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Callout Text (supports markdown-style bold **text**)</label>
            <textarea rows={4} value={widget.text ?? ""}
              onChange={(e) => patch({ text: e.target.value })}
              className="w-full border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-900 resize-y"
              placeholder="Enter key insight text..." />
          </div>
        </div>
      )}

      {/* Bar Chart / Donut Chart Editor */}
      {(widget.type === "bar-chart" || widget.type === "donut-chart") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-gray-700">Data Items</span>
            <button onClick={addBarItem} className="text-[11px] text-gray-900 font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          {(widget.barData ?? []).map((b, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded p-3 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1">
                <input type="color" value={b.color ?? "#1a3a5c"} onChange={(e) => updateBarItem(i, { color: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
              </div>
              <div className="col-span-6">
                <input value={b.label} onChange={(e) => updateBarItem(i, { label: e.target.value })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" placeholder="Label" />
              </div>
              <div className="col-span-4">
                <input type="number" value={b.value} onChange={(e) => updateBarItem(i, { value: Number(e.target.value) })}
                  className="w-full border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-gray-900" placeholder="Value" />
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => removeBarItem(i)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Text Editor */}
      {widget.type === "custom-text" && (
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Custom HTML / Text Content</label>
          <textarea rows={4} value={widget.text ?? ""}
            onChange={(e) => patch({ text: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:border-gray-900 resize-y font-mono"
            placeholder="Enter custom text or HTML..." />
        </div>
      )}
    </div>
  );
}

function SectionEditor({
  section, onChange, onRemove,
}: {
  section: AnalysisSection;
  onChange: (s: AnalysisSection) => void;
  onRemove: () => void;
}) {
  const [activeWidget, setActiveWidget] = useState<string | null>(null);

  const patch = (fields: Partial<AnalysisSection>) => onChange({ ...section, ...fields });

  const addWidget = (type: AnalysisWidgetType) => {
    const w = newWidget(type);
    patch({ widgets: [...section.widgets, w] });
    setActiveWidget(w.id);
  };

  const updateWidget = (wid: string, w: AnalysisWidget) =>
    patch({ widgets: section.widgets.map((widget) => (widget.id === wid ? w : widget)) });

  const removeWidget = (wid: string) => {
    patch({ widgets: section.widgets.filter((w) => w.id !== wid) });
    if (activeWidget === wid) setActiveWidget(null);
  };

  const moveWidget = (idx: number, dir: -1 | 1) => {
    const newWidgets = [...section.widgets];
    const target = idx + dir;
    if (target < 0 || target >= newWidgets.length) return;
    [newWidgets[idx], newWidgets[target]] = [newWidgets[target], newWidgets[idx]];
    patch({ widgets: newWidgets });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Section Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <input
            value={section.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="text-[14px] font-semibold text-gray-900 bg-transparent focus:outline-none focus:border-b focus:border-gray-900"
            placeholder="Section Title (EN)"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={section.sectionType}
            onChange={(e) => patch({ sectionType: e.target.value as AnalysisSection["sectionType"] })}
            className="border border-gray-300 px-2 py-1 text-[11px] bg-white focus:outline-none"
          >
            {SECTION_TYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={section.order}
            min={1}
            onChange={(e) => patch({ order: Number(e.target.value) })}
            className="w-14 border border-gray-300 px-2 py-1 text-[12px] text-center focus:outline-none"
            title="Display order"
          />
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-2 border-b border-gray-100">
        <input
          value={section.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          className="w-full text-[12px] text-gray-600 bg-transparent focus:outline-none border-b border-transparent focus:border-gray-300"
          placeholder="Description (optional)"
        />
      </div>

      {/* Section Background Image */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <span className="text-[10px] text-gray-400 font-medium">BG:</span>
        <input
          value={section.sectionBg ?? ""}
          onChange={(e) => patch({ sectionBg: e.target.value })}
          className="flex-1 text-[11.5px] text-gray-500 bg-transparent focus:outline-none border border-gray-200 px-2 py-1 rounded"
          placeholder="/gambar.png (optional)"
        />
        {section.sectionBg && (
          <button onClick={() => patch({ sectionBg: "" })} className="text-gray-400 hover:text-red-500 text-[10px]">✕</button>
        )}
      </div>

      {/* Widgets List */}
      <div className="divide-y divide-gray-100">
        {section.widgets.map((w, idx) => (
          <div key={w.id}>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/50">
              <button onClick={() => moveWidget(idx, -1)} className="text-gray-400 hover:text-gray-600" title="Move up">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => moveWidget(idx, 1)} className="text-gray-400 hover:text-gray-600" title="Move down">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-gray-400">
                {w.type}
              </span>
              {w.title && <span className="text-[12px] text-gray-700 font-medium">{w.title}</span>}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setActiveWidget(activeWidget === w.id ? null : w.id)}
                  className="text-[11px] text-gray-900 font-medium hover:underline"
                >
                  {activeWidget === w.id ? "Collapse" : "Edit"}
                </button>
                <button onClick={() => removeWidget(w.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {activeWidget === w.id && (
              <div className="px-4 py-3">
                <WidgetEditor widget={w} onChange={(updated) => updateWidget(w.id, updated)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Widget */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {WIDGET_TYPES.map((wt) => (
            <button
              key={wt.value}
              onClick={() => addWidget(wt.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium border border-gray-300 bg-white hover:border-gray-900 hover:text-gray-900 rounded"
            >
              {wt.icon} Add {wt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalisisEditor({
  record, onBack, onSave, isNew,
}: {
  record: AnalisisDeskriptif | null;
  onBack: () => void;
  onSave: (data: Partial<AnalisisDeskriptif>) => void;
  isNew?: boolean;
}) {
  const [draft, setDraft] = useState<Partial<AnalisisDeskriptif>>(() =>
    record ? { ...record } : {
      title: "New Analysis",
      titleEn: "",
      description: "",
      descriptionEn: "",
      locale: "both",
      status: "active",
      sections: [],
    }
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) setDraft({ ...record });
    else setDraft({
      title: "New Analysis",
      titleEn: "",
      description: "",
      descriptionEn: "",
      locale: "both",
      status: "active",
      sections: [],
    });
  }, [record?.id]);

  const patch = (fields: Partial<AnalisisDeskriptif>) => setDraft((prev) => ({ ...prev, ...fields }));

  const addSection = () => {
    const currentSections = draft.sections ?? [];
    patch({ sections: [...currentSections, newSection(currentSections.length + 1)] });
  };

  const updateSection = (id: string, s: AnalysisSection) => {
    const updated = (draft.sections ?? []).map((section) => (section.id === id ? s : section));
    patch({ sections: updated });
  };

  const removeSection = (id: string) => {
    patch({ sections: (draft.sections ?? []).filter((s) => s.id !== id) });
  };

  const handleSave = () => {
    if (!draft.title?.trim()) {
      setSaveError("Title is required.");
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    onSave(draft);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
    }, 500);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 font-medium">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-gray-300">·</span>
        <span className="text-[13px] font-medium text-gray-700">
          {isNew ? "New Analysis" : (draft.title ?? record?.title ?? "Edit")}
        </span>
        {draft.status && (
          <span className="text-[10px] text-gray-400">
            {draft.status.toUpperCase()}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Identity */}
        <div className="bg-white border border-[#E5E7EB] p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-4 pb-3 border-b border-[#E5E7EB]">
              Analysis Identity
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title (EN)</label>
            <input type="text" value={draft.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title (ID)</label>
            <input type="text" value={draft.titleEn ?? ""}
              onChange={(e) => patch({ titleEn: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea rows={2} value={draft.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
              className="w-full border border-[#E5E7EB] px-3 py-2 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Language Scope</label>
            <div className="flex gap-2">
              {(["both", "en", "id"] as const).map((l) => (
                <button key={l} onClick={() => patch({ locale: l })}
                  className={`px-4 py-2 text-[12px] font-semibold border capitalize ${
                    draft.locale === l ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {l === "both" ? "EN + ID" : l === "en" ? "English Only" : "Indonesian Only"}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
            <div className="flex gap-2">
              {(["active", "archived"] as const).map((s) => (
                <button key={s} onClick={() => patch({ status: s })}
                  className={`px-4 py-2 text-[12px] font-semibold border capitalize ${
                    draft.status === s ? "bg-[#1a3a5c] text-white border-[#1a3a5c]" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900">Sections</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {(draft.sections ?? []).length} section{(draft.sections ?? []).length !== 1 ? "s" : ""} —
                Drag to reorder widgets within each section
              </p>
            </div>
            <button onClick={addSection}
              className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700">
              <Plus className="w-4 h-4" /> Add Section
            </button>
          </div>

          <div className="space-y-6">
            {(draft.sections ?? []).sort((a, b) => a.order - b.order).map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={(s) => updateSection(section.id, s)}
                onRemove={() => removeSection(section.id)}
              />
            ))}
          </div>

          {(draft.sections ?? []).length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
              <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] text-gray-500 mb-3">No sections yet.</p>
              <button onClick={addSection}
                className="text-[13px] font-medium text-gray-900 hover:underline">
                + Add your first section
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        {saveError && (
          <div className="text-[12.5px] text-red-600">
            {saveError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-5 py-2 hover:bg-gray-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving…" : "Save Analysis"}
          </button>
          {saved && (
            <span className="text-[12px] text-gray-500">Saved successfully</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalisisTab() {
  const { data: records = [], isLoading } = useAnalisisList();
  const createMut = useCreateAnalisis();
  const updateMut = useUpdateAnalisis();
  const deleteMut = useDeleteAnalisis();
  const resetMut = useResetAnalisis();

  const [editRecord, setEditRecord] = useState<AnalisisDeskriptif | null>(null);
  const [isNew, setIsNew] = useState(false);

  const handleCreate = () => {
    setEditRecord(null);
    setIsNew(true);
  };

  const handleSave = (data: Partial<AnalisisDeskriptif>) => {
    if (isNew) {
      createMut.mutate(data as Omit<AnalisisDeskriptif, "id" | "createdAt" | "updatedAt">, {
        onSuccess: () => {
          setIsNew(false);
          setEditRecord(null);
        },
        onError: (e: any) => alert("Error saving: " + (e.message || "Unknown error")),
      });
    } else if (editRecord?.id) {
      updateMut.mutate({ id: editRecord.id, data }, {
        onSuccess: () => {
          setEditRecord(null);
        },
        onError: (e: any) => alert("Error updating: " + (e.message || "Unknown error")),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this analysis record? This cannot be undone.")) return;
    deleteMut.mutate(id, { onSuccess: () => {
      if (editRecord?.id === id) {
        setEditRecord(null);
        setIsNew(false);
      }
    }});
  };

  const handleReset = () => {
    if (!confirm("Reset all analysis to seed state? All custom edits will be lost.")) return;
    resetMut.mutate(undefined, { onSuccess: () => setEditRecord(null) });
  };

  if (editRecord !== null || isNew) {
    return (
      <AnalisisEditor
        record={isNew ? null : editRecord}
        isNew={isNew}
        onBack={() => { setEditRecord(null); setIsNew(false); }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-semibold text-gray-900">Analisis Deskriptif</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {isLoading ? "Loading…" : `${records.length} analysis record${records.length !== 1 ? "s" : ""} — customizable descriptive analysis sections`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} disabled={resetMut.isPending}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
            {resetMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Reset to Seed
          </button>
          <button onClick={handleCreate}
            className="flex items-center gap-2 text-[13px] font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700">
            <Plus className="w-4 h-4" /> New Analysis
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-[13.5px]">Loading…</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500 mb-3">No analysis records found.</p>
          <button onClick={handleCreate} className="text-[13px] font-medium text-gray-900 hover:underline">
            + Create your first analysis
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <div key={r.id} className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-gray-900">{r.title}</h3>
                      <span className="text-[10px] text-gray-400">
                        {r.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {r.locale === "both" ? "EN+ID" : r.locale.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500">{r.description || "No description"}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {(r.sections ?? []).length} section{(r.sections ?? []).length !== 1 ? "s" : ""} ·
                      Last updated: {new Date(r.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setEditRecord(r); setIsNew(false); }}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-gray-900 border border-gray-900 px-3 py-1.5 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Preview */}
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex flex-wrap gap-2">
                  {(r.sections ?? []).sort((a, b) => a.order - b.order).map((s) => (
                    <div key={s.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2.5 py-1">
                      <span className="text-[10px] font-bold text-gray-400">#{s.order}</span>
                      <span className="text-[11.5px] font-medium text-gray-700">{s.title || "Untitled"}</span>
                      <span className="text-[10px] text-gray-400">({(s.widgets ?? []).length} widget{(s.widgets ?? []).length !== 1 ? "s" : ""})</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide">
                        {s.sectionType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <p className="text-[12.5px] font-semibold text-gray-500 mb-1">Customizable Descriptive Analysis</p>
        <p className="text-[12px] text-gray-700 leading-relaxed">
          Each analysis record supports multiple sections. Each section can contain multiple widgets:
          <strong> Metric Cards</strong> (KPI with trends), <strong>Distribution Charts</strong> (donut/bar),
          <strong> Comparison Tables</strong>, <strong>Highlight Callouts</strong>, <strong>Bar Charts</strong>,
          and <strong>Custom Text</strong>. Edit widgets inline, reorder with ↑↓ buttons, and preview changes live.
        </p>
      </div>
    </div>
  );
}

// ─── Exchange Rates Tab ────────────────────────────────────────────────────────

const CATEGORIES_ER = ["currency", "index", "commodity", "bond"];

function newExchangeRate(order: number): Omit<ExchangeRate, "id" | "createdAt" | "updatedAt"> {
  return {
    symbol: "NEW/USD",
    label: "NEW/USD",
    labelEn: "NEW/USD",
    labelId: "NEW/USD",
    value: "0.00",
    change: "0.00%",
    changeValue: 0,
    up: null,
    category: "currency",
    order,
    enabled: true,
  };
}

function ExchangeRatesTab() {
  const { data: exchangeRates = [], isLoading } = useExchangeRates();
  const createMutation = useCreateExchangeRate();
  const updateMutation = useUpdateExchangeRate();
  const deleteMutation = useDeleteExchangeRate();
  const resetMutation = useResetExchangeRates();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<ExchangeRate>>>({});
  const [newCount, setNewCount] = useState(0);

  const getDraft = (id: string): Partial<ExchangeRate> => {
    if (id.startsWith("new-")) return drafts[id] ?? {};
    const er = exchangeRates.find((e) => e.id === id);
    return drafts[id] ?? (er ? { ...er } : {});
  };

  const patchDraft = (id: string, fields: Partial<ExchangeRate>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...fields } }));
  };

  const handleSave = async (id: string) => {
    const d = getDraft(id);
    if (id.startsWith("new-")) {
      await createMutation.mutateAsync(d as any);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      await updateMutation.mutateAsync({ id, data: d });
      setEditingId(null);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!id.startsWith("new-")) {
      if (!confirm(`Delete exchange rate "${getDraft(id).symbol}"?`)) return;
      await deleteMutation.mutateAsync(id);
    }
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleAddNew = () => {
    const tempId = `new-${Date.now()}`;
    setDrafts((prev) => ({
      ...prev,
      [tempId]: newExchangeRate(exchangeRates.length + newCount),
    }));
    setNewCount((c) => c + 1);
  };

  const allItems: Array<{ id: string; isNew: boolean }> = [
    ...exchangeRates.map((er) => ({ id: er.id, isNew: false })),
    ...Object.keys(drafts).filter((id) => id.startsWith("new-")).map((id) => ({ id, isNew: true })),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900">Exchange Rates</h2>
          <p className="text-[12px] text-gray-500 mt-1">Manage exchange rates displayed in the market ticker and data hub.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-white bg-gray-900 hover:bg-gray-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Exchange Rate
          </button>
          <button
            onClick={() => resetMutation.mutate()}
            className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetMutation.isPending ? "animate-spin" : ""}`} />
            Reset to Default
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13px]">Loading…</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {allItems.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-[13px]">
              No exchange rates yet. Click "Add Exchange Rate" to create one.
            </div>
          )}

          {allItems.map(({ id, isNew }) => {
            const d = getDraft(id);
            const isEditing = isNew || editingId === id;
            return (
              <div key={id} className={`border p-5 ${isEditing ? "border-gray-900 bg-white" : "border-[#E5E7EB] bg-white"}`}>
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Symbol + Category */}
                  <div className="min-w-[120px]">
                    <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Symbol</label>
                    <input
                      type="text"
                      value={d.symbol ?? ""}
                      onChange={(e) => patchDraft(id, { symbol: e.target.value, label: e.target.value, labelEn: e.target.value, labelId: e.target.value })}
                      className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] font-medium text-gray-900 focus:outline-none focus:border-gray-900"
                      placeholder="IDR/USD"
                    />
                  </div>

                  {/* English Label */}
                  <div className="min-w-[140px]">
                    <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">English Label</label>
                    <input
                      type="text"
                      value={d.labelEn ?? ""}
                      onChange={(e) => patchDraft(id, { labelEn: e.target.value })}
                      className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                      placeholder="English name"
                    />
                  </div>

                  {/* Indonesian Label */}
                  <div className="min-w-[140px]">
                    <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Indonesian Label</label>
                    <input
                      type="text"
                      value={d.labelId ?? ""}
                      onChange={(e) => patchDraft(id, { labelId: e.target.value })}
                      className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                      placeholder="Nama Indonesia"
                    />
                  </div>

                  {/* Value */}
                  <div className="min-w-[100px]">
                    <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rate</label>
                    <input
                      type="text"
                      value={d.value ?? ""}
                      onChange={(e) => patchDraft(id, { value: e.target.value })}
                      className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] font-medium text-gray-900 focus:outline-none focus:border-gray-900"
                      placeholder="e.g., 17,100"
                    />
                  </div>

                  {/* Change */}
                  <div className="min-w-[100px]">
                    <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Change</label>
                    <input
                      type="text"
                      value={d.change ?? ""}
                      onChange={(e) => patchDraft(id, { change: e.target.value })}
                      className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                      placeholder="+0.32%"
                    />
                  </div>

                  {/* Category */}
                    <div className="min-w-[150px]">
                      <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                      <div className="flex flex-col gap-1.5">
                        <select 
                          value={CATEGORIES_ER.includes(d.category ?? "") ? d.category : "custom"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "custom") patchDraft(id, { category: val as any });
                            else patchDraft(id, { category: "" as any });
                          }}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white"
                        >
                          {CATEGORIES_ER.map((c) => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))}
                          <option value="custom">-- Other (Custom) --</option>
                        </select>
                        
                        {(!CATEGORIES_ER.includes(d.category ?? "")) && (
                          <input 
                            type="text"
                            value={d.category ?? ""}
                            onChange={(e) => patchDraft(id, { category: e.target.value as any })}
                            className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white"
                            placeholder="Type custom category..."
                          />
                        )}
                      </div>
                    </div>

                  {/* Enabled */}
                  <div className="flex items-center gap-2 pt-5">
                    <button
                      onClick={() => patchDraft(id, { enabled: !d.enabled })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${d.enabled ? "bg-gray-900" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${d.enabled ? "left-5" : "left-0.5"}`} />
                    </button>
                    <span className="text-[11px] text-gray-500">{d.enabled ? "Visible" : "Hidden"}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(id)}
                          disabled={createMutation.isPending || updateMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setDrafts((prev) => { const n = {...prev}; delete n[id]; return n; });
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingId(id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Calendar Tab ───────────────────────────────────────────────────────────────

const CALENDAR_CATEGORIES = [
  "Interest Rate", "Prices & Inflation", "Labour Market", "GDP Growth",
  "Foreign Trade", "Government", "Business Confidence", "Consumer Sentiment",
  "Housing Market", "Bond Auctions", "Energy", "Holidays", "Earnings",
];

const CALENDAR_CATEGORIES_ID = [
  "Suku Bunga", "Harga & Inflasi", "Pasar Kerja", "Pertumbuhan PDB",
  "Perdagangan", "Pemerintah", "Kepercayaan Bisnis", "Sentimen Konsumen",
  "Properti", "Lelang Obligasi", "Energi", "Hari Libur", "Laba Perusahaan",
];

function newCalendarEvent(order: number): Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> {
  const today = new Date().toISOString().split("T")[0];
  return {
    date: today,
    time: "08:00",
    countryCode: "ID",
    countryLabel: "Indonesia",
    eventName: "New Economic Event",
    eventNameId: "Peristiwa Ekonomi Baru",
    impact: "medium",
    actual: "",
    previous: "",
    consensus: "",
    forecast: "",
    category: "Interest Rate",
    region: "all",
    enabled: true,
    order,
  };
}

function CalendarTab() {
  const { data: events = [], isLoading } = useCalendarEvents();
  const { data: config } = useCalendarConfig();
  const createMutation = useCreateCalendarEvent();
  const updateMutation = useUpdateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();
  const resetMutation = useResetCalendarEvents();
  const updateConfigMut = useUpdateCalendarConfig();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [configTab, setConfigTab] = useState<"events" | "settings">("events");
  const [drafts, setDrafts] = useState<Record<string, Partial<CalendarEvent>>>({});
  const [configDraft, setConfigDraft] = useState<Partial<CalendarConfig> | null>(null);
  const [newCount, setNewCount] = useState(0);

  const getDraft = (id: string): Partial<CalendarEvent> => {
    if (id.startsWith("new-")) return drafts[id] ?? {};
    const ev = events.find((e) => e.id === id);
    return drafts[id] ?? (ev ? { ...ev } : {});
  };

  const patchDraft = (id: string, fields: Partial<CalendarEvent>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...fields } }));
  };

  const handleSave = async (id: string) => {
    const d = getDraft(id);
    if (id.startsWith("new-")) {
      await createMutation.mutateAsync(d as any);
      setDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      await updateMutation.mutateAsync({ id, data: d });
      setEditingId(null);
      setDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleDelete = async (id: string) => {
    if (!id.startsWith("new-")) {
      if (!confirm("Delete this event?")) return;
      await deleteMutation.mutateAsync(id);
    }
    setDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleAddNew = () => {
    const tempId = `new-${Date.now()}`;
    setDrafts((prev) => ({
      ...prev,
      [tempId]: newCalendarEvent(events.length + newCount),
    }));
    setNewCount((c) => c + 1);
  };

  const handleSaveConfig = async () => {
    if (!configDraft) return;
    await updateConfigMut.mutateAsync(configDraft);
    setConfigDraft(null);
  };

  const allItems: Array<{ id: string; isNew: boolean }> = [
    ...events.map((ev) => ({ id: ev.id, isNew: false })),
    ...Object.keys(drafts).filter((id) => id.startsWith("new-")).map((id) => ({ id, isNew: true })),
  ];

  const activeConfig = configDraft ?? config;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900">Economic Calendar</h2>
          <p className="text-[12px] text-gray-500 mt-1">Manage economic events for display. Changes appear in the calendar widget on pages.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setConfigTab("settings"); setConfigDraft(config ?? null); }}
            className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50"
          >
            <Layout className="w-3.5 h-3.5" /> Settings
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-white bg-gray-900 hover:bg-gray-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Event
          </button>
          <button
            onClick={() => resetMutation.mutate()}
            className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetMutation.isPending ? "animate-spin" : ""}`} />
            Reset
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-[#E5E7EB] mb-6">
        {(["events", "settings"] as const).map((tab) => (
          <button key={tab} onClick={() => setConfigTab(tab)}
            className={`px-5 py-2.5 text-[13px] font-medium border-b-2 capitalize transition-colors ${
              configTab === tab ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {tab === "events" ? "Events" : "Display Settings"}
          </button>
        ))}
      </div>

      {configTab === "settings" && (
        <div className="max-w-[700px]">
          {activeConfig && (
            <div className="bg-white border border-[#E5E7EB] p-6">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-5">Calendar Display Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title (EN)</label>
                  <input type="text" value={activeConfig.title} onChange={(e) => setConfigDraft((p) => p ? { ...p, title: e.target.value } : p)}
                    className="w-full border border-[#E5E7EB] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title (ID)</label>
                  <input type="text" value={activeConfig.titleId ?? ""} onChange={(e) => setConfigDraft((p) => p ? { ...p, titleId: e.target.value } : p)}
                    className="w-full border border-[#E5E7EB] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Default Days</label>
                  <input type="number" min={1} max={30} value={activeConfig.defaultDays}
                    onChange={(e) => setConfigDraft((p) => p ? { ...p, defaultDays: parseInt(e.target.value) || 7 } : p)}
                    className="w-full border border-[#E5E7EB] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Default Region</label>
                  <select value={activeConfig.regionFilter}
                    onChange={(e) => setConfigDraft((p) => p ? { ...p, regionFilter: e.target.value as CalendarRegion } : p)}
                    className="w-full border border-[#E5E7EB] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white">
                    {["all", "major", "america", "europe", "asia", "africa"].map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle columns */}
              <div className="mt-5 pt-5 border-t border-[#E5E7EB]">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Visible Columns</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "showActual", label: "Actual" },
                    { key: "showPrevious", label: "Previous" },
                    { key: "showConsensus", label: "Consensus" },
                    { key: "showForecast", label: "Forecast" },
                    { key: "showTimezone", label: "Timezone Bar" },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <button
                        onClick={() => setConfigDraft((p) => p ? { ...p, [key]: !((p as any)[key]) } : p)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${(activeConfig as any)[key] ? "bg-gray-900" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${(activeConfig as any)[key] ? "left-5" : "left-0.5"}`} />
                      </button>
                      <span className="text-[12.5px] text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact filter default */}
              <div className="mt-5 pt-5 border-t border-[#E5E7EB]">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Default Impact Filter</p>
                <div className="flex gap-3">
                  {(["low", "medium", "high"] as CalendarImpact[]).map((impact) => {
                    const active = (activeConfig.impactFilter ?? []).includes(impact);
                    return (
                      <button key={impact} onClick={() => {
                        const curr = activeConfig.impactFilter ?? [];
                        const next = active ? curr.filter((i) => i !== impact) : [...curr, impact];
                        setConfigDraft((p) => p ? { ...p, impactFilter: next } : p);
                      }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border transition-colors ${active ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600"}`}>
                        <span className={`w-2 h-2 rounded-full ${impact === "low" ? "bg-gray-300" : impact === "medium" ? "bg-yellow-400" : "bg-red-500"}`} />
                        {impact}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={handleSaveConfig}
                  disabled={updateConfigMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Save Settings
                </button>
                <button onClick={() => setConfigDraft(null)} className="px-4 py-2 text-[12.5px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {configTab === "events" && (
        <div>
          {isLoading && (
            <div className="flex items-center gap-3 py-16 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[13px]">Loading…</span>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-3">
              {allItems.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-[13px]">
                  No events yet. Click "Add Event" to create one.
                </div>
              )}

              {allItems.map(({ id, isNew }) => {
                const d = getDraft(id);
                const isEditing = isNew || editingId === id;
                return (
                  <div key={id} className={`border p-5 ${isEditing ? "border-gray-900 bg-white" : "border-[#E5E7EB] bg-white"}`}>
                    <div className="flex items-start gap-3 flex-wrap">
                      {/* Date */}
                      <div className="min-w-[110px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                        <input type="date" value={d.date ?? ""}
                          onChange={(e) => patchDraft(id, { date: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900" />
                      </div>
                      {/* Time */}
                      <div className="min-w-[90px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Time</label>
                        <input type="time" value={d.time ?? "08:00"}
                          onChange={(e) => patchDraft(id, { time: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900" />
                      </div>
                      {/* Country Code */}
                      <div className="min-w-[70px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Country</label>
                        <input type="text" value={d.countryCode ?? ""}
                          onChange={(e) => patchDraft(id, { countryCode: e.target.value.toUpperCase() })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] font-medium text-gray-900 focus:outline-none focus:border-gray-900 uppercase"
                          placeholder="ID" maxLength={3} />
                      </div>
                      {/* Country Label */}
                      <div className="min-w-[130px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Country Name</label>
                        <input type="text" value={d.countryLabel ?? ""}
                          onChange={(e) => patchDraft(id, { countryLabel: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                          placeholder="Indonesia" />
                      </div>
                      {/* Event Name */}
                      <div className="min-w-[200px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Event (EN)</label>
                        <input type="text" value={d.eventName ?? ""}
                          onChange={(e) => patchDraft(id, { eventName: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                          placeholder="CPI YoY" />
                      </div>
                      {/* Event Name ID */}
                      <div className="min-w-[200px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Event (ID)</label>
                        <input type="text" value={d.eventNameId ?? ""}
                          onChange={(e) => patchDraft(id, { eventNameId: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                          placeholder="IHK YoY" />
                      </div>
                      {/* Category */}
                      <div className="min-w-[150px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                        <div className="flex flex-col gap-1.5">
                          <select value={CALENDAR_CATEGORIES.includes(d.category ?? "") ? d.category : "custom"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== "custom") patchDraft(id, { category: val });
                              else patchDraft(id, { category: "" });
                            }}
                            className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[12.5px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white">
                            {CALENDAR_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="custom">-- Other (Custom) --</option>
                          </select>
                          
                          {(!CALENDAR_CATEGORIES.includes(d.category ?? "")) && (
                            <input 
                              type="text" 
                              value={d.category ?? ""}
                              onChange={(e) => patchDraft(id, { category: e.target.value })}
                              className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[12.5px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white"
                              placeholder="Type custom category..."
                            />
                          )}
                        </div>
                      </div>
                      {/* Impact */}
                      <div className="min-w-[100px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Impact</label>
                        <select value={d.impact ?? "medium"}
                          onChange={(e) => patchDraft(id, { impact: e.target.value as CalendarImpact })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:border-gray-900 bg-white">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      {/* Region */}
                      <div className="min-w-[100px]">
                        <label className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Region</label>
                        <select value={d.region ?? "all"}
                          onChange={(e) => patchDraft(id, { region: e.target.value as CalendarRegion })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[12.5px] text-gray-900 focus:outline-none focus:border-gray-900 bg-white">
                          {["all", "major", "america", "europe", "asia", "africa"].map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Values row */}
                    <div className="flex items-start gap-3 mt-3 flex-wrap">
                      <div className="min-w-[90px]">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Actual</label>
                        <input type="text" value={d.actual ?? ""}
                          onChange={(e) => patchDraft(id, { actual: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                          placeholder="2.1%" />
                      </div>
                      <div className="min-w-[90px]">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Previous</label>
                        <input type="text" value={d.previous ?? ""}
                          onChange={(e) => patchDraft(id, { previous: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                          placeholder="1.8%" />
                      </div>
                      <div className="min-w-[90px]">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Consensus</label>
                        <input type="text" value={d.consensus ?? ""}
                          onChange={(e) => patchDraft(id, { consensus: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                          placeholder="2.0%" />
                      </div>
                      <div className="min-w-[90px]">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Forecast</label>
                        <input type="text" value={d.forecast ?? ""}
                          onChange={(e) => patchDraft(id, { forecast: e.target.value })}
                          className="w-full border border-[#E5E7EB] px-2.5 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:border-gray-900"
                          placeholder="2.2%" />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <button onClick={() => patchDraft(id, { enabled: !d.enabled })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${d.enabled ? "bg-gray-900" : "bg-gray-300"}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${d.enabled ? "left-5" : "left-0.5"}`} />
                        </button>
                        <span className="text-[11px] text-gray-500">{d.enabled ? "Visible" : "Hidden"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSave(id)}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" /> Save
                          </button>
                          <button onClick={() => { setEditingId(null); setDrafts((p) => { const n = {...p}; delete n[id]; return n; }); }}
                            className="px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setEditingId(id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-[#E5E7EB] hover:bg-gray-50">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      <button onClick={() => handleDelete(id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-red-600 border border-red-200 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main AdminPage ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"data" | "pages" | "blog" | "analisis" | "featured" | "exchange-rates" | "calendar">("data");
  const deployMut = useDeployToVPS();

  const tabs = [
    { key: "data" as const,          label: "Data Hub",           icon: <Database className="w-4 h-4" /> },
    { key: "pages" as const,          label: "Pages",              icon: <FileText className="w-4 h-4" /> },
    { key: "blog" as const,           label: "Blog",               icon: <BookOpen className="w-4 h-4" /> },
    { key: "analisis" as const,       label: "Analisis Deskriptif",  icon: <BarChart3 className="w-4 h-4" /> },
    { key: "featured" as const,       label: "Featured Insights",   icon: <Star className="w-4 h-4" /> },
    { key: "exchange-rates" as const, label: "Exchange Rates",     icon: <TrendingUp className="w-4 h-4" /> },
    { key: "calendar" as const,       label: "Economic Calendar",   icon: <Layout className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[15px] font-semibold text-gray-900">AndaraLab CMS</span>
          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium border transition-colors ${
                  activeTab === t.key
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm("Push all local CMS changes to Production VPS?")) {
                deployMut.mutate();
              }
            }}
            disabled={deployMut.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border transition-all ${
              deployMut.isPending
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {deployMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {deployMut.isPending ? "Syncing..." : "Sync to VPS"}
          </button>
          <a href="/" className="text-[12.5px] text-gray-500 hover:text-gray-800 font-medium">← Back to site</a>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {activeTab === "data"      && <DataHubTab />}
        {activeTab === "pages"     && <PagesTab />}
        {activeTab === "blog"      && <BlogTab />}
        {activeTab === "analisis"  && <AnalisisTab />}
        {activeTab === "featured"  && <FeaturedInsightsTab />}
        {activeTab === "exchange-rates" && <ExchangeRatesTab />}
        {activeTab === "calendar"  && <CalendarTab />}
      </div>
    </div>
  );
}
