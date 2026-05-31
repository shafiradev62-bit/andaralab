import { ArrowRight, Clock, Tag, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { usePosts } from "@/lib/cms-store";
import { useLocale } from "@/lib/locale";
import { RESEARCH_TAG_PILL } from "@/lib/research-tag-styles";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

function SectionPageLayout({
  section,
  breadcrumb,
  breadcrumbHref,
  description,
  category,
  subcategory,
}: {
  section: string;
  breadcrumb: string;
  breadcrumbHref: string;
  description: string;
  category: string | string[];
  subcategory?: string | string[];
}) {
  const { locale } = useLocale();
  const categories = Array.isArray(category) ? category : [category];
  const subcategories = subcategory ? (Array.isArray(subcategory) ? subcategory : [subcategory]) : null;

  const { data: allPosts = [], isLoading } = usePosts({ status: "published" });

  const posts = allPosts
    .filter((p) => {
      const matchLocale = p.locale === locale || p.locale === "en";
      if (!matchLocale) return false;

      // Special: "__all__" means show ALL posts (used by Blog "All Insights" page)
      if (categories.includes("__all__")) return true;

      // Aggressive matching: check ALL post fields against ALL filter categories
      const postCat = (p.category || "").toLowerCase();
      const postSub = (p.subcategory || "").toLowerCase();
      const postTag = (p.tag || "").toLowerCase();
      const postFields = [postCat, postSub, postTag].filter(Boolean);
      const postWords = new Set(
        postFields.flatMap(f => f.split(/[\s\-&,]+/).filter(w => w.length > 2))
      );

      // Check if post matches ANY of the filter categories
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

      // If subcategory filter provided, also check subcategory match (same aggressive logic)
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

  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
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
            <span className="text-[13.5px]">Loading articles…</span>
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-[14px] mb-2">No articles published yet.</p>
            <Link href="/admin" className="text-[13px] text-gray-900 hover:underline">
              Add articles in the CMS →
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
                        <Clock className="w-3 h-3" />{post.readTime}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                  <h2 className={`font-semibold text-gray-900 mb-2 leading-snug group-hover:text-gray-900 transition-colors ${i === 0 ? "text-[20px]" : "text-[15px]"}`}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-[13px] text-gray-500 leading-relaxed mb-4">{post.excerpt}</p>
                  )}
                  <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
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
    section="Macro Outlooks"
    breadcrumb="Macro Foundations"
    breadcrumbHref="/macro/macro-outlooks"
    description="In-depth analysis of Indonesia's macroeconomic trends, growth drivers, and risks."
    category={["Macro Foundations", "macro-outlooks", "Macro Outlooks", "macro", "outlooks"]}
    subcategory={["Macro Outlooks", "macro-outlooks", "outlooks"]}
  />;
}

export function PolicyMonetaryPage() {
  return <SectionPageLayout
    section="Policy & Monetary Watch"
    breadcrumb="Macro Foundations"
    breadcrumbHref="/macro/macro-outlooks"
    description="Tracking Bank Indonesia policy, monetary conditions, and fiscal developments."
    category={["Macro Foundations", "policy-monetary", "Policy & Monetary Watch", "monetary", "policy"]}
    subcategory={["Policy & Monetary Watch", "policy-monetary", "monetary", "policy"]}
  />;
}

export function GeopoliticalPage() {
  return <SectionPageLayout
    section="Geopolitical & Structural Analysis"
    breadcrumb="Macro Foundations"
    breadcrumbHref="/macro/macro-outlooks"
    description="Analyzing geopolitical dynamics and structural shifts affecting Indonesia and the region."
    category={["Macro Foundations", "geopolitical", "Geopolitical", "Geopolitical & Structural Analysis", "structural"]}
    subcategory={["Geopolitical & Structural Analysis", "geopolitical", "structural"]}
  />;
}

export function DeepDivesPage() {
  return <SectionPageLayout
    section="Strategic Industry Deep-dives"
    breadcrumb="Sectoral Intelligence"
    breadcrumbHref="/sectoral/deep-dives"
    description="Rigorous sector-level analysis of Indonesia's key industries and their strategic outlook."
    category={["Sectoral Intelligence", "sectoral-analysis", "deep-dives", "sectoral", "Strategic Industry Deep-dives", "industry"]}
    subcategory={["Strategic Industry Deep-dives", "deep-dives", "industry", "sectoral"]}
  />;
}

export function RegionalPage() {
  return <SectionPageLayout
    section="Regional Economic Monitor"
    breadcrumb="Sectoral Intelligence"
    breadcrumbHref="/sectoral/deep-dives"
    description="Monitoring regional economic performance across Java, Sumatra, Kalimantan, and beyond."
    category={["Sectoral Intelligence", "regional", "Regional Economic Monitor", "Regional Monitor"]}
    subcategory={["Regional Economic Monitor", "regional", "Regional Monitor"]}
  />;
}

export function ESGPage() {
  return <SectionPageLayout
    section="ESG"
    breadcrumb="Sectoral Intelligence"
    breadcrumbHref="/sectoral/deep-dives"
    description="Environmental, social, and governance analysis for Indonesian corporations and investors."
    category={["Sectoral Intelligence", "esg", "ESG", "environmental", "governance"]}
    subcategory={["ESG", "esg", "environmental", "governance"]}
  />;
}

export function BlogPage({ sub }: { sub?: "economics-101" | "market-pulse" | "lab-notes" }) {
  if (!sub) {
    // Show ALL published posts — no category filter needed
    return <SectionPageLayout
      section="All Insights"
      breadcrumb="Blog"
      breadcrumbHref="/blog"
      description="All published research, market commentary, and analysis."
      category="__all__"
    />;
  }
  const configs: Record<string, { section: string; description: string; cats: string[] }> = {
    "economics-101": {
      section: "Economics 101",
      description: "Foundational economic concepts explained through the lens of Indonesia's economy.",
      cats: ["economics-101", "Economics 101", "economics"],
    },
    "market-pulse": {
      section: "Market Pulse",
      description: "Short-form market commentary and real-time analysis of Indonesian financial markets.",
      cats: ["market-pulse", "Market Pulse", "market"],
    },
    "lab-notes": {
      section: "Lab Notes",
      description: "Behind-the-scenes notes on our research methodology, data sources, and analytical frameworks.",
      cats: ["lab-notes", "Lab Notes", "lab"],
    },
  };
  const c = configs[sub];
  return <SectionPageLayout
    section={c.section}
    breadcrumb="Blog"
    breadcrumbHref={`/blog/${sub}`}
    description={c.description}
    category={c.cats}
  />;
}

/** Dynamic blog category page — handles any category slug from CMS */
export function BlogCategoryPage() {
  const params = useParams<{ category: string }>();
  const category = params.category || "";
  const section = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  // Derive multiple keywords from the slug for aggressive matching
  const slugWords = category.split("-").filter(w => w.length > 2);
  const cats = [category, section, ...slugWords];
  return (
    <SectionPageLayout
      section={section}
      breadcrumb="Blog"
      breadcrumbHref="/blog"
      description={`Articles in the ${section} category.`}
      category={cats}
    />
  );
}
