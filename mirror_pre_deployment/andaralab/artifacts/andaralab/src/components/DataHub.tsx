import { ArrowRight, Calendar, BarChart2 } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from "recharts";
import { useDatasets, usePosts } from "../lib/cms-store";
import { formatValue } from "../lib/utils";
import { useChartZoom } from "../hooks/useChartZoom";
import { useLocale } from "../lib/locale";

function SparkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white text-gray-900 border border-gray-200 text-[11px] px-2 py-1 font-semibold shadow-sm">
      {payload[0].value.toLocaleString()}
    </div>
  );
}

function getLastTwo(rows: Record<string, string | number>[], key: string) {
  const vals = rows
    .map((r) => { const v = r[key]; return typeof v === "number" ? v : parseFloat(String(v)); })
    .filter((v) => !isNaN(v));
  const last = vals[vals.length - 1] ?? 0;
  const prev = vals.length > 1 ? vals[vals.length - 2] : last;
  return { last, prev };
}

function formatChange(last: number, prev: number, isRate = false, locale = "en"): { label: string; positive: boolean | null } {
  const diff = last - prev;
  if (Math.abs(diff) < 0.001) return { label: locale === "id" ? "Tidak berubah" : "Unchanged", positive: null };
  const sign = diff > 0 ? "+" : "";
  return { label: isRate ? `${sign}${diff.toFixed(2)}%` : `${sign}${diff.toFixed(2)}`, positive: diff > 0 };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return dateStr; }
}

export default function DataHub() {
  const { locale, t } = useLocale();
  const { data: datasets = [], isLoading: datasetsLoading } = useDatasets();
  const { data: posts = [] } = usePosts({ status: "published" });

  const biRateDs = datasets.find((d) => d.id === "bi-rate");
  const idrUsdDs = datasets.find((d) => d.id === "idr-usd");
  const tradeDs  = datasets.find((d) => d.id === "trade-balance");

  const biRate = (() => {
    if (biRateDs && biRateDs.rows.length > 0) {
      const { last, prev } = getLastTwo(biRateDs.rows, "BI Rate");
      const { label, positive } = formatChange(last, prev, true, locale);
      return { label: locale === "id" ? "Suku Bunga BI" : "BI Rate", value: formatValue(last, biRateDs.unitType ?? "percent", biRateDs.unit), change: label, positive };
    }
    return { label: locale === "id" ? "Suku Bunga BI" : "BI Rate", value: "—", change: "—", positive: null as null };
  })();

  const idrUsd = (() => {
    if (idrUsdDs && idrUsdDs.rows.length > 0) {
      const { last, prev } = getLastTwo(idrUsdDs.rows, "IDR/USD");
      const { label, positive } = formatChange(last, prev, false, locale);
      return { label: "IDR/USD", value: formatValue(last, idrUsdDs.unitType ?? "currency_idr", idrUsdDs.unit), change: label, positive };
    }
    return { label: "IDR/USD", value: "—", change: "—", positive: null as null };
  })();

  const tradeBalance = (() => {
    if (tradeDs && tradeDs.rows.length > 0) {
      const { last, prev } = getLastTwo(tradeDs.rows, "Balance");
      const { label, positive } = formatChange(last, prev, false, locale);
      return { label: locale === "id" ? "Neraca Perdagangan" : "Trade Balance", value: formatValue(last, tradeDs.unitType ?? "currency_usd", tradeDs.unit), change: label, positive };
    }
    return { label: locale === "id" ? "Neraca Perdagangan" : "Trade Balance", value: "—", change: "—", positive: null as null };
  })();

  // ── Spark chart from IDR/USD dataset rows ──
  const jciSpark = idrUsdDs && idrUsdDs.rows.length > 1
    ? idrUsdDs.rows
        .map((r) => ({ t: String(r[idrUsdDs.columns[0]]), v: typeof r["IDR/USD"] === "number" ? r["IDR/USD"] as number : parseFloat(String(r["IDR/USD"])) }))
        .filter((p) => !isNaN(p.v))
    : [];

  const marketItems = [idrUsd, biRate, tradeBalance];

  const { brushRange: sparkBrush, setBrushRange: setSparkBrush, zoomProps: sparkZoomProps } = useChartZoom(jciSpark.length);

  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
    .slice(0, 5);

  return (
    <section className="py-12 bg-white border-t border-[#E5E7EB]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900">{locale === "id" ? "Snapshot Pusat Data" : "Data Hub Snapshot"}</h2>
            <p className="text-[13px] text-gray-400 mt-0.5">{locale === "id" ? "Riset terbaru dan data pasar dari CMS" : "Latest research and market data from CMS"}</p>
          </div>
          <Link href="/data" className="flex items-center gap-1 text-[12.5px] font-medium text-gray-900 hover:underline">
            {locale === "id" ? "Jelajahi Pusat Data" : "Explore full Data Hub"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Latest Articles panel */}
          <div className="md:col-span-3 border border-[#E5E7EB] bg-white">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[13.5px] font-semibold text-gray-900">{locale === "id" ? "Riset Terbaru" : "Latest Research"}</span>
              <Link href="/blog/market-pulse" className="text-[11.5px] text-gray-900 font-medium hover:underline ml-auto">
                {locale === "id" ? "Lihat semua →" : "See all →"}
              </Link>
            </div>
            {recentPosts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-[13px]">
                {locale === "id" ? "Belum ada artikel." : "No articles yet."}{" "}
                <Link href="/admin" className="text-gray-900 hover:underline">{locale === "id" ? "Tambah di CMS →" : "Add in CMS →"}</Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-wide text-gray-400 border-b border-[#F3F4F6]">
                    <th className="text-left px-4 py-2 font-semibold">{t("date")}</th>
                    <th className="text-left py-2 font-semibold">{locale === "id" ? "Judul" : "Title"}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("category_label")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPosts.map((post) => (
                    <tr key={post.id} className="border-b border-[#F3F4F6] hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 pr-2">
                        <Link href={`/article/${post.slug}`} className="text-[12.5px] text-gray-800 font-medium hover:text-gray-900 transition-colors line-clamp-1">
                          {post.title}
                        </Link>
                      </td>
                      <td className="text-right px-4 py-3">
                        <span className="text-[10.5px] font-semibold px-1.5 py-0.5 inline-block text-gray-900 bg-gray-100">
                          {post.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="px-4 py-3 border-t border-[#E5E7EB]">
              <Link
                href="/blog/market-pulse"
                className="flex items-center gap-1.5 justify-center text-[12.5px] font-medium text-gray-900 border border-gray-900 px-5 py-2 w-full hover:bg-gray-100 transition-colors"
              >
                {locale === "id" ? "Semua Riset" : "All Research"} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Market Overview */}
          <div className="md:col-span-2 border border-[#E5E7EB] bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <span className="text-[13.5px] font-semibold text-gray-900">{t("market_overview")}</span>
              <Link href="/data/market-dashboard" className="text-[11.5px] text-gray-900 font-medium hover:underline ml-auto">
                {locale === "id" ? "Live →" : "Live →"}
              </Link>
            </div>

            {jciSpark.length > 1 && (
              <div className="px-4 pt-3 pb-2 border-b border-[#F3F4F6]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-400">IDR/USD — Historical</span>
                  <span className="text-[11px] font-semibold text-gray-600">
                    {idrUsd.change}
                  </span>
                </div>
                <div {...sparkZoomProps}>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={jciSpark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <Line type="monotone" dataKey="v" stroke="#00205B" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#00205B" }} />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip content={<SparkTooltip />} />
                      <Brush
                        dataKey="t"
                        height={18}
                        stroke="#E5E7EB"
                        fill="#F9FAFB"
                        travellerWidth={5}
                        tickFormatter={() => ""}
                        startIndex={sparkBrush.startIndex}
                        endIndex={sparkBrush.endIndex}
                        onChange={(r) => setSparkBrush({ startIndex: r.startIndex, endIndex: r.endIndex })}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="divide-y divide-[#F3F4F6] flex-1">
              {datasetsLoading && marketItems.every(m => m.value === "—") ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))
              ) : (
                <>
                  {marketItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <span className="text-[12.5px] text-gray-600">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
                        <span className={`text-[11px] font-semibold ${
                          item.positive === true ? "text-green-600" :
                          item.positive === false ? "text-red-500" :
                          "text-gray-500"
                        }`}>
                          {item.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[#E5E7EB]">
              <Link
                href="/data/market-dashboard"
                className="flex items-center gap-1.5 justify-center text-[12.5px] font-medium text-gray-900 border border-gray-900 px-5 py-2 w-full hover:bg-gray-100 transition-colors"
              >
                {locale === "id" ? "Dashboard Pasar" : "Market Dashboard"} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
