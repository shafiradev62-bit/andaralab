import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
// v2 - dynamic CMS routing
import Navbar from "@/components/Navbar";
import MarketTicker from "@/components/MarketTicker";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import DataHubPage from "@/pages/DataHubPage";
import ModelsPage from "@/pages/ModelsPage";
import AdminPage from "@/pages/AdminPage";
import ArticlePage from "@/pages/ArticlePage";
import AnalysisPage from "@/pages/AnalysisPage";
import DynamicPage from "@/pages/DynamicPage";
import { LocaleProvider, useLocale } from "@/lib/locale";
import {
  BlogPage,
  BlogCategoryPage,
} from "@/pages/SectionPage";

function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <MarketTicker dark={dark} />
      <Navbar dark={dark} />
    </div>
  );
}

function Layout({ children, withNewsletter = true, withHeader = true, headerDark = false }: { children: React.ReactNode; withNewsletter?: boolean; withHeader?: boolean; headerDark?: boolean }) {
  return (
    <div className="min-h-screen text-gray-900 font-sans bg-white">
      {withHeader && <SiteHeader dark={headerDark} />}
      {/* pt = ticker(2rem) + navbar(3.5rem) = 5.5rem; no pt when header is hidden */}
      <main className={withHeader ? "pt-[5.5rem]" : ""}>{children}</main>
      {withNewsletter && <NewsletterSection />}
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}

function CmsPage({ slug }: { slug: string }) {
  const { locale } = useLocale();
  return <DynamicPage pageSlug={slug} locale={locale} />;
}

function CmsDynamicPage() {
  const [location] = useLocation();
  return <CmsPage slug={location} />;
}

/** SPA: reset scroll on route change (no layout change). */
function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <LocaleProvider>
      <ScrollToTop />
      <Switch>
        <Route path="/admin">
          <AdminLayout>
            <AdminPage />
          </AdminLayout>
        </Route>

        <Route path="/contact">
          <Layout withNewsletter={false}><ContactPage /></Layout>
        </Route>

        <Route path="/about">
          <Layout><AboutPage /></Layout>
        </Route>

        <Route path="/macro/macro-outlooks">
          <Layout><CmsPage slug="/macro/macro-outlooks" /></Layout>
        </Route>
        <Route path="/macro/policy-monetary">
          <Layout><CmsPage slug="/macro/policy-monetary" /></Layout>
        </Route>
        <Route path="/macro/geopolitical">
          <Layout><CmsPage slug="/macro/geopolitical" /></Layout>
        </Route>
        <Route path="/macro">
          <Layout><CmsPage slug="/macro/macro-outlooks" /></Layout>
        </Route>

        <Route path="/sectoral/deep-dives">
          <Layout><CmsPage slug="/sectoral/deep-dives" /></Layout>
        </Route>
        <Route path="/sectoral/regional">
          <Layout><CmsPage slug="/sectoral/regional" /></Layout>
        </Route>
        <Route path="/sectoral/esg">
          <Layout><CmsPage slug="/sectoral/esg" /></Layout>
        </Route>

        <Route path="/data/models">
          <Layout withNewsletter={false}><ModelsPage /></Layout>
        </Route>
        <Route path="/data/economic-calendar">
          <Layout withNewsletter={false}><DataHubPage /></Layout>
        </Route>
        <Route path="/data/market-dashboard">
          <Layout withNewsletter={false}><DataHubPage /></Layout>
        </Route>
        <Route path="/data/market-overview">
          <Layout withNewsletter={false}><DynamicPage pageSlug="market-overview" /></Layout>
        </Route>
        <Route path="/data">
          <Layout withNewsletter={false}><DataHubPage /></Layout>
        </Route>

        <Route path="/blog/economics-101">
          <Layout><BlogPage sub="economics-101" /></Layout>
        </Route>
        <Route path="/blog/market-pulse">
          <Layout><BlogPage sub="market-pulse" /></Layout>
        </Route>
        <Route path="/blog/lab-notes">
          <Layout><BlogPage sub="lab-notes" /></Layout>
        </Route>
        <Route path="/blog/:category">
          <Layout><BlogCategoryPage /></Layout>
        </Route>
        <Route path="/blog">
          <Layout><BlogPage /></Layout>
        </Route>

        <Route path="/article/:slug">
          <Layout withNewsletter={false}><ArticlePage /></Layout>
        </Route>

        <Route path="/analisis">
          <Layout withNewsletter={false}><AnalysisPage /></Layout>
        </Route>

        <Route path="/">
          <HomePage />
        </Route>

        {/* Dynamic CMS pages — catches any slug created in admin */}
        <Route>
          <Layout><CmsDynamicPage /></Layout>
        </Route>
      </Switch>
    </LocaleProvider>
  );
}
