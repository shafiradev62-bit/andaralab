// AnalysisPage.tsx — Public-facing descriptive analysis page
// Fetches from /api/analisis and renders sections + widgets

import { useEffect } from "react";
import { useLocale } from "@/lib/locale";
import {
  useAnalisisList,
} from "@/lib/cms-store";
import AnalysisWidgetRenderer from "@/components/AnalysisWidgets";
import { BarChart3, Loader2 } from "lucide-react";

export default function AnalysisPage() {
  const { locale, t } = useLocale();
  const { data: records = [], isLoading, isError } = useAnalisisList({ status: "active" });

  useEffect(() => {
    document.title = `${locale === "id" ? "Analisis" : "Analysis"} | AndaraLab`;
  }, [locale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-base">Loading analysis…</span>
      </div>
    );
  }

  if (isError || records.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {locale === "id" ? "Analisis Tidak Ditemukan" : "Analysis Not Found"}
        </h1>
        <p className="text-gray-500">
          {locale === "id"
            ? "Belum ada analisis aktif. Buka CMS Admin untuk menambahkan."
            : "No active analysis found. Open CMS Admin to add one."}
        </p>
      </div>
    );
  }

  // Pick first active record
  const record = records[0];

  // Pick localized title/description
  const title =
    locale === "en" && record.titleEn ? record.titleEn : record.title;
  const description =
    locale === "en" && record.descriptionEn
      ? record.descriptionEn
      : record.description;

  // Sort sections by order
  const sortedSections = [...(record.sections ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 mb-4">
          <BarChart3 className="w-3.5 h-3.5" />
          {locale === "id" ? "Analisis Deskriptif" : "Descriptive Analysis"}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        {description && (
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {sortedSections.map((section) => {
          const sectionTitle =
            locale === "en" && section.titleEn
              ? section.titleEn
              : section.title;
          const sectionDesc =
            locale === "en" && section.descriptionEn
              ? section.descriptionEn
              : section.description;

          return (
            <section
              key={section.id}
              className="scroll-mt-28"
            >
              {/* Section Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  {/* Section type badge */}
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide text-gray-500"
                  >
                    {section.sectionType.replace(/-/g, " ")}
                  </span>
                  {/* Order number */}
                  <span className="text-xs text-gray-300 font-mono">#{section.order}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {sectionTitle}
                </h2>
                {sectionDesc && (
                  <p className="text-sm text-gray-500">{sectionDesc}</p>
                )}
              </div>

              {/* Section Divider */}
              <div className="h-px bg-gray-100 mb-8" />

              {/* Widgets */}
              <div className="space-y-10">
                {(section.widgets ?? []).map((widget) => (
                  <div key={widget.id} className="relative">
                    {/* Widget Title + Subtitle */}
                    {(widget.title || widget.subtitle) && (
                      <div className="mb-4">
                        {widget.title && (
                          <h3 className="text-base font-semibold text-gray-800">
                            {widget.title}
                          </h3>
                        )}
                        {widget.subtitle && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {widget.subtitle}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Widget Content */}
                    <AnalysisWidgetRenderer widget={widget} />
                  </div>
                ))}

                {(section.widgets ?? []).length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    {locale === "id"
                      ? "Belum ada widget di section ini."
                      : "No widgets in this section yet."}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-16 pt-8 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {locale === "id"
            ? "Analisis dihasilkan oleh AndaraLab CMS. Data diperbarui secara berkala."
            : "Analysis generated by AndaraLab CMS. Data is updated periodically."}
          {" "}·{" "}
          <a
            href="/admin"
            className="underline hover:text-gray-900 transition-colors"
          >
            {locale === "id" ? "Kelola di CMS Admin →" : "Manage in CMS Admin →"}
          </a>
        </p>
      </div>
    </div>
  );
}
