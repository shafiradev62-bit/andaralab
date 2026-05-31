// MacroPage.tsx — Dedicated Macro Foundations landing page
// Beautiful interface with sub-section navigation and CMS-driven content

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, TrendingUp, Globe, Landmark, BarChart3, ChevronRight, Clock, Tag, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { usePages, usePosts } from "@/lib/cms-store";
import { RESEARCH_TAG_PILL } from "@/lib/research-tag-styles";
import { applyDocumentSeo } from "@/lib/document-meta";
import DynamicPage from "@/pages/DynamicPage";

// ─── Sub-section config ────────────────────────────────────────────────────────

const MACRO_SECTIONS = [
  {
    id: "macro-outlooks",
    slug: "/macro/macro-outlooks",
    icon: TrendingUp,
    labelEn: "Macro Outlooks",
    labelId: "Prospek Makro",
    descEn: "Forward-looking analysis of Indonesia's macroeconomic trajectory, GDP growth, and structural shifts.",
    descId: "Analisis prospektif tentang lintasan makroekonomi Indonesia, pertumbuhan PDB, dan perubahan struktural.",
    color: "bg-[#00205B]",
    accent: "border-[#00205B]",
  },
  {
    id: "policy-monetary",
    slug: "/macro/policy-monetary",
    icon: Landmark,
    labelEn: "Policy & Monetary Watch",
    labelId: "Kebijakan & Moneter",
    descEn: "Central bank decisions, fiscal policy shifts, and their downstream effects on markets and growth.",
    descId: "Keputusan bank sentral, perubahan kebijakan fiskal, dan dampaknya terhadap pasar dan pertumbuhan.",
    color: "bg-[#1a3a5c]",
    accent: "border-[#1a3a5c]",
  },
  {
    id: "geopolitical",
    slug: "/macro/geopolitical",
    icon: Globe,
    labelEn: "Geopolitical & Structural Analysis",
    labelId: "Analisis Geopolitik & Struktural",
    descEn: "How global power dynamics, trade realignments, and structural forces shape Indonesia's economic outlook.",
    descId: "Bagaimana dinamika kekuatan global, realignment perdagangan, dan kekuatan struktural membentuk prospek ekonomi Indonesia.",
    color: "bg-[#0d9fbf]",
    accent: "border-[#0d9fbf]",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── Sub-section card ─────────────────────────────────────────────────────────

function SectionCard({
  section,
  active,
  onClick,
  locale,
}: {
  section: typeof MACRO_SECTIONS[0];
  active: boolean;
  onClick: () => void;
  locale: "en" | "id";
}) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border transition-all duration-200 p-5 group ${
        active
          ? `border-l-4 ${section.accent} border-t border-r border-b border-[#E5E7EB] bg-white shadow-sm`
          : "border border-[#E5E7EB] bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${section.color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[13.5px] font-semibold leading-snug ${active ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"}`}>
              {locale === "id" ? section.labelId : section.labelEn}
            </span>
            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${active ? "text-gray-900 translate-x-0.5" : "text-gray-300 group-hover:text-gray-500"}`} />
          </div>
          <p className="text-[12px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
            {locale === "id" ? section.descId : section.descEn}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Recent posts sidebar ─────────────────────────────────────────────────────

function RecentPostsSidebar({ activeSection, locale }: { activeSection: string; locale: "en" | "id" }) {
  const { data: allPosts = [], isLoading } = usePosts({ status: "published" });

  const sectionConfig = MACRO_SECTIONS.find((s) => s.id === activeSection);
  const label = sectionConfig ? (locale === "id" ? sectionConfig.labelId : sectionConfig.labelEn) : "";

  const posts = allPosts
    .filter((p) => {
      const cat = (p.category || "").toLowerCase();
      const tag = (p.tag || "").toLowerCase();
      const sub = (p.subcategory || "").toLowerCase();
      const search = label.toLowerCase();
      return cat.includes(search.split(" ")[0]) || tag.includes(search.split(" ")[0]) || sub.includes(search.split(" ")[0]);
    })
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
    .slice(0, 4);

  if (isLoading) return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
      ))}
    </div>
  );

  if (!posts.length) return (
    <div className="text-[12.5px] text-gray-400 py-4 text-center">
      {locale === "id" ? "Belum ada artikel." : "No articles yet."}
    </div>
  );

  return (
    <div className="space-y-0 border border-[#E5E7EB]">
      {posts.map((post, i) => (
        <Link
          key={post.id}
          href={`/article/${post.slug.replace(/^\//, "")}`}
          className={`block p-4 hover:bg-gray-50 transition-colors group ${i < posts.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {post.tag && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 uppercase tracking-wide ${RESEARCH_TAG_PILL}`}>
                {post.tag}
              </span>
            )}
            <span className="text-[10.5px] text-gray-400">{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>
          <p className="text-[12.5px] font-medium text-gray-800 leading-snug group-hover:text-gray-900 line-clamp-2">
            {post.title}
          </p>
          {post.readTime && (
            <span className="flex items-center gap-1 text-[10.5px] text-gray-400 mt-1.5">
              <Clock className="w-3 h-3" /> {post.readTime}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MacroPage() {
  const { locale, t } = useLocale();
  const [location] = useLocation();

  // Determine active section from URL
  const getActiveFromPath = (path: string) => {
    if (path.includes("policy-monetary")) return "policy-monetary";
    if (path.includes("geopolitical")) return "geopolitical";
    return "macro-outlooks";
  };

  const [activeSection, setActiveSection] = useState(() => getActiveFromPath(location));

  // Sync active section when URL changes
  useEffect(() => {
    setActiveSection(getActiveFromPath(location));
  }, [location]);

  useEffect(() => {
    applyDocumentSeo({
      title: `${locale === "id" ? "Fondasi Makro" : "Macro Foundations"} | AndaraLab`,
      description:
        locale === "id"
          ? "Analisis makroekonomi mendalam untuk Indonesia dan pasar berkembang."
          : "In-depth macroeconomic analysis for Indonesia and emerging markets.",
      pathname: "/macro",
    });
  }, [locale]);

  const activeSectionConfig = MACRO_SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="bg-white">
      {/* ── Page header ── */}
      <div className="border-b border-[#E5E7EB] bg-[#00205B]">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-white/60" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                  {locale === "id" ? "Fondasi Makro" : "Macro Foundations"}
                </span>
              </div>
              <h1 className="text-[34px] font-bold text-white leading-tight mb-3">
                {locale === "id"
                  ? "Analisis Makroekonomi\nIndonesia & Global"
                  : "Macroeconomic Analysis\nfor Indonesia & Beyond"}
              </h1>
              <p className="text-[14.5px] text-white/70 leading-relaxed max-w-[560px]">
                {locale === "id"
                  ? "Riset makro independen yang mencakup prospek pertumbuhan, kebijakan moneter, dan dinamika geopolitik yang membentuk lanskap ekonomi Indonesia."
                  : "Independent macro research covering growth outlooks, monetary policy, and geopolitical dynamics shaping Indonesia's economic landscape."}
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2 flex-shrink-0">
              <Link
                href="/data"
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/80 hover:text-white border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors"
              >
                {locale === "id" ? "Pusat Data" : "Data Hub"} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Left sidebar: section navigation ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-[5.5rem]">
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
                {locale === "id" ? "Pilih Topik" : "Research Areas"}
              </div>
              <div className="space-y-2">
                {MACRO_SECTIONS.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    active={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    locale={locale}
                  />
                ))}
              </div>

              {/* Recent articles sidebar */}
              <div className="mt-8">
                <div className="text-[10.5px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
                  {locale === "id" ? "Artikel Terbaru" : "Recent Articles"}
                </div>
                <RecentPostsSidebar activeSection={activeSection} locale={locale} />
              </div>
            </div>
          </div>

          {/* ── Right: CMS content for active section ── */}
          <div className="lg:col-span-3">
            {/* Section title bar */}
            <div className={`border-l-4 ${activeSectionConfig.accent} pl-4 mb-6`}>
              <div className="flex items-center gap-2 mb-1">
                {(() => { const Icon = activeSectionConfig.icon; return <Icon className="w-4 h-4 text-gray-500" />; })()}
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {locale === "id" ? activeSectionConfig.labelId : activeSectionConfig.labelEn}
                </span>
              </div>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {locale === "id" ? activeSectionConfig.descId : activeSectionConfig.descEn}
              </p>
            </div>

            {/* CMS page content */}
            <div className="min-h-[400px]">
              <DynamicPage
                key={`${activeSection}-${locale}`}
                pageSlug={activeSectionConfig.slug}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
