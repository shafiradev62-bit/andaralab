import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MarketTicker from "@/components/MarketTicker";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import DataHubPage from "@/pages/DataHubPage";
import AdminPage from "@/pages/AdminPage";
import AdminAuthPage from "@/pages/AdminAuthPage";
import ArticlePage from "@/pages/ArticlePage";
import AnalysisPage from "@/pages/AnalysisPage";
import DynamicPage from "@/pages/DynamicPage";
import MacroPage from "@/pages/MacroPage";
import { LocaleProvider, useLocale } from "@/lib/locale";
import { LocaleUrlSync, LocaleNavigator } from "@/lib/routing";
import { BlogPage, BlogCategoryPage } from "@/pages/SectionPage";

// ---------------------------------------------------------------------------
// Layout — used by all pages except HomePage (which has its own dark layout)
// ---------------------------------------------------------------------------

function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <MarketTicker dark={dark} />
      <Navbar dark={dark} />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-gray-900 font-sans bg-white">
      <SiteHeader />
      <main className="pt-[5.5rem]">{children}</main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}

function ProtectedAdmin() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    // Check session on mount
    try {
      const s = localStorage.getItem("andaralab_admin_session");
      if (s) {
        const { expires } = JSON.parse(s);
        if (Date.now() < expires) { setAuthed(true); return; }
      }
    } catch {}
    setAuthed(false);
  }, []);

  if (!authed) return <AdminAuthPage onAuthenticated={() => setAuthed(true)} />;
  return <AdminLayout><AdminPage /></AdminLayout>;
}

function CmsPage({ slug }: { slug: string }) {
  const { locale } = useLocale();
  return <DynamicPage pageSlug={slug} locale={locale} />;
}

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function LocaleQueryInvalidator() {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  useEffect(() => {
    queryClient.invalidateQueries();
  }, [locale, queryClient]);
  return null;
}

function NotFoundPage() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="text-gray-500">{window.location.pathname}</p>
        </div>
      </div>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// R helper — renders the same component for both /path and /en/path and /id/path
// ---------------------------------------------------------------------------

function R({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <>
      <Route path={path}>{children}</Route>
      <Route path={`/en${path}`}>{children}</Route>
      <Route path={`/id${path}`}>{children}</Route>
    </>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <LocaleProvider>
      <ScrollToTop />
      <LocaleQueryInvalidator />
      <LocaleUrlSync />
      <LocaleNavigator />
      <Switch>

        {/* Admin — no locale prefix */}
        <Route path="/admin">
          <ProtectedAdmin />
        </Route>
        <Route path="/en/admin">
          <ProtectedAdmin />
        </Route>
        <Route path="/id/admin">
          <ProtectedAdmin />
        </Route>

        {/* Home — HomePage has its own dark Navbar, do NOT wrap in Layout */}
        <Route path="/"><HomePage /></Route>
        <Route path="/en"><HomePage /></Route>
        <Route path="/id"><HomePage /></Route>

        {/* About */}
        <Route path="/about"><Layout><AboutPage /></Layout></Route>
        <Route path="/en/about"><Layout><AboutPage /></Layout></Route>
        <Route path="/id/about"><Layout><AboutPage /></Layout></Route>

        {/* Contact */}
        <Route path="/contact"><Layout><ContactPage /></Layout></Route>
        <Route path="/en/contact"><Layout><ContactPage /></Layout></Route>
        <Route path="/id/contact"><Layout><ContactPage /></Layout></Route>

        {/* Analisis */}
        <Route path="/analisis"><Layout><AnalysisPage /></Layout></Route>
        <Route path="/en/analisis"><Layout><AnalysisPage /></Layout></Route>
        <Route path="/id/analisis"><Layout><AnalysisPage /></Layout></Route>

        {/* Macro sub-pages — MUST come before /macro */}
        <Route path="/macro/geopolitical"><Layout><MacroPage /></Layout></Route>
        <Route path="/en/macro/geopolitical"><Layout><MacroPage /></Layout></Route>
        <Route path="/id/macro/geopolitical"><Layout><MacroPage /></Layout></Route>

        <Route path="/macro/macro-outlooks"><Layout><MacroPage /></Layout></Route>
        <Route path="/en/macro/macro-outlooks"><Layout><MacroPage /></Layout></Route>
        <Route path="/id/macro/macro-outlooks"><Layout><MacroPage /></Layout></Route>

        <Route path="/macro/policy-monetary"><Layout><MacroPage /></Layout></Route>
        <Route path="/en/macro/policy-monetary"><Layout><MacroPage /></Layout></Route>
        <Route path="/id/macro/policy-monetary"><Layout><MacroPage /></Layout></Route>

        {/* Macro parent */}
        <Route path="/macro"><Layout><MacroPage /></Layout></Route>
        <Route path="/en/macro"><Layout><MacroPage /></Layout></Route>
        <Route path="/id/macro"><Layout><MacroPage /></Layout></Route>

        {/* Sectoral */}
        <Route path="/sectoral/esg"><Layout><CmsPage slug="/sectoral/esg" /></Layout></Route>
        <Route path="/en/sectoral/esg"><Layout><CmsPage slug="/sectoral/esg" /></Layout></Route>
        <Route path="/id/sectoral/esg"><Layout><CmsPage slug="/sectoral/esg" /></Layout></Route>

        <Route path="/sectoral/regional"><Layout><CmsPage slug="/sectoral/regional" /></Layout></Route>
        <Route path="/en/sectoral/regional"><Layout><CmsPage slug="/sectoral/regional" /></Layout></Route>
        <Route path="/id/sectoral/regional"><Layout><CmsPage slug="/sectoral/regional" /></Layout></Route>

        <Route path="/sectoral/deep-dives"><Layout><CmsPage slug="/sectoral/deep-dives" /></Layout></Route>
        <Route path="/en/sectoral/deep-dives"><Layout><CmsPage slug="/sectoral/deep-dives" /></Layout></Route>
        <Route path="/id/sectoral/deep-dives"><Layout><CmsPage slug="/sectoral/deep-dives" /></Layout></Route>

        {/* Data Hub sub-pages — MUST come before /data */}
        <Route path="/data/economic-calendar"><Layout><DataHubPage /></Layout></Route>
        <Route path="/en/data/economic-calendar"><Layout><DataHubPage /></Layout></Route>
        <Route path="/id/data/economic-calendar"><Layout><DataHubPage /></Layout></Route>

        <Route path="/data/market-dashboard"><Layout><DataHubPage /></Layout></Route>
        <Route path="/en/data/market-dashboard"><Layout><DataHubPage /></Layout></Route>
        <Route path="/id/data/market-dashboard"><Layout><DataHubPage /></Layout></Route>

        <Route path="/data/market-overview"><Layout><CmsPage slug="/data/market-overview" /></Layout></Route>
        <Route path="/en/data/market-overview"><Layout><CmsPage slug="/data/market-overview" /></Layout></Route>
        <Route path="/id/data/market-overview"><Layout><CmsPage slug="/data/market-overview" /></Layout></Route>

        {/* Data Hub parent */}
        <Route path="/data"><Layout><DataHubPage /></Layout></Route>
        <Route path="/en/data"><Layout><DataHubPage /></Layout></Route>
        <Route path="/id/data"><Layout><DataHubPage /></Layout></Route>

        {/* Blog sub-pages — MUST come before /blog */}
        <Route path="/blog/economics-101"><Layout><BlogPage sub="economics-101" /></Layout></Route>
        <Route path="/en/blog/economics-101"><Layout><BlogPage sub="economics-101" /></Layout></Route>
        <Route path="/id/blog/economics-101"><Layout><BlogPage sub="economics-101" /></Layout></Route>

        <Route path="/blog/lab-notes"><Layout><BlogPage sub="lab-notes" /></Layout></Route>
        <Route path="/en/blog/lab-notes"><Layout><BlogPage sub="lab-notes" /></Layout></Route>
        <Route path="/id/blog/lab-notes"><Layout><BlogPage sub="lab-notes" /></Layout></Route>

        <Route path="/blog/market-pulse"><Layout><BlogPage sub="market-pulse" /></Layout></Route>
        <Route path="/en/blog/market-pulse"><Layout><BlogPage sub="market-pulse" /></Layout></Route>
        <Route path="/id/blog/market-pulse"><Layout><BlogPage sub="market-pulse" /></Layout></Route>

        {/* Blog parent */}
        <Route path="/blog"><Layout><BlogPage /></Layout></Route>
        <Route path="/en/blog"><Layout><BlogPage /></Layout></Route>
        <Route path="/id/blog"><Layout><BlogPage /></Layout></Route>

        {/* Articles */}
        <Route path="/article/:slug"><Layout><ArticlePage /></Layout></Route>
        <Route path="/en/article/:slug"><Layout><ArticlePage /></Layout></Route>
        <Route path="/id/article/:slug"><Layout><ArticlePage /></Layout></Route>

        {/* Dynamic blog category */}
        <Route path="/blog/:category"><Layout><BlogCategoryPage /></Layout></Route>
        <Route path="/en/blog/:category"><Layout><BlogCategoryPage /></Layout></Route>
        <Route path="/id/blog/:category"><Layout><BlogCategoryPage /></Layout></Route>

        {/* 404 */}
        <Route><NotFoundPage /></Route>

      </Switch>
    </LocaleProvider>
  );
}
