import { useEffect, Component, type ReactNode } from "react";
import { ArrowRight, BarChart2, Clock, Tag, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePageBySlug, useDatasets, usePosts } from "@/lib/cms-store";
import type { ContentSection } from "@/lib/cms-store";
import InteractiveChart from "@/components/InteractiveChart";
import CalendarWidget from "@/components/CalendarWidget";
import { useLocale } from "@/lib/locale";
import { RESEARCH_TAG_PILL } from "@/lib/research-tag-styles";
import { applyDocumentSeo, seoFromCmsPage } from "@/lib/document-meta";

// Error boundary to prevent blank screen from block render errors
class BlockErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="border border-red-100 bg-red-50 text-red-600 text-[13px] px-4 py-3 rounded">
            Gagal memuat blok konten. Coba refresh halaman.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function HeroSection({ headline, subheadline, ctaText, ctaHref }: any) {
  return (
    <section className="border-b border-[#E5E7EB] py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[720px]">
          <h1 className="text-[38px] font-bold text-gray-900 leading-tight mb-4">{headline}</h1>
          {subheadline && <p className="text-[16px] text-gray-500 leading-relaxed mb-6">{subheadline}</p>}
          {ctaText && ctaHref && (
            <Link href={ctaHref} className="inline-flex items-center gap-2 text-[13.5px] font-medium text-gray-900 border border-gray-900 px-5 py-2.5 hover:bg-gray-100">
              {ctaText} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function TextSection({ content }: any) {
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10">
      <p className="text-[15px] text-gray-600 leading-[1.8] max-w-[720px]">{content}</p>
    </section>
  );
}

function StatsSection({ items }: any) {
  const list = Array.isArray(items) ? items : [];
  return (
    <section className="bg-gray-50 border-y border-[#E5E7EB] py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {list.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-[28px] font-bold text-gray-900 mb-1">
                {item.value}{item.unit && <span className="text-[16px] font-normal text-gray-500 ml-1">{item.unit}</span>}
              </div>
              <div className="text-[12px] text-gray-400 uppercase tracking-wide">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ heading, body, buttonText, buttonHref }: any) {
  return (
    <section className="bg-white border-y border-[#E5E7EB] py-12">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        <div>
          <h3 className="text-[20px] font-semibold text-gray-900 mb-2">{heading}</h3>
          <p className="text-[14px] text-gray-500">{body}</p>
        </div>
        <Link href={buttonHref} className="flex-shrink-0 inline-flex items-center gap-2 text-[13px] font-medium text-gray-900 border border-gray-900 px-5 py-2.5 hover:bg-gray-100">
          {buttonText} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function DividerSection() {
  return <div className="border-t border-[#E5E7EB] my-2 max-w-[1200px] mx-auto px-6" />;
}

function FeaturedSection({ slugs, limit }: any) {
  const { t, locale } = useLocale();
  const { data: allPosts = [] } = usePosts({ status: "published" });
  const raw = Array.isArray(slugs) ? slugs : [];
  const targetSlugs: string[] = limit ? raw.slice(0, limit) : raw;
  // Match by slug from CMS posts, fallback to first N published posts if slugs not found
  const matched = targetSlugs
    .map((s: string) => allPosts.find((p) => p.slug === s))
    .filter(Boolean) as typeof allPosts;
  const items = matched.length > 0 ? matched : allPosts.slice(0, limit ?? 3);
  if (!items.length) return null;
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10">
      <h2 className="text-[18px] font-semibold text-gray-900 mb-6">{t("featured_insights_title")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((post, i) => (
          <Link key={post.slug} href={"/article/" + post.slug.replace(/^\//, "")}
            className={"border border-[#E5E7EB] hover:border-gray-300 hover:shadow-sm transition-all group " + (i === 0 ? "md:col-span-3" : "")}>
            {post.image && <div className="h-[180px] overflow-hidden"><img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {post.tag && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-900 bg-slate-100 px-2 py-0.5"><Tag className="w-3 h-3" />{post.tag}</span>}
                {post.readTime && <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock className="w-3 h-3" />{post.readTime}</span>}
              </div>
              <h3 className="text-[14px] font-semibold text-gray-900 group-hover:text-gray-900 transition-colors">{post.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PostsSection({ categories, title }: { categories: string[]; title?: string }) {
  const { locale, t } = useLocale();
  const cats = Array.isArray(categories) ? categories : [];
  const { data: allPosts = [], isLoading } = usePosts({ status: "published" });

  const posts = allPosts
    .filter((p) => {
      const matchLocale = p.locale === locale || p.locale === "en";
      if (!matchLocale) return false;

      // Aggressive matching: check ALL post fields against ALL filter categories
      // 1. Exact match on category
      // 2. Partial/contains match on category, subcategory, tag
      // 3. Word-level tokenized matching (split by spaces, hyphens, &)
      const postCat = (p.category || "").toLowerCase();
      const postSub = (p.subcategory || "").toLowerCase();
      const postTag = (p.tag || "").toLowerCase();
      const postFields = [postCat, postSub, postTag].filter(Boolean);

      // Tokenize post fields into individual words for word-level matching
      const postWords = new Set(
        postFields.flatMap(f => f.split(/[\s\-&,]+/).filter(w => w.length > 2))
      );

      for (const filterCat of cats) {
        const fc = filterCat.toLowerCase();

        // Direct exact match on category
        if (postCat === fc) return true;

        // Contains match: any post field contains the filter, or filter contains any post field
        for (const field of postFields) {
          if (field === fc) return true;
          if (field.includes(fc)) return true;
          if (fc.includes(field) && field.length > 2) return true;
        }

        // Word-level match: any significant word from the filter appears in post fields
        const filterWords = fc.split(/[\s\-&,]+/).filter(w => w.length > 2);
        for (const fw of filterWords) {
          if (postWords.has(fw)) return true;
          // Also check if filter word is contained in any post field
          for (const field of postFields) {
            if (field.includes(fw)) return true;
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
    <section className="max-w-[1200px] mx-auto px-6 py-10">
      {title && <h2 className="text-[18px] font-semibold text-gray-900 mb-6">{title}</h2>}
      {isLoading && (
        <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13.5px]">{t("loading_articles")}</span>
        </div>
      )}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-[14px]">{t("no_articles_match")}</div>
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
                    <span
                      className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 ${
                        RESEARCH_TAG_PILL
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {post.tag}
                    </span>
                  )}
                  {post.readTime && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
                <h2
                  className={`font-semibold text-gray-900 mb-2 leading-snug group-hover:text-gray-900 transition-colors ${
                    i === 0 ? "text-[20px]" : "text-[15px]"
                  }`}
                >
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
  );
}

function ChartSection({ datasetId, title }: any) {
  const { t } = useLocale();
  const { data: datasets = [] } = useDatasets();
  const dataset = datasets.find((d: any) => d.id === datasetId);
  if (!dataset) return (
    <section className="max-w-[1200px] mx-auto px-6 py-10">
      <div className="border border-[#E5E7EB] p-8 text-center text-gray-400 text-[13px]">
        <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
        {t("dataset_not_found")}: {datasetId}
      </div>
    </section>
  );
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10">
      {title && <h2 className="text-[18px] font-semibold text-gray-900 mb-4">{title}</h2>}
      {dataset.description && <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">{dataset.description}</p>}
      <div className="border border-[#E5E7EB] p-6">
        <InteractiveChart dataset={dataset} height={280} />
      </div>
    </section>
  );
}

function CalendarSection({ title, titleId, subtitle, subtitleId, impactFilter, regionFilter, categoryFilter, defaultDays, showTimezone, showActual, showPrevious, showConsensus, showForecast }: any) {
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10">
      <div className="border border-[#E5E7EB]">
        <CalendarWidget
          title={title}
          titleId={titleId}
          subtitle={subtitle}
          subtitleId={subtitleId}
          impactFilter={impactFilter}
          regionFilter={regionFilter}
          categoryFilter={categoryFilter}
          defaultDays={defaultDays}
          showTimezone={showTimezone}
          showActual={showActual}
          showPrevious={showPrevious}
          showConsensus={showConsensus}
          showForecast={showForecast}
        />
      </div>
    </section>
  );
}

/** Extract meaningful keywords from a slug/title/section for post matching */
function extractSlugKeywords(slug?: string, title?: string, section?: string): string[] {
  const raw = [slug, title, section].filter(Boolean).join(" ");
  return raw
    .toLowerCase()
    .split(/[\s\-\/&,()]+/)
    .map(w => w.replace(/[^a-z0-9]/g, ""))
    .filter(w => w.length > 2 && !["the", "and", "for", "new", "page", "blog", "root", "admin"].includes(w));
}

function SectionBlock({ section, pageSlug, pageTitle, pageSection }: { section: ContentSection; pageSlug?: string; pageTitle?: string; pageSection?: string }) {
  switch (section.type) {
    case "hero":     return <HeroSection {...section} />;
    case "text":     return <TextSection content={section.content} />;
    case "stats":    return <StatsSection items={section.items} />;
    case "cta":      return <CTASection {...section} />;
    case "divider":  return <DividerSection />;
    case "featured": return <FeaturedSection slugs={section.slugs} limit={section.limit} />;
    case "posts": {
      // Auto-enrich categories with keywords from the page slug/title/section
      // so posts ALWAYS match based on the URL even if CMS categories are stale
      const baseCats = Array.isArray(section.categories) ? section.categories : [];
      const slugKeywords = extractSlugKeywords(pageSlug, pageTitle, pageSection);
      const enriched = [...new Set([...baseCats, ...slugKeywords])];
      return <PostsSection categories={enriched} title={section.title} />;
    }
    case "chart":    return <ChartSection datasetId={section.datasetId} title={section.title} />;
    case "calendar": return <CalendarSection {...section} />;
    case "about":    return <AboutSectionContent {...section} />;
    default:         return null;
  }
}

function AboutSectionContent({ headline, items, description }: { headline?: string; items?: { label: string; value: string; unit?: string }[]; description?: string }) {
  const { t } = useLocale();
  return (
    <section className="border-t border-[#E5E7EB] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">{t("about_andaralab")}</div>
            {description ? (
              <p className="text-[14.5px] text-gray-500 leading-relaxed">{description}</p>
            ) : null}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">{headline ?? t("our_approach")}</div>
            <div className="space-y-0 border border-[#E5E7EB]">
              {(items ?? []).map((item, i, arr) => (
                <div key={i} className={`flex gap-4 p-5 ${i < arr.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
                  <div className="text-[11px] font-bold text-gray-300 w-6 flex-shrink-0 mt-0.5">0{i + 1}</div>
                  <div>
                    <div className="text-[14px] font-semibold text-gray-900 mb-1">{item.label}</div>
                    <div className="text-[13px] text-gray-500 leading-relaxed">{item.value}</div>
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

export default function DynamicPage({ pageSlug, locale: propLocale }: { pageSlug: string; locale?: "en" | "id" }) {
  const { t, locale: ctxLocale } = useLocale();
  const locale = propLocale ?? ctxLocale;
  const [pathname] = useLocation();
  const { data: page, isLoading, error } = usePageBySlug(pageSlug, locale);

  useEffect(() => {
    if (isLoading) return;
    if (error || !page) {
      applyDocumentSeo({
        title: t("meta_not_found_title"),
        description: t("meta_not_found_description"),
        pathname: pathname || pageSlug,
      });
      return;
    }
    const { title, description } = seoFromCmsPage(page);
    applyDocumentSeo({ title, description, pathname: pathname || page.slug });
  }, [isLoading, error, page, pathname, pageSlug, t]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      <span className="text-[13px]">{t("loading_label")}</span>
    </div>
  );

  if (error || !page) {
    const apiDetail = error && typeof error === "object" && error instanceof Error
      ? (error as Error & { apiDetail?: string }).apiDetail
      : undefined;
    const hint =
      apiDetail ||
      (locale === "id"
        ? "Halaman tidak ada atau belum dipublikasikan (masih Draft di CMS)."
        : "This page does not exist or is still a draft in the CMS.");
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <div className="text-[60px] font-bold text-gray-100 mb-4">404</div>
        <h1 className="text-[22px] font-semibold text-gray-900 mb-3">
          {locale === "id" ? "Halaman tidak ditemukan" : t("page_not_found_title")}
        </h1>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">{hint}</p>
        <Link href="/" className="text-[13px] font-medium text-gray-900 border border-gray-900 px-6 py-2.5 hover:bg-gray-100">
          {t("go_home")}
        </Link>
      </div>
    );
  }

  const blocks = Array.isArray(page.content) ? page.content : [];

  return (
    <BlockErrorBoundary>
      {blocks.length === 0 ? (
        <>
          <HeroSection
            headline={page.title || t("untitled_page")}
            subheadline={page.description || t("no_content_yet")}
          />
          <div className="max-w-[1200px] mx-auto px-6 py-16 text-center text-gray-400">
            <p className="text-[14px]">{t("structure_json_blocks")}</p>
          </div>
        </>
      ) : (
        blocks.map((section: ContentSection, i: number) => (
          <SectionBlock key={`${section.type}-${i}`} section={section} pageSlug={page.slug} pageTitle={page.title} pageSection={page.section} />
        ))
      )}
    </BlockErrorBoundary>
  );
}
