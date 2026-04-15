import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "wouter";
import { useDatasets, useExchangeRates } from "../lib/cms-store";
import { useLocale } from "@/lib/locale";

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 60;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Extract numeric values from a dataset's rows for sparkline
function extractSparkValues(rows: Record<string, string | number>[], valueKey: string): number[] {
  return rows
    .map((r) => {
      const v = r[valueKey];
      return typeof v === "number" ? v : parseFloat(String(v));
    })
    .filter((v) => !isNaN(v));
}

// Get last value and change from spark data
function getLastAndChange(spark: number[]): { value: string; change: string; up: boolean | null } {
  if (spark.length === 0) return { value: "—", change: "—", up: null };
  const last = spark[spark.length - 1];
  const prev = spark.length > 1 ? spark[spark.length - 2] : last;
  const diff = last - prev;
  const up = diff > 0.001 ? true : diff < -0.001 ? false : null;
  const changeStr = diff === 0 ? "0.00" : (diff > 0 ? "+" : "") + diff.toFixed(2);
  return { value: last.toLocaleString(), change: changeStr, up };
}

export default function KeyMetrics() {
  const { locale, t } = useLocale();
  const { data: datasets = [], isLoading: isDatasetsLoading } = useDatasets();
  const { data: exchangeRates = [], isLoading: isRatesLoading } = useExchangeRates();
  const isLoading = isDatasetsLoading || isRatesLoading;

  // Map dataset IDs to metric config
  const metricConfigs = [
    { id: "gdp-growth",     labelKey: "gdp_growth",     valueKey: "GDP Growth",  unit: "%", color: "#1a3a5c", href: "/macro/macro-outlooks",   suffix: "%" },
    { id: "inflation-rate", labelKey: "inflation_cpi", valueKey: "Inflation",   unit: "%", color: "#6B7280", href: "/macro/policy-monetary",  suffix: "%" },
  ];

  const dynamicMetricsFromDatasets = metricConfigs.map((cfg) => {
    const ds = datasets.find((d) => d.id === cfg.id);
    if (!ds) return null;
    const spark = extractSparkValues(ds.rows, cfg.valueKey);
    const { value, change, up } = getLastAndChange(spark);
    const sub = ds.rows.length > 0 ? String(ds.rows[ds.rows.length - 1][ds.columns[0]] ?? "") : "";
    return {
      label: t(cfg.labelKey as any),
      value: value + cfg.suffix,
      sub,
      change: change + (cfg.suffix === "%" ? "pp" : ""),
      up,
      href: cfg.href,
      sparkColor: cfg.color,
      spark,
    };
  }).filter(Boolean);

  // Dynamic metrics from Exchange Rates API
  const idrUsdRate = exchangeRates.find(r => r.id === "idr-usd");
  const biRateLine = exchangeRates.find(r => r.id === "bi-rate");

  const exchangeMetrics = [
    {
      label: t("idr_usd_label"),
      value: idrUsdRate?.value || "—",
      sub: t("spot_rate"),
      change: idrUsdRate?.change || "—",
      up: idrUsdRate?.up ?? null,
      href: "/data/market-dashboard",
      sparkColor: "#9CA3AF",
      spark: [15620, 15680, 15721, 16100, 16015, 16373, 16200, 17094],
    },
    {
      label: t("bi_rate_label"),
      value: biRateLine?.value || "6.00%",
      sub: t("unchanged"),
      change: biRateLine?.change || "0.00pp",
      up: biRateLine?.up ?? null,
      href: "/macro/policy-monetary",
      sparkColor: "#9CA3AF",
      spark: [5.75, 5.75, 5.75, 6.0, 6.0, 6.25, 6.25, 6.0],
    }
  ];

  const tradeBalance = {
    label: t("trade_balance"),
    value: "+$2.3B",
    sub: locale === "id" ? "Jun 2024" : "Jun 2024",
    change: "-0.3B",
    up: false as false,
    href: "/sectoral/deep-dives",
    sparkColor: "#9CA3AF",
    spark: [2.4, 1.5, 2.6, 2.6, 2.6, 2.3, 2.1, 2.3],
  };

  // Merge: dynamic metrics first, then exchange ones, then trade balance
  const metrics = [...dynamicMetricsFromDatasets, ...exchangeMetrics, tradeBalance].slice(0, 5);


  return (
    <section className="border-b border-[#E5E7EB] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-0">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-[#F3F4F6]">
          {metrics.map((m, i) => (
            <Link
              key={i}
              href={m.href}
              className="px-4 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5 truncate">
                  {m.label}
                </div>
                <div className="text-[18px] font-bold text-gray-900 leading-tight">{m.value}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  {m.up === null ? (
                    <Minus className="w-3 h-3 text-gray-400" />
                  ) : (
                    <Minus className="w-3 h-3 text-gray-400" />
                  )}
                  <span className="text-[10.5px] font-semibold text-gray-600">
                    {m.change}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate">{m.sub}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <MiniSparkline data={m.spark} color={m.sparkColor} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
