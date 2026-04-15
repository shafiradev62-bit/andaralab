import { ArrowRight, Calendar, BarChart2 } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from "recharts";
import { useDatasets, usePosts } from "../lib/cms-store";
import { formatValue } from "../lib/utils";

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

function formatChange(last: number, prev: number, isRate = false): { label: string; positive: boolean | null } {
  const diff = last - prev;
  if (Math.abs(diff) < 0.001) return { label: "Unchanged", positive: null };
  const sign = diff > 0 ? "+" : "";
  return { label: isRate ? `${sign}${diff.toFixed(2)}%` : `${sign}${diff.toFixed(2)}`, positive: diff > 0 };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return dateStr; }
}

export default function DataHub() {
  const { data: datasets = [] } = useDatasets();
  const { data: posts = [] } = usePosts({ status: "published" });

  const biRateDs = datasets.find((d) => d.id === "bi-rate");
  const idrUsdDs = datasets.find((d) => d.id === "idr-usd");
  const tradeDs  = datasets.find((d) => d.id === "trade-balance");

  const biRate = biRateDs
    ? (() => { const { last, prev } = getLastTwo(biRateDs.rows, "BI Rate"); const { label, positive } = formatChange(last, prev, true); return { label: "BI Rate", value: formatValue(last, biRateDs.unitType ?? "percent", biRateDs.unit), change: label, positive }; })()
    : { label: "BI Rate", value: "—", change: "—", positive: null as null };

  const idrUsd = idrUsdDs
    ? (() => { const { last, prev } = getLastTwo(idrUsdDs.rows, "IDR/USD"); const { label, positive } = formatChange(last, prev); return { label: "IDR/USD", value: formatValue(last, idrUsdDs.unitType ?? "currency_idr", idrUsdDs.unit), change: label, positive }; })()
    : { label: "IDR/USD", value: "—", change: "—", positive: null as null };

  const tradeBalance = tradeDs
    ? (() => { const { last, prev } = getLastTwo(tradeDs.rows, "Balance"); const { label, positive } = formatChange(last, prev); return { label: "Trade Balance", value: formatValue(last, tradeDs.unitType ?? "currency_usd", tradeDs.unit), change: label, positive }; })()
    : { label: "Trade Balance", value: "—", change: "—", positive: null as null };

  const jciSpark = idrUsdDs
    ? idrUsdDs.rows
        .map((r) => ({ t: String(r[idrUsdDs.columns[0]]), v: typeof r["IDR/USD"] === "number" ? r["IDR/USD"] as number : parseFloat(String(r["IDR/USD"])) }))
        .filter((p) => !isNaN(p.v))
    : [];

  const marketItems = [idrUsd, biRate, tradeBalance];

  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
    .slice(0, 5);

  return (
    <section className="py-12 bg-white border-t border-[#E5E7EB]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900">Data Hub Snapshot</h2>
            <p className="text-[13px] text-gray-400 mt-0.5">Latest research and market data from CMS</p>
          </div>
          <Link href="/data" className="flex items-center gap-1 text-[12.5px] font-medium text-gray-900 hover:underline">
            Explore full Data Hub <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Latest Articles panel */}
          <div className="md:col-span-3 border border-[#E5E7EB] bg-white">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[13.5px] font-semibold text-gray-900">Latest Research</span>
              <Link href="/blog/market-pulse" className="text-[11.5px] text-gray-900 font-medium hover:underline ml-auto">
                See all →
              </Link>
            </div>
            {recentPosts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-[13px]">
                No articles yet.{" "}
                <Link href="/admin" className="text-gray-900 hover:underline">Add in CMS →</Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-wide text-gray-400 border-b border-[#F3F4F6]">
                    <th className="text-left px-4 py-2 font-semibold">Date</th>
                    <th className="text-left py-2 font-semibold">Title</th>
                    <th className="text-right px-4 py-2 font-semibold">Category</th>
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
                All Research <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Market Overview */}
          <div className="md:col-span-2 border border-[#E5E7EB] bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <span className="text-[13.5px] font-semibold text-gray-900">Market Overview</span>
              <Link href="/data/market-dashboard" className="text-[11.5px] text-gray-900 font-medium hover:underline ml-auto">
                Live →
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
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={jciSpark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <Line type="monotone" dataKey="v" stroke="#00205B" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#00205B" }} />
                    <XAxis dataKey="t" hide />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip content={<SparkTooltip />} />
                    <Brush dataKey="t" height={18} stroke="#E5E7EB" fill="#F9FAFB" travellerWidth={5} tickFormatter={() => ""} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="divide-y divide-[#F3F4F6] flex-1">
              {marketItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  <span className="text-[12.5px] text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
                    <span className="text-[11px] font-semibold text-gray-600">
                      {item.change}
                    </span>
                  </div>
                </div>
              ))}
              {datasets
                .filter((d) => !["bi-rate", "idr-usd", "trade-balance"].includes(d.id))
                .slice(0, 3)
                .map((ds) => {
                  const valueKey = ds.columns[1];
                  const { last, prev } = getLastTwo(ds.rows, valueKey);
                  const { label, positive } = formatChange(last, prev);
                  return (
                    <div key={ds.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <span className="text-[12.5px] text-gray-600 truncate max-w-[120px]">{ds.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-gray-900">{formatValue(last, ds.unitType, ds.unit)}</span>
                        <span className="text-[11px] font-semibold text-gray-600">
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="px-4 py-3 border-t border-[#E5E7EB]">
              <Link
                href="/data/market-dashboard"
                className="flex items-center gap-1.5 justify-center text-[12.5px] font-medium text-gray-900 border border-gray-900 px-5 py-2 w-full hover:bg-gray-100 transition-colors"
              >
                Market Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
