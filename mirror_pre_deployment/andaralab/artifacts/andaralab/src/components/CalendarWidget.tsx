import { useState } from "react";
import { useCalendarEvents } from "@/lib/cms-store";
import { useLocale } from "@/lib/locale";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type Impact = "low" | "medium" | "high";
type Region = "all" | "major" | "america" | "europe" | "asia" | "africa";

// Country flags via emoji (fallback for CMS)
const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", JP: "🇯🇵",
  CN: "🇨🇳", AU: "🇦🇺", CA: "🇨🇦", CH: "🇨🇭", NZ: "🇳🇿",
  ID: "🇮🇩", KR: "🇰🇷", SG: "🇸🇬", MY: "🇲🇾", TH: "🇹🇭",
  IN: "🇮🇳", BR: "🇧🇷", MX: "🇲🇽", AR: "🇦🇷", ZA: "🇿🇦",
  EU: "🇪🇺", EM: "🌍", RU: "🇷🇺",
};

function getFlag(code: string): string {
  return COUNTRY_FLAGS[code.toUpperCase()] ?? "🌐";
}

const IMPACT_COLORS: Record<Impact, string> = {
  low: "bg-gray-300",
  medium: "bg-yellow-400",
  high: "bg-red-500",
};

const IMPACT_LABELS: Record<Impact, { en: string; id: string }> = {
  low: { en: "Low", id: "Rendah" },
  medium: { en: "Medium", id: "Sedang" },
  high: { en: "High", id: "Tinggi" },
};

const CATEGORY_LABELS: Record<string, { en: string; id: string }> = {
  "Interest Rate": { en: "Interest Rate", id: "Suku Bunga" },
  "Prices & Inflation": { en: "Prices & Inflation", id: "Harga & Inflasi" },
  "Labour Market": { en: "Labour Market", id: "Pasar Kerja" },
  "GDP Growth": { en: "GDP Growth", id: "Pertumbuhan PDB" },
  "Foreign Trade": { en: "Foreign Trade", id: "Perdagangan" },
  "Government": { en: "Government", id: "Pemerintah" },
  "Business Confidence": { en: "Business Confidence", id: "Kepercayaan Bisnis" },
  "Consumer Sentiment": { en: "Consumer Sentiment", id: "Sentimen Konsumen" },
  "Housing Market": { en: "Housing Market", id: "Properti" },
  "Bond Auctions": { en: "Bond Auctions", id: "Lelang Obligasi" },
  "Energy": { en: "Energy", id: "Energi" },
  "Holidays": { en: "Holidays", id: "Hari Libur" },
  "Earnings": { en: "Earnings", id: "Laba Perusahaan" },
};

const REGION_LABELS: Record<Region, { en: string; id: string }> = {
  all: { en: "All", id: "Semua" },
  major: { en: "Major", id: "Utama" },
  america: { en: "America", id: "Amerika" },
  europe: { en: "Europe", id: "Eropa" },
  asia: { en: "Asia", id: "Asia" },
  africa: { en: "Africa", id: "Afrika" },
};

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m ?? "00"} ${ampm}`;
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesId = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesId = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  if (locale === "id") {
    return `${dayNamesId[d.getDay()]} ${d.getDate()} ${monthNamesId[d.getMonth()]} ${d.getFullYear()}`;
  }
  return `${dayNamesEn[d.getDay()]} ${d.getDate()} ${monthNamesEn[d.getMonth()]} ${d.getFullYear()}`;
}

interface CalendarWidgetProps {
  title?: string;
  titleId?: string;
  subtitle?: string;
  subtitleId?: string;
  impactFilter?: string[];
  regionFilter?: string;
  categoryFilter?: string;
  defaultDays?: number;
  showTimezone?: boolean;
  showActual?: boolean;
  showPrevious?: boolean;
  showConsensus?: boolean;
  showForecast?: boolean;
}

export default function CalendarWidget({
  title = "Economic Calendar",
  titleId = "Kalender Ekonomi",
  subtitle,
  subtitleId,
  impactFilter = ["low", "medium", "high"],
  regionFilter = "all",
  categoryFilter = "all",
  defaultDays = 7,
  showTimezone = true,
  showActual = true,
  showPrevious = true,
  showConsensus = true,
  showForecast = true,
}: CalendarWidgetProps) {
  const { locale, t } = useLocale();
  const [activeImpacts, setActiveImpacts] = useState<Impact[]>(impactFilter as Impact[]);
  const [activeRegion, setActiveRegion] = useState<Region>(regionFilter as Region);
  const [activeCategory, setActiveCategory] = useState<string>(categoryFilter);
  const [showFilters, setShowFilters] = useState(false);

  // Compute start date (today)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const { data: events = [], isLoading } = useCalendarEvents({
    days: defaultDays,
    impact: activeImpacts,
    region: activeRegion,
    category: activeCategory !== "all" ? activeCategory : undefined,
  });

  // Filter locally for fine-grained control
  const filtered = events.filter((e) => {
    if (!activeImpacts.includes(e.impact as Impact)) return false;
    return true;
  });

  // Group events by date
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((event) => {
    const key = event.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  });

  const sortedDates = Object.keys(grouped).sort();

  const displayTitle = locale === "id" && titleId ? titleId : title;
  const displaySubtitle = locale === "id" && subtitleId ? subtitleId : subtitle;

  const toggleImpact = (impact: Impact) => {
    setActiveImpacts((prev) =>
      prev.includes(impact) ? prev.filter((i) => i !== impact) : [...prev, impact]
    );
  };

  return (
    <section className="w-full bg-white border border-[#E5E7EB]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900">{displayTitle}</h2>
          {displaySubtitle && (
            <p className="text-[12px] text-gray-500 mt-0.5">{displaySubtitle}</p>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 border transition-colors ${
            showFilters
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-300 text-gray-700 hover:border-gray-500"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {locale === "id" ? "Filter" : "Filter"}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="border-b border-[#E5E7EB] px-5 py-3 bg-gray-50">
          {/* Impact filters */}
          <div className="mb-3">
            <div className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {locale === "id" ? "Dampak" : "Impact"}
            </div>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as Impact[]).map((impact) => (
                <button
                  key={impact}
                  onClick={() => toggleImpact(impact)}
                  className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 border transition-colors ${
                    activeImpacts.includes(impact)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-gray-600 hover:border-gray-500 bg-white"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${IMPACT_COLORS[impact]}`} />
                  {locale === "id" ? IMPACT_LABELS[impact].id : IMPACT_LABELS[impact].en}
                </button>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div className="mb-3">
            <div className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Globe className="w-3 h-3 inline mr-1" />
              {locale === "id" ? "Wilayah" : "Region"}
            </div>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(REGION_LABELS) as Region[]).map((region) => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`text-[11.5px] font-medium px-2.5 py-1 border transition-colors ${
                    activeRegion === region
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-gray-600 hover:border-gray-500 bg-white"
                  }`}
                >
                  {locale === "id" ? REGION_LABELS[region].id : REGION_LABELS[region].en}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <div className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {locale === "id" ? "Kategori" : "Category"}
            </div>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="text-[12.5px] border border-gray-300 px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:border-gray-900"
            >
              <option value="all">{locale === "id" ? "Semua Peristiwa" : "All Events"}</option>
              {Object.keys(CATEGORY_LABELS).map((cat) => (
                <option key={cat} value={cat}>
                  {locale === "id" ? CATEGORY_LABELS[cat].id : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Timezone bar */}
      {showTimezone && (
        <div className="border-b border-[#E5E7EB] px-5 py-2 flex items-center gap-2 text-[11px] text-gray-500">
          <Clock className="w-3 h-3" />
          <span>UTC{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          <span className="ml-auto font-medium text-gray-700">
            {new Date().toLocaleTimeString(locale === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
          </span>
        </div>
      )}

      {/* Table header */}
      <div className="grid grid-cols-[80px_60px_1fr_80px_80px_80px_80px] px-5 py-2 bg-gray-50 border-b border-[#E5E7EB] text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide">
        <div>{locale === "id" ? "Waktu" : "Time"}</div>
        <div>{locale === "id" ? "Negara" : "Country"}</div>
        <div>{locale === "id" ? "Peristiwa" : "Event"}</div>
        {showActual && <div className="text-right">{locale === "id" ? "Aktual" : "Actual"}</div>}
        {showPrevious && <div className="text-right">{locale === "id" ? "Sebelumnya" : "Previous"}</div>}
        {showConsensus && <div className="text-right">{locale === "id" ? "Konsensus" : "Consensus"}</div>}
        {showForecast && <div className="text-right">{locale === "id" ? "Forecast" : "Forecast"}</div>}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="px-5 py-10 text-center text-[13px] text-gray-400">
          {locale === "id" ? "Memuat..." : "Loading..."}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedDates.length === 0 && (
        <div className="px-5 py-10 text-center text-[13px] text-gray-400">
          {locale === "id" ? "Tidak ada peristiwa dalam filter ini" : "No events for this filter"}
        </div>
      )}

      {/* Events table */}
      {!isLoading && sortedDates.map((dateStr) => {
        const dayEvents = grouped[dateStr];
        return (
          <div key={dateStr}>
            {/* Date header */}
            <div className="px-5 py-2 bg-gray-50 border-b border-[#E5E7EB]">
              <span className="text-[12px] font-bold text-gray-700">
                {formatDate(dateStr, locale)}
              </span>
            </div>

            {/* Rows */}
            {dayEvents.map((event, ri) => (
              <div
                key={event.id}
                className={`grid grid-cols-[80px_60px_1fr_80px_80px_80px_80px] px-5 py-2.5 border-b border-[#F3F4F6] hover:bg-gray-50 transition-colors text-[12.5px] ${
                  ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                {/* Time */}
                <div className="flex items-center gap-1.5 text-[11.5px] text-gray-500 font-medium pt-0.5">
                  {event.time ? formatTime(event.time) : "—"}
                </div>

                {/* Country */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[14px]" title={event.countryLabel}>{getFlag(event.countryCode)}</span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-700">{event.countryCode}</span>
                  </div>
                </div>

                {/* Event name + impact */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px] ${IMPACT_COLORS[event.impact as Impact]}`} />
                  <div>
                    <div className="text-[12.5px] text-gray-900 font-medium leading-snug">
                      {locale === "id" && event.eventNameId ? event.eventNameId : event.eventName}
                    </div>
                    {event.category && (
                      <div className="text-[10.5px] text-gray-400 mt-0.5">
                        {locale === "id" && CATEGORY_LABELS[event.category]
                          ? CATEGORY_LABELS[event.category].id
                          : event.category}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actual */}
                {showActual && (
                  <div className={`text-right font-medium pt-0.5 ${event.actual ? "text-gray-900" : "text-gray-300"}`}>
                    {event.actual ?? "—"}
                  </div>
                )}
                {/* Previous */}
                {showPrevious && (
                  <div className={`text-right pt-0.5 ${event.previous ? "text-gray-600" : "text-gray-300"}`}>
                    {event.previous ?? "—"}
                  </div>
                )}
                {/* Consensus */}
                {showConsensus && (
                  <div className={`text-right pt-0.5 ${event.consensus ? "text-gray-600" : "text-gray-300"}`}>
                    {event.consensus ?? "—"}
                  </div>
                )}
                {/* Forecast */}
                {showForecast && (
                  <div className={`text-right pt-0.5 ${event.forecast ? "text-gray-600" : "text-gray-300"}`}>
                    {event.forecast ?? "—"}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* Footer note */}
      <div className="px-5 py-3 text-[10.5px] text-gray-400 border-t border-[#E5E7EB] flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full bg-gray-300`} />
        <span>{locale === "id" ? "Rendah" : "Low"}</span>
        <span className={`w-1.5 h-1.5 rounded-full bg-yellow-400 ml-2`} />
        <span>{locale === "id" ? "Sedang" : "Medium"}</span>
        <span className={`w-1.5 h-1.5 rounded-full bg-red-500 ml-2`} />
        <span>{locale === "id" ? "Tinggi" : "High"}</span>
        <span className="ml-auto">{filtered.length} {locale === "id" ? "peristiwa" : "events"}</span>
      </div>
    </section>
  );
}