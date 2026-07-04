import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Clock, Loader2 } from "lucide-react";
import { usePosts, usePostBySlug } from "@/lib/cms-store";
import { useLocale } from "@/lib/locale";
import { applyDocumentSeo, truncateMeta } from "@/lib/document-meta";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const { locale, t } = useLocale();
  const slug = (params.slug || "").replace(/^\//, "");
  const { data: post, isLoading: postLoading, error: postError } = usePostBySlug(slug, locale);
  const { data: posts = [] } = usePosts({ status: "published" });

  const isLoading = postLoading;

  useEffect(() => {
    if (postLoading) return;
    const path = `/article/${slug}`;
    if (!post) {
      applyDocumentSeo({
        title: t("meta_article_not_found_title"),
        description: t("meta_article_not_found_description"),
        pathname: path,
      });
      return;
    }
    const firstPara = Array.isArray(post.body) && post.body.length ? String(post.body[0]) : "";
    const description = (post.excerpt && post.excerpt.trim()) || truncateMeta(firstPara) || undefined;
    applyDocumentSeo({
      title: post.title,
      description,
      pathname: path,
    });
  }, [postLoading, post, slug, t]);

  const related = post
    ? posts
        .filter((p) => p.category === post.category && p.slug !== post.slug && p.status === "published")
        .slice(0, 3)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-[13.5px]">Loading article…</span>
      </div>
    );
  }

  if (!post) {
    const apiDetail =
      postError && postError instanceof Error
        ? (postError as Error & { apiDetail?: string }).apiDetail
        : undefined;
    const hint =
      apiDetail ||
      "This article doesn't exist, is still a draft in the CMS, or may have been moved.";
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <div className="text-[72px] font-bold text-gray-100 mb-4">404</div>
        <h1 className="text-[24px] font-semibold text-gray-900 mb-3">Article not found</h1>
        <p className="text-gray-500 mb-8">{hint}</p>
        <Link href="/" className="text-[13.5px] font-medium text-gray-900 border border-gray-900 px-6 py-2.5 hover:bg-gray-100">
          Go Home
        </Link>
      </div>
    );
  }

  const categoryHref = `/blog/${post.category}`;
  const publishedDate = formatDate(post.publishedAt || post.createdAt);
  const bodyParagraphs = Array.isArray(post.body) ? post.body : [];

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-2 text-[12px] text-gray-400">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href={categoryHref} className="hover:text-gray-700 transition-colors">{post.category}</Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-[300px]">{post.title}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Main article */}
          <div className="lg:col-span-2">
            <Link
              href={categoryHref}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-900 mb-5 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {post.tag || post.category}
            </Link>

            <div className="flex items-center gap-2 mb-4">
              {post.tag && (
                <span className="text-[10.5px] font-semibold text-gray-900 border border-gray-900/20 bg-gray-100 px-2 py-0.5 uppercase tracking-wide">
                  {post.tag}
                </span>
              )}
              {post.readTime && (
                <span className="flex items-center gap-1 text-[12px] text-gray-400">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
              )}
              <span className="text-[12px] text-gray-400">{publishedDate}</span>
            </div>

            <h1 className="text-[28px] md:text-[34px] font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-[15px] text-gray-500 leading-relaxed mb-6 border-l-4 border-gray-900 pl-4">
                {post.excerpt}
              </p>
            )}

            {post.image && (
              <div className="mb-8 border border-[#E5E7EB] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-[300px] object-cover"
                />
              </div>
            )}

            <div className="prose max-w-none">
              {bodyParagraphs.map((para, i) => (
                <p key={i} className="text-[14.5px] text-gray-700 leading-[1.8] mb-5">
                  {para}
                </p>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-[#E5E7EB] flex items-center justify-between">
              <div className="text-[12px] text-gray-400">
                Published: <span className="text-gray-600">{publishedDate}</span> · AndaraLab Research
              </div>
              <Link
                href={categoryHref}
                className="inline-flex items-center gap-2 text-[12.5px] font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700 transition-colors"
              >
                More in {post.category} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-[6rem]">
              {related.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
                    Related Articles
                  </div>
                  <div className="space-y-0 border border-[#E5E7EB]">
                    {related.map((r, i) => (
                      <Link
                        key={r.slug}
                        href={`/article/${r.slug.replace(/^\//, "")}`}
                        className={`block p-4 group hover:bg-gray-50 transition-colors ${i < related.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {r.tag && (
                            <span className="text-[10px] font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 uppercase tracking-wide">
                              {r.tag}
                            </span>
                          )}
                          {r.readTime && (
                            <span className="text-[10.5px] text-gray-400">{r.readTime}</span>
                          )}
                        </div>
                        <h4 className="text-[13px] font-medium text-gray-900 leading-snug group-hover:text-gray-900 transition-colors">
                          {r.title}
                        </h4>
                        <p className="text-[11.5px] text-gray-400 mt-1">{formatDate(r.publishedAt || r.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 border border-[#E5E7EB] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  About This Research
                </div>
                <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3">
                  AndaraLab produces independent economic research for Indonesia and emerging markets.
                </p>
                <Link href="/about" className="text-[12px] font-medium text-gray-900 hover:underline flex items-center gap-1">
                  About AndaraLab <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-4 border border-[#E5E7EB] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  Data Hub
                </div>
                <p className="text-[12.5px] text-gray-500 mb-3">
                  Explore interactive charts and economic data behind this analysis.
                </p>
                <Link
                  href="/data"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white bg-gray-900 px-3 py-1.5 hover:bg-gray-700 transition-colors"
                >
                  Open Data Hub <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
