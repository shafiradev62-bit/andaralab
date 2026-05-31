import { useLocale } from "@/lib/locale";
import { useExchangeRates } from "@/lib/cms-store";

// Default fallback tickers if API is unavailable
const FALLBACK_TICKERS_EN = [
  { symbol: "IDR/USD", value: "17,100", change: "-0.04%", up: false },
  { symbol: "JCI", value: "7,456", change: "-0.04%", up: false },
  { symbol: "BI Rate", value: "6.00%", change: "Unch", up: null },
  { symbol: "US 10Y", value: "4.28%", change: "-0.05%", up: true },
  { symbol: "Gold", value: "$4,755", change: "-0.67%", up: false },
  { symbol: "Brent", value: "$68.5", change: "-0.52%", up: false },
  { symbol: "EUR/USD", value: "1.1700", change: "-0.26%", up: false },
  { symbol: "DXY", value: "102.45", change: "-0.22%", up: false },
  { symbol: "S&P 500", value: "6,817", change: "-0.11%", up: false },
  { symbol: "Shanghai", value: "3,285", change: "+0.38%", up: true },
  { symbol: "Nikkei", value: "41,250", change: "+1.12%", up: true },
  { symbol: "CPI ID", value: "2.51%", change: "-0.33pp", up: true },
];

export default function MarketTicker({ dark = false }: { dark?: boolean }) {
  const { locale, t } = useLocale();
  const { data: exchangeRates = [] } = useExchangeRates();

  // Use CMS data if available, otherwise fall back
  const tickers = exchangeRates.length > 0
    ? exchangeRates
        .filter((er) => er.enabled)
        .map((er) => ({
          symbol: locale === "id" && er.labelId ? er.labelId : (er.labelEn ?? er.label),
          value: er.value,
          change: er.change,
          up: er.up,
        }))
    : FALLBACK_TICKERS_EN;

  const double = [...tickers, ...tickers];

  return (
    <div className={`relative h-8 flex items-center ${dark ? "bg-black/50 border-b border-white/10" : "bg-[#F9FAFB] border-b border-[#E5E7EB]"}`}>
      <div className={`flex-shrink-0 flex items-center gap-2 px-3 border-r h-full z-10 ${dark ? "border-white/10" : "border-[#E5E7EB]"} ${dark ? "bg-transparent" : "bg-[#F9FAFB]"}`}>
        <span className={`live-dot w-1.5 h-1.5 rounded-full inline-block ${dark ? "bg-green-400" : "bg-gray-400"}`} />
        <span className={`text-[10.5px] font-semibold uppercase tracking-widest ${dark ? "text-white/60" : "text-gray-400"}`}>{t("live_label")}</span>
      </div>
      {/* Clipping wrapper — overflow hidden so ticker items outside viewport are clipped */}
      <div className="flex-1 overflow-hidden">
        {/* ticker-track = all items (duplicated for seamless loop) */}
        <div className="ticker-track">
          {double.map((ticker, i) => (
            <div key={i} className={`flex items-center gap-2 px-5 border-r h-8 flex-shrink-0 ${dark ? "border-white/10" : "border-[#F3F4F6]"}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${dark ? "text-white/50" : "text-gray-400"}`}>
                {ticker.symbol}
              </span>
              <span className={`text-[11.5px] font-semibold whitespace-nowrap ${dark ? "text-white" : "text-gray-900"}`}>{ticker.value}</span>
              <span
                className={`text-[10.5px] font-semibold whitespace-nowrap ${
                  ticker.up === null ? (dark ? "text-white/40" : "text-gray-400") : (dark ? (ticker.up ? "text-green-400" : "text-red-400") : "text-gray-600")
                }`}
              >
                {ticker.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
