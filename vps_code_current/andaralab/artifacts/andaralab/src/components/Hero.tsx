import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/lib/locale";

const pillarsEn = [
  { text: "28+ Years of Data" },
  { text: "Macro & Sectoral Coverage" },
  { text: "Independent Research" },
];

const pillarsId = [
  { text: "28+ Tahun Data" },
  { text: "Cakupan Makro & Sektoral" },
  { text: "Riset Independen" },
];

export default function Hero() {
  const { locale, t } = useLocale();
  const pillars = locale === "id" ? pillarsId : pillarsEn;

  return (
    <section
      className="relative -mt-[5.5rem] pt-[5.5rem] min-h-screen flex items-center border-b border-[#F5F5F5]"
      style={{
        background: "url('/kota.jpg') center center / cover no-repeat",
      }}
    >
      {/* Dark overlay so white text is readable */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-32 pb-20 w-full">
        <div className="max-w-2xl">

          {/* Label */}
          <div className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-5">
            {t("independent_research_indonesia")}
          </div>

          {/* Headline */}
          <h1 className="text-[38px] md:text-[52px] font-bold text-white leading-[1.06] mb-6">
            {t("decoding_economies")}<br />
            {t("empowering_growth")}
          </h1>

          {/* Subheadline */}
          <p className="text-[16px] text-white/80 leading-relaxed mb-8 max-w-[580px]">
            {locale === "id"
              ? "Di AndaraLab, kami menjembatani kesenjangan antara pergeseran global yang kompleks dan peluang investasi lokal dengan mengubah data ekonomi mentah menjadi intelijen strategis presisi tinggi. Sebagai lengan riset khusus dari PT. Andara Investasi Cerdas, pendekatan 'laboratorium' kami menggabungkan pemodelan ekonometrik yang ketat dengan keahlian institusional yang mendalam untuk memastikan setiap wawasan didasarkan secara ilmiah dan dapat ditindaklanjuti secara praktis. Kami tidak hanya memantau pasar; kami menguraikan kekuatan yang mendasari ekonomi Indonesia untuk memenuhi janji inti kami yaitu 'Tumbuh' — memberdayakan mitra kami dengan kejelasan dan pandangan ke depan yang diperlukan untuk mencapai pertumbuhan berkelanjutan jangka panjang dalam lanskap keuangan yang terus berkembang."
              : "At AndaraLab, we bridge the gap between complex global shifts and local investment opportunities by transforming raw economic data into high-precision strategic intelligence. As the dedicated research arm of PT. Andara Investasi Cerdas, our 'laboratory' approach combines rigorous econometric modeling with deep institutional expertise to ensure every insight is both scientifically grounded and practically actionable. We don’t just track the market; we decode the underlying forces of the Indonesian economy to fulfill our core promise of 'Tumbuh' — empowering our partners with the clarity and foresight needed to achieve sustainable, long-term growth in an ever-evolving financial landscape."}
          </p>

          {/* Pillar strip */}
          <div className="flex flex-wrap gap-5 mb-10 pb-8 border-b border-white/20">
            {pillars.map((p) => (
              <div key={p.text} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                <span className="text-[13px] font-medium text-white/80">{p.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/analisis"
              className="inline-flex items-center gap-2 text-gray-900 text-[13px] font-semibold bg-white px-6 py-3 hover:bg-white/90 transition-colors"
            >
              {t("view_research_overview")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/macro/macro-outlooks"
              className="inline-flex items-center gap-2 text-white/80 text-[13px] font-medium hover:text-white transition-colors"
            >
              {t("macro_outlooks_label")}
            </Link>
            <Link
              href="/data"
              className="inline-flex items-center gap-2 text-white/60 text-[13px] font-medium hover:text-white transition-colors"
            >
              {t("data_hub_label")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
