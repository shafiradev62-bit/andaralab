import { ArrowRight, Clock, Tag, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { usePosts } from "@/lib/cms-store";
import { useLocale } from "@/lib/locale";
import { RESEARCH_TAG_PILL } from "@/lib/research-tag-styles";

function formatDate(dateStr?: string, locale?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

function SectionPageLayout({
  sectionEn,
  sectionId,
  breadcrumbEn,
  breadcrumbId,
  breadcrumbHref,
  descriptionEn,
  descriptionId,
  category,
  subcategory,
}: {
  sectionEn: string;
  sectionId: string;
  breadcrumbEn: string;
  breadcrumbId: string;
  breadcrumbHref: string;
  descriptionEn: string;
  descriptionId: string;
  category: string | string[];
  subcategory?: string | string[];
}) {
  const { locale, t } = useLocale();
  const categories = Array.isArray(category) ? category : [category];
  const subcategories = subcategory ? (Array.isArray(subcategory) ? subcategory : [subcategory]) : null;

  const { data: allPosts = [], isLoading } = usePosts({ status: "published" });

  const posts = allPosts
    .filter((p) => {
      // Strict locale match — no cross-locale fallback
      // Exception: if no posts exist for the active locale, show nothing (not fallback)
      const matchLocale = p.locale === locale;
      if (!matchLocale) return false;

      if (categories.includes("__all__")) return true;

      const postCat = (p.category || "").toLowerCase();
      const postSub = (p.subcategory || "").toLowerCase();
      const postTag = (p.tag || "").toLowerCase();
      const postFields = [postCat, postSub, postTag].filter(Boolean);
      const postWords = new Set(
        postFields.flatMap(f => f.split(/[\s\-&,]+/).filter(w => w.length > 2))
      );

      let matchesCat = false;
      for (const filterCat of categories) {
        const fc = filterCat.toLowerCase();
        if (postCat === fc) { matchesCat = true; break; }
        for (const field of postFields) {
          if (field === fc || field.includes(fc) || (fc.includes(field) && field.length > 2)) {
            matchesCat = true; break;
          }
        }
        if (matchesCat) break;
        const filterWords = fc.split(/[\s\-&,]+/).filter(w => w.length > 2);
        for (const fw of filterWords) {
          if (postWords.has(fw)) { matchesCat = true; break; }
          for (const field of postFields) {
            if (field.includes(fw)) { matchesCat = true; break; }
          }
          if (matchesCat) break;
        }
        if (matchesCat) break;
      }

      if (!matchesCat) return false;

      if (!subcategories) return true;
      for (const subFilter of subcategories) {
        const sf = subFilter.toLowerCase();
        for (const field of postFields) {
          if (field === sf || field.includes(sf) || (sf.includes(field) && field.length > 2)) return true;
        }
        const subFilterWords = sf.split(/[\s\-&,]+/).filter(w => w.length > 2);
        for (const sw of subFilterWords) {
          if (postWords.has(sw)) return true;
          for (const field of postFields) {
            if (field.includes(sw)) return true;
          }
        }
      }
      return false;
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() -
        new Date(a.publishedAt || a.createdAt).getTime()
    );

  const section = locale === "id" ? sectionId : sectionEn;
  const breadcrumb = locale === "id" ? breadcrumbId : breadcrumbEn;
  const description = locale === "id" ? descriptionId : descriptionEn;

  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-700 transition-colors">{locale === "id" ? "Beranda" : "Home"}</Link>
            <span>/</span>
            <span className="text-gray-600">{breadcrumb}</span>
          </div>
          <h1 className="text-[34px] font-bold text-gray-900 mb-3">{section}</h1>
          <p className="text-[14.5px] text-gray-500 max-w-[560px]">{description}</p>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-10">
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[13.5px]">{t("loading_articles")}</span>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-[14px] mb-2">{t("no_articles_match")}</p>
            <Link href="/admin" className="text-[13px] text-gray-900 hover:underline">
              {t("add_in_cms")} →
            </Link>
          </div>
        )}

        {!isLoading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <Link
                key={post.id}
                href={`/article/${post.slug.replace(/^\//, "")}`}
                className={`border border-[#E5E7EB] hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group ${i === 0 ? "md:col-span-2" : ""}`}
              >
                {post.image && i === 0 && (
                  <div className="h-[220px] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {post.tag && (
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 ${RESEARCH_TAG_PILL}`}>
                        <Tag className="w-3 h-3" />{post.tag}
                      </span>
                    )}
                    {post.readTime && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />{post.readTime} {t("min_read")}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">{formatDate(post.publishedAt || post.createdAt, locale)}</span>
                  </div>
                  <h2 className={`font-semibold text-gray-900 mb-2 leading-snug group-hover:text-gray-900 transition-colors ${i === 0 ? "text-[20px]" : "text-[15px]"}`}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-[13px] text-gray-500 leading-relaxed mb-4">{post.excerpt}</p>
                  )}
                  <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {t("read_more_label")} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function MacroOutlooksPage() {
  return <SectionPageLayout
    sectionEn="Macro Outlooks"
    sectionId="Prospek Makro"
    breadcrumbEn="Macro Foundations"
    breadcrumbId="Fondasi Makro"
    breadcrumbHref="/macro/macro-outlooks"
    descriptionEn="In-depth analysis of Indonesia's macroeconomic trends, growth drivers, and risks."
    descriptionId="Analisis mendalam tren makroekonomi Indonesia, pendorong pertumbuhan, dan risiko."
    category={["Macro Foundations", "macro-outlooks", "Macro Outlooks", "macro", "outlooks"]}
    subcategory={["Macro Outlooks", "macro-outlooks", "outlooks"]}
  />;
}

export function PolicyMonetaryPage() {
  return <SectionPageLayout
    sectionEn="Policy & Monetary Watch"
    sectionId="Kebijakan & Moneter"
    breadcrumbEn="Macro Foundations"
    breadcrumbId="Fondasi Makro"
    breadcrumbHref="/macro/macro-outlooks"
    descriptionEn="Tracking Bank Indonesia policy, monetary conditions, and fiscal developments."
    descriptionId="Memantau kebijakan Bank Indonesia, kondisi moneter, dan perkembangan fiskal."
    category={["Macro Foundations", "policy-monetary", "Policy & Monetary Watch", "monetary", "policy"]}
    subcategory={["Policy & Monetary Watch", "policy-monetary", "monetary", "policy"]}
  />;
}

export function GeopoliticalPage() {
  return <SectionPageLayout
    sectionEn="Geopolitical & Structural Analysis"
    sectionId="Analisis Geopolitik & Struktural"
    breadcrumbEn="Macro Foundations"
    breadcrumbId="Fondasi Makro"
    breadcrumbHref="/macro/macro-outlooks"
    descriptionEn="Analyzing geopolitical dynamics and structural shifts affecting Indonesia and the region."
    descriptionId="Menganalisis dinamika geopolitik dan perubahan struktural yang mempengaruhi Indonesia dan kawasan."
    category={["Macro Foundations", "geopolitical", "Geopolitical", "Geopolitical & Structural Analysis", "structural"]}
    subcategory={["Geopolitical & Structural Analysis", "geopolitical", "structural"]}
  />;
}

export function DeepDivesPage() {
  return <SectionPageLayout
    sectionEn="Strategic Industry Deep-dives"
    sectionId="Analisis Mendalam Industri Strategis"
    breadcrumbEn="Sectoral Intelligence"
    breadcrumbId="Intelijen Sektoral"
    breadcrumbHref="/sectoral/deep-dives"
    descriptionEn="Rigorous sector-level analysis of Indonesia's key industries and their strategic outlook."
    descriptionId="Analisis mendalam tingkat sektor atas industri-industri kunci Indonesia dan prospek strategisnya."
    category={["Sectoral Intelligence", "sectoral-analysis", "deep-dives", "sectoral", "Strategic Industry Deep-dives", "industry"]}
    subcategory={["Strategic Industry Deep-dives", "deep-dives", "industry", "sectoral"]}
  />;
}

export function RegionalPage() {
  return <SectionPageLayout
    sectionEn="Regional Economic Monitor"
    sectionId="Monitor Ekonomi Regional"
    breadcrumbEn="Sectoral Intelligence"
    breadcrumbId="Intelijen Sektoral"
    breadcrumbHref="/sectoral/deep-dives"
    descriptionEn="Monitoring regional economic performance across Java, Sumatra, Kalimantan, and beyond."
    descriptionId="Memantau kinerja ekonomi regional di Jawa, Sumatra, Kalimantan, dan wilayah lainnya."
    category={["Sectoral Intelligence", "regional", "Regional Economic Monitor", "Regional Monitor"]}
    subcategory={["Regional Economic Monitor", "regional", "Regional Monitor"]}
  />;
}

export function ESGPage() {
  return <SectionPageLayout
    sectionEn="ESG"
    sectionId="ESG"
    breadcrumbEn="Sectoral Intelligence"
    breadcrumbId="Intelijen Sektoral"
    breadcrumbHref="/sectoral/deep-dives"
    descriptionEn="Environmental, social, and governance analysis for Indonesian corporations and investors."
    descriptionId="Analisis lingkungan, sosial, dan tata kelola untuk korporasi dan investor Indonesia."
    category={["Sectoral Intelligence", "esg", "ESG", "environmental", "governance"]}
    subcategory={["ESG", "esg", "environmental", "governance"]}
  />;
}

export function BlogPage({ sub }: { sub?: "economics-101" | "market-pulse" | "lab-notes" }) {
  if (!sub) {
    return <SectionPageLayout
      sectionEn="All Insights"
      sectionId="Semua Wawasan"
      breadcrumbEn="Blog"
      breadcrumbId="Blog"
      breadcrumbHref="/blog"
      descriptionEn="All published research, market commentary, and analysis."
      descriptionId="Semua riset, komentar pasar, dan analisis yang telah dipublikasikan."
      category="__all__"
    />;
  }

  const configs: Record<string, {
    sectionEn: string; sectionId: string;
    descriptionEn: string; descriptionId: string;
    cats: string[];
  }> = {
    "economics-101": {
      sectionEn: "Economics 101",
      sectionId: "Ekonomi 101",
      descriptionEn: "Foundational economic concepts explained through the lens of Indonesia's economy.",
      descriptionId: "Konsep ekonomi dasar yang dijelaskan melalui lensa ekonomi Indonesia.",
      cats: ["economics-101", "Economics 101", "economics"],
    },
    "market-pulse": {
      sectionEn: "Market Pulse",
      sectionId: "Pulsa Pasar",
      descriptionEn: "Real-time market commentary, price action analysis, and short-term economic signals.",
      descriptionId: "Komentar pasar real-time, analisis pergerakan harga, dan sinyal ekonomi jangka pendek.",
      cats: ["market-pulse", "Market Pulse", "market", "pulse"],
    },
    "lab-notes": {
      sectionEn: "Lab Notes",
      sectionId: "Catatan Lab",
      descriptionEn: "Behind-the-scenes notes on our research methodology, data sources, and analytical frameworks.",
      descriptionId: "Catatan di balik layar tentang metodologi riset, sumber data, dan kerangka analitis kami.",
      cats: ["lab-notes", "Lab Notes", "lab"],
    },
  };

  const c = configs[sub];
  if (!c) {
    // Fallback for unknown sub-categories
    const section = sub.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return <SectionPageLayout
      sectionEn={section}
      sectionId={section}
      breadcrumbEn="Blog"
      breadcrumbId="Blog"
      breadcrumbHref={`/blog/${sub}`}
      descriptionEn={`Articles in the ${section} category.`}
      descriptionId={`Artikel dalam kategori ${section}.`}
      category={[sub, section]}
    />;
  }
  return <SectionPageLayout
    sectionEn={c.sectionEn}
    sectionId={c.sectionId}
    breadcrumbEn="Blog"
    breadcrumbId="Blog"
    breadcrumbHref={`/blog/${sub}`}
    descriptionEn={c.descriptionEn}
    descriptionId={c.descriptionId}
    category={c.cats}
  />;
}

export function BlogCategoryPage() {
  const { locale } = useLocale();
  const params = useParams<{ category: string }>();
  const category = params.category || "";
  const section = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const slugWords = category.split("-").filter(w => w.length > 2);
  const cats = [category, section, ...slugWords];
  return (
    <SectionPageLayout
      sectionEn={section}
      sectionId={section}
      breadcrumbEn="Blog"
      breadcrumbId="Blog"
      breadcrumbHref="/blog"
      descriptionEn={`Articles in the ${section} category.`}
      descriptionId={`Artikel dalam kategori ${section}.`}
      category={cats}
    />
  );
}
