import { useState, useMemo, useCallback, useEffect } from "react";
import { MODELS, AIModel, ModelProvider } from "@/data/models-data";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { applyDocumentSeo } from "@/lib/document-meta";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseContextLength(s: string): number {
  const num = parseFloat(s.replace(/[^\d.]/g, ""));
  const mul = s.includes("M") ? 1_000_000 : s.includes("K") ? 1_000 : 1;
  return num * mul;
}

function parsePrice(s: string): number {
  if (s === "Free") return 0;
  return parseFloat(s.replace(/[^\d.]/g, ""));
}

// ─── Sort Icon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-gray-900" />
    : <ChevronDown className="w-3 h-3 text-gray-900" />;
}

// ─── Status Cell ────────────────────────────────────────────────────────────────

function StatusCell({ status }: { status: "Active" | "Deprecated" }) {
  return (
    <span className="text-[12.5px] text-gray-500">
      {status === "Active" ? "Active" : "Deprecated"}
    </span>
  );
}

// ─── Table Row ─────────────────────────────────────────────────────────────────

function TableRow({ model, index }: { model: AIModel; index: number }) {
  const priceNum = parsePrice(model.pricePerMTokens);

  return (
    <tr
      className="border-b border-gray-200 hover:bg-gray-50/60 transition-colors duration-100"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Model */}
      <td className="px-5 py-4 align-top">
        <div className="text-[13.5px] font-semibold text-gray-900">{model.name}</div>
        <div className="text-[11.5px] text-gray-400 mt-0.5 leading-relaxed max-w-[220px]">{model.tagline}</div>
      </td>

      {/* Provider */}
      <td className="px-5 py-4 align-top">
        <span className="text-[12.5px] font-medium text-gray-600">{model.provider}</span>
      </td>

      {/* Status */}
      <td className="px-5 py-4 align-top">
        <StatusCell status={model.status} />
      </td>

      {/* Context */}
      <td className="px-5 py-4 align-top">
        <span className="text-[13px] font-medium text-gray-800">{model.contextLength}</span>
      </td>

      {/* Price */}
      <td className="px-5 py-4 align-top text-right">
        <span className="text-[13px] font-medium text-gray-800">
          {priceNum === 0
            ? <span className="text-gray-500">Free</span>
            : <>${model.pricePerMTokens.replace("$", "")}<span className="text-[11px] font-normal text-gray-400 ml-0.5">/1M tok</span></>
          }
        </span>
      </td>

      {/* API */}
      <td className="px-5 py-4 align-top">
        <span className="text-[11.5px] text-gray-400 font-medium uppercase tracking-wide">{model.apiType}</span>
      </td>
    </tr>
  );
}

// ─── Card Row ──────────────────────────────────────────────────────────────────

function CardRow({ model }: { model: AIModel }) {
  const priceNum = parsePrice(model.pricePerMTokens);
  return (
    <div className="bg-white border border-gray-200 px-5 py-4 flex items-start gap-6 hover:bg-gray-50/50 transition-colors">
      {/* Model */}
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-gray-900">{model.name}</div>
        <div className="text-[11.5px] text-gray-400 mt-0.5">{model.provider}</div>
      </div>
      {/* Status */}
      <div className="w-20 flex-shrink-0">
        <StatusCell status={model.status} />
      </div>
      {/* Context */}
      <div className="w-24 flex-shrink-0 text-right">
        <div className="text-[12.5px] font-medium text-gray-700">{model.contextLength}</div>
        <div className="text-[10.5px] text-gray-400">context</div>
      </div>
      {/* Price */}
      <div className="w-24 flex-shrink-0 text-right">
        <div className={`text-[12.5px] font-medium ${priceNum === 0 ? "text-gray-500" : "text-gray-800"}`}>
          {priceNum === 0 ? "Free" : `$${model.pricePerMTokens.replace("$", "")}`}
        </div>
        {priceNum > 0 && <div className="text-[10.5px] text-gray-400">/1M tok</div>}
      </div>
      {/* API */}
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{model.apiType}</span>
      </div>
    </div>
  );
}

// ─── Metric Strip ──────────────────────────────────────────────────────────────

function MetricStrip({ filtered }: { filtered: AIModel[] }) {
  const total = MODELS.length;
  const freeCount = MODELS.filter((m) => m.isFree).length;
  const providers = [...new Set(MODELS.map((m) => m.provider))].length;
  const maxCtxModel = MODELS.reduce((a, b) =>
    parseContextLength(a.contextLength) > parseContextLength(b.contextLength) ? a : b
  );

  return (
    <div className="border-b border-gray-200 bg-white px-5 py-4 flex items-center gap-0">
      {[
        { label: "Models tracked", value: total },
        { label: "Free tier", value: freeCount },
        { label: "Providers", value: providers },
        { label: "Largest context", value: maxCtxModel.contextLength },
      ].map((m, i) => (
        <div key={m.label} className={`flex items-baseline gap-2 pr-8 ${i > 0 ? "pl-8 border-l border-gray-200" : ""}`}>
          <span className="text-[22px] font-bold text-gray-900 leading-none">{m.value}</span>
          <span className="text-[11.5px] text-gray-400 font-medium">{m.label}</span>
        </div>
      ))}
      {filtered.length !== total && (
        <div className="ml-auto text-[11.5px] text-gray-400 font-medium">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} shown
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  selectedProviders: ModelProvider[];
  onToggleProvider: (p: ModelProvider) => void;
  showFreeOnly: boolean | null;
  onToggleFree: (v: boolean | null) => void;
  sort: { col: string; dir: SortDir };
  onSort: (c: string) => void;
  view: "table" | "list";
  onView: (v: "table" | "list") => void;
}

function FilterBar({
  search, onSearch, selectedProviders, onToggleProvider,
  showFreeOnly, onToggleFree, sort, onSort, view, onView,
}: FilterBarProps) {
  const PROVIDER_LIST = [...new Set(MODELS.map((m) => m.provider))] as ModelProvider[];
  const hasFilters = search || selectedProviders.length > 0 || showFreeOnly !== null;

  const reset = () => {
    onSearch("");
    selectedProviders.forEach((p) => onToggleProvider(p));
    onToggleFree(null);
  };

  const cycleFree = () => {
    if (showFreeOnly === null) onToggleFree(true);
    else if (showFreeOnly === true) onToggleFree(false);
    else onToggleFree(null);
  };

  return (
    <div className="py-4 border-b border-gray-200 space-y-3">
      {/* Row 1: search + controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-[12.5px] text-gray-900 placeholder:text-gray-400 border border-gray-200 bg-white focus:outline-none focus:border-gray-900 transition-colors"
          />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Free/Paid filter */}
        <button
          onClick={cycleFree}
          className={`px-3 py-2 text-[12px] font-medium border transition-colors ${
            showFreeOnly === null
              ? "border-gray-900 text-gray-900 bg-gray-100"
              : showFreeOnly === true
              ? "border-gray-900 text-gray-900 bg-gray-100"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          {showFreeOnly === null ? "All models" : showFreeOnly === true ? "Free only" : "Paid only"}
        </button>

        {/* View toggle — text only */}
        <div className="flex items-center border border-gray-200 ml-auto">
          {([["table", "Table"], ["list", "List"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-3 py-2 text-[12px] font-medium transition-colors border-l border-gray-200 first:border-l-0 ${
                view === v ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={reset}
            className="text-[12px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Row 2: Provider filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Provider</span>
        {PROVIDER_LIST.map((p) => {
          const active = selectedProviders.includes(p);
          return (
            <button
              key={p}
              onClick={() => onToggleProvider(p)}
              className={`px-2.5 py-1 text-[12px] font-medium border transition-colors ${
                active
                  ? "border-gray-900 text-gray-900 bg-gray-100"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Column Header ─────────────────────────────────────────────────────────────

function Th({
  label, col, sort, onSort, align = "left",
}: {
  label: string; col: keyof AIModel; sort: { col: keyof AIModel; dir: SortDir };
  onSort: (c: keyof AIModel) => void; align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400 cursor-pointer select-none whitespace-nowrap group ${align === "right" ? "text-right" : ""}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon active={sort.col === col} dir={sort.dir} />
      </span>
    </th>
  );
}

// ─── Sort Label ────────────────────────────────────────────────────────────────

function sortColLabel(col: keyof AIModel): string {
  const m: Record<string, string> = {
    name: "Name", provider: "Provider", status: "Status",
    contextLength: "Context", pricePerMTokens: "Price",
  };
  return m[col] ?? col;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ModelsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<ModelProvider[]>([]);
  const [showFreeOnly, setShowFreeOnly] = useState<boolean | null>(null);
  const [sort, setSort] = useState<{ col: keyof AIModel; dir: SortDir }>({ col: "name", dir: "asc" });
  const [view, setView] = useState<"table" | "list">("table");

  useEffect(() => {
    applyDocumentSeo({
      title: t("nav_model_comparison"),
      description: t("meta_models_description"),
      pathname: "/data/models",
    });
  }, [t]);

  const toggleProvider = useCallback((p: ModelProvider) => {
    setSelectedProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }, []);

  const handleSort = useCallback((col: keyof AIModel) => {
    setSort((prev) => ({ col, dir: prev.col === col && prev.dir === "asc" ? "desc" : "asc" }));
  }, []);

  const filtered = useMemo(() => {
    let list = [...MODELS];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q)
      );
    }

    if (selectedProviders.length > 0) {
      list = list.filter((m) => selectedProviders.includes(m.provider));
    }

    if (showFreeOnly !== null) {
      list = list.filter((m) => m.isFree === showFreeOnly);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sort.col) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "provider": cmp = a.provider.localeCompare(b.provider); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "contextLength": cmp = parseContextLength(a.contextLength) - parseContextLength(b.contextLength); break;
        case "pricePerMTokens": cmp = parsePrice(a.pricePerMTokens) - parsePrice(b.pricePerMTokens); break;
        default: cmp = 0;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [search, selectedProviders, showFreeOnly, sort]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen">

      {/* ─── Report Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 pt-10 pb-8">

          {/* Publication metadata */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium mb-6">
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 font-semibold uppercase tracking-wide text-[10px]">Research</span>
            <span>AndaraLab · Technology Research</span>
            <span>·</span>
            <span>March 2026</span>
          </div>

          <h1 className="text-[28px] font-bold text-gray-900 leading-tight mb-3">
            LLM Model Comparison
          </h1>
          <p className="text-[13.5px] text-gray-500 max-w-[540px] leading-relaxed">
            Comparative overview of frontier large language models. Context windows, pricing at standard input tiers, and capability status — curated for macroeconomic and financial research use cases. Last updated March 2026.
          </p>

          {/* Inline legend */}
          <div className="flex items-center gap-5 mt-5 pt-5 border-t border-gray-100 text-[11.5px] text-gray-400">
            <span>{MODELS.length} models</span>
            <span>·</span>
            <span>{[...new Set(MODELS.map(m => m.provider))].length} providers</span>
            <span>·</span>
            <span>Prices in USD per 1M input tokens</span>
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        {/* Filter bar */}
        <div className="bg-white border border-gray-200 mb-0">
          <FilterBar
            search={search}
            onSearch={setSearch}
            selectedProviders={selectedProviders}
            onToggleProvider={toggleProvider}
            showFreeOnly={showFreeOnly}
            onToggleFree={setShowFreeOnly}
            sort={sort}
            onSort={handleSort}
            view={view}
            onView={setView}
          />
        </div>

        {/* Table View */}
        {view === "table" && (
          <div className="bg-white border border-t-0 border-gray-200">
            {/* Metric strip */}
            <MetricStrip filtered={filtered} />

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <Th label="Model" col="name" sort={sort} onSort={handleSort} />
                    <Th label="Provider" col="provider" sort={sort} onSort={handleSort} />
                    <Th label="Status" col="status" sort={sort} onSort={handleSort} />
                    <Th label="Context" col="contextLength" sort={sort} onSort={handleSort} />
                    <Th label="Price / 1M tok" col="pricePerMTokens" sort={sort} onSort={handleSort} align="right" />
                    <th className="px-5 py-3 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">API</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="text-[13px] text-gray-400">No models match your current filters.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((model, i) => <TableRow key={model.id} model={model} index={i} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/40 flex items-center justify-between text-[11px] text-gray-400">
                <span>{filtered.length} of {MODELS.length} models</span>
                <span>Sort: {sortColLabel(sort.col)} · {sort.dir === "asc" ? "A → Z" : "Z → A"}</span>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="bg-white border border-t-0 border-gray-200">
            {/* Header row */}
            <div className="bg-gray-50/60 border-b border-gray-200 px-5 py-2.5 flex items-center gap-6">
              <div className="min-w-0 flex-1 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">Model</div>
              <div className="w-20 flex-shrink-0 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">Status</div>
              <div className="w-24 flex-shrink-0 text-right text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">Context</div>
              <div className="w-24 flex-shrink-0 text-right text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">Price</div>
              <div className="w-16 flex-shrink-0 text-right text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">API</div>
            </div>
            {filtered.length === 0 ? (
              <div className="px-5 py-16 text-center text-[13px] text-gray-400">No models match your current filters.</div>
            ) : (
              filtered.map((model, i) => (
                <div key={model.id} className={`${i < filtered.length - 1 ? "border-b border-gray-200" : ""}`}>
                  <CardRow model={model} />
                </div>
              ))
            )}
          </div>
        )}

        {/* Research disclaimer */}
        {filtered.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-[11px] text-gray-400 leading-relaxed max-w-[700px]">
              <strong className="text-gray-500 font-medium">Note:</strong> Pricing reflects per-token cost for input tokens at standard rate tiers. Free-tier models include Llama 3.1 405B, Gemma 3 27B, Qwen 2.5 72B, Mistral Small 3, MiniMax M2.7, Gemini 2.0 Flash, Grok 2, and DeepSeek V3. Paid models reference OpenAI/Anthropic published list pricing. Context lengths represent maximum supported input windows. Capabilities including vision, audio, and fine-tuning availability vary — consult each provider's official documentation. This dataset is curated for internal research purposes and does not constitute an endorsement of any model or provider. AndaraLab · March 2026.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
