import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/lib/locale";

export default function AboutSection() {
  const { t } = useLocale();

  const pillars = [
    { num: "01", title: t("about_pillar_rigor_title"), desc: t("about_pillar_rigor_desc") },
    { num: "02", title: t("about_pillar_relevance_title"), desc: t("about_pillar_relevance_desc") },
    { num: "03", title: t("about_pillar_clarity_title"), desc: t("about_pillar_clarity_desc") },
  ];

  const stats = [
    { value: "100+", label: t("stat_indicators") },
    { value: "15+", label: t("stat_economies") },
    { value: "5+", label: t("stat_verticals") },
    { value: "2019", label: t("stat_founded") },
  ];

  return (
    <section className="border-t border-[#E5E7EB] bg-white">
      {/* Stats bar */}
      <div className="border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E5E7EB]">
            {stats.map((s, i) => (
              <div key={i} className="px-6 py-6 text-center">
                <div className="text-[32px] font-bold text-gray-900 leading-none">{s.value}</div>
                <div className="text-[12px] text-gray-400 mt-1.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
              {t("about_andaralab")}
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 leading-tight mb-5">
              {t("about_lab_headline")}<br />{t("about_lab_headline2")}
            </h2>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-7">
              {t("about_lab_body")}
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[13.5px] font-medium text-gray-900 border border-gray-900 px-6 py-2.5 hover:bg-gray-100 transition-colors"
              >
                {t("about_us")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-[13.5px] font-medium text-gray-700 border border-[#D1D5DB] px-6 py-2.5 hover:border-gray-400 transition-colors"
              >
                {t("contact_label")}
              </Link>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
              {t("our_approach")}
            </div>
            <div className="space-y-0 border border-[#E5E7EB]">
              {pillars.map((p, i) => (
                <div key={p.num} className={`flex gap-4 p-5 ${i < pillars.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
                  <div className="text-[11px] font-bold text-gray-300 w-6 flex-shrink-0 mt-0.5">{p.num}</div>
                  <div>
                    <div className="text-[14px] font-semibold text-gray-900 mb-1">{p.title}</div>
                    <div className="text-[13px] text-gray-500 leading-relaxed">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
