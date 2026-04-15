// FeaturedInsights.tsx — Reads from CMS Featured Insights config
// Falls back to latest published posts if no config slugs defined

import { ArrowRight, Clock, Star } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "../lib/locale";
import { usePosts, useFeaturedInsights } from "../lib/cms-store";
import { RESEARCH_TAG_PILL } from "../lib/research-tag-styles";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function FeaturedInsights() {
  const { locale, t } = useLocale();
  const { data: config } = useFeaturedInsights(locale);
  const { data: allPosts = [], isLoading } = usePosts({ status: "published", locale });

  // Resolve which posts to show
  const postsToShow = (() => {
    const limit = config?.limit ?? 3;

    if (config?.slugs && config.slugs.length > 0) {
      // Use CMS-specified slugs in order
      const slugOrder = config.slugs
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => s.slug);
      const slugSet = new Set(slugOrder);
      const matched = allPosts.filter((p) => slugSet.has(p.slug));
      const matchedMap = new Map(matched.map((p) => [p.slug, p]));
      // Preserve CMS ordering, fill remaining with latest posts
      const ordered: typeof allPosts = [];
      for (const s of config.slugs) {
        if (matchedMap.has(s.slug)) ordered.push(matchedMap.get(s.slug)!);
      }
      const usedSlugs = new Set(config.slugs.map((s) => s.slug));
      const extras = allPosts.filter((p) => !usedSlugs.has(p.slug));
      return [...ordered, ...extras].slice(0, limit);
    }

    // Fallback: latest posts
    return allPosts.slice(0, limit);
  })();

  const sectionTitle = config?.title ?? t("featured_insights");
  const sectionSubtitle = config?.subtitle ?? "";
  const hero = postsToShow[0];
  const rest = postsToShow.slice(1);

  if (isLoading) {
    return (
      <section className="py-14 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="h-8 w-56 bg-gray-100 animate-pulse mb-2" />
          <div className="h-4 w-80 bg-gray-100 animate-pulse mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!hero) return null;

  return (
    <section className="py-14 bg-white border-t border-[#E5E7EB]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-gray-900" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-900">
              {config?.sectionLabel ?? t("featured_insights")}
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[26px] font-bold text-gray-900 leading-tight">{sectionTitle}</h2>
              {sectionSubtitle && (
                <p className="text-[13.5px] text-gray-500 mt-1">{sectionSubtitle}</p>
              )}
            </div>
            <Link
              href="/blog"
              className="flex-shrink-0 text-[12.5px] font-medium text-gray-900 hover:underline flex items-center gap-1"
            >
              {t("lihat_semua")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hero card — spans 2 cols */}
          <Link
            href={`/article/${hero.slug.replace(/^\//, "")}`}
            className="md:col-span-2 group relative overflow-hidden flex flex-col border border-[#E5E7EB] hover:border-gray-300 hover:shadow-md transition-all rounded-lg"
          >
            {hero.image && (
              <img
                src={hero.image}
                alt={hero.title}
                className="w-full h-52 object-cover"
              />
            )}
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 uppercase tracking-wide ${RESEARCH_TAG_PILL}`}>
                  {hero.category}
                </span>
              </div>
              <h3 className="text-[17px] font-bold text-gray-900 leading-snug mb-3 group-hover:text-gray-900 transition-colors flex-1">
                {hero.title}
              </h3>
              {hero.excerpt && (
                <p className="text-[12.5px] text-gray-500 leading-relaxed mb-4 line-clamp-2">
                  {hero.excerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-auto pt-4 border-t border-[#F3F4F6]">
                <span>{formatDate(hero.publishedAt || hero.createdAt)}</span>
                {hero.readTime && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {hero.readTime}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* Side cards */}
          <div className="flex flex-col gap-4">
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/article/${post.slug.replace(/^\//, "")}`}
                className="group border border-[#E5E7EB] p-5 flex flex-col hover:border-gray-300 hover:shadow-sm transition-all rounded-lg flex-1"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 uppercase tracking-wide ${RESEARCH_TAG_PILL}`}>
                    {post.category}
                  </span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-gray-900 leading-snug mb-2 group-hover:text-gray-900 transition-colors flex-1">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-auto pt-3 border-t border-[#F3F4F6]">
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  {post.readTime && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
