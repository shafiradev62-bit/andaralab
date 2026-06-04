import { ArrowRight, Target, Eye, Zap } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/lib/locale";

export default function AboutPage() {
  const { t } = useLocale();

  const pillars = [
    { icon: Target, title: t("about_mission_title"), text: t("about_mission_text") },
    { icon: Eye,    title: t("about_vision_title"),  text: t("about_vision_text") },
    { icon: Zap,    title: t("about_approach_title"), text: t("about_approach_text") },
  ];

  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[720px]">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-4">
              {t("about_page_label")}
            </div>
            <h1 className="text-[38px] font-bold text-gray-900 leading-tight mb-6">
              {t("about_page_title")}
            </h1>
            <p className="text-[16px] text-gray-500 leading-relaxed mb-6">
              {t("about_page_body1")}
            </p>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              {t("about_page_body2")}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[22px] font-semibold text-gray-900 mb-10">
            {t("about_foundation")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((p) => (
              <div key={p.title} className="border border-[#E5E7EB] p-6">
                <div className="w-10 h-10 bg-[#f0f4f9] flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-3">
                  {p.title}
                </h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-4">
              {t("about_institutional_label")}
            </div>
            <h2 className="text-[26px] font-bold text-gray-900 leading-tight mb-5">
              {t("about_institutional_title")}
            </h2>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-4">
              {t("about_institutional_body1")}
            </p>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-6">
              {t("about_institutional_body2")}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white bg-gray-900 px-6 py-2.5 hover:bg-gray-700 transition-colors"
            >
              {t("get_in_touch")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-[280px] bg-[#f0f4f9] flex items-center justify-center border border-[#E5E7EB]">
            <div className="text-center px-8">
              <div className="text-[48px] font-bold text-gray-900 mb-2">2+</div>
              <div className="text-[13px] text-gray-500">{t("about_years_label")}</div>
              <div className="h-px bg-[#E5E7EB] my-4" />
              <div className="text-[48px] font-bold text-gray-900 mb-2">100+</div>
              <div className="text-[13px] text-gray-500">{t("about_data_points_label")}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
