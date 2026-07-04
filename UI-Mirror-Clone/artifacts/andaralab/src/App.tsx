import { useEffect, useState } from "react";
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
import AnalysisGate from "@/pages/AnalysisGate";
import DynamicPage from "@/pages/DynamicPage";
import MemberRegisterPage from "@/pages/MemberRegisterPage";
import MemberLoginPage from "@/pages/MemberLoginPage";
import MemberSubscribePage from "@/pages/MemberSubscribePage";
import { LocaleProvider, useLocale } from "@/lib/locale";
import { ThemeProvider } from "@/lib/theme";
import { adminLogin, adminLogout, adminMe } from "@/lib/api";
import {
  BlogPage,
  BlogCategoryPage,
} from "@/pages/SectionPage";

function SiteHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <MarketTicker />
      <Navbar />
    </div>
  );
}

function Layout({ children, withNewsletter = true, withHeader = true }: { children: React.ReactNode; withNewsletter?: boolean; withHeader?: boolean }) {
  return (
    <div className="min-h-screen font-sans bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {withHeader && <SiteHeader />}
      {/* pt = ticker(2rem) + navbar(3.5rem) = 5.5rem */}
      <main className={withHeader ? "pt-[5.5rem]" : ""}>{children}</main>
      {withNewsletter && <NewsletterSection />}
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}

function AdminLoginScreen({
  onLoggedIn,
  errorMessage,
}: {
  onLoggedIn: (username: string) => void;
  errorMessage?: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(undefined);
    try {
      const res = await adminLogin(username.trim(), password);
      onLoggedIn(res.data.username);
      setPassword("");
    } catch {
      setLocalError("Username atau password salah.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white border border-[#E5E7EB] p-6">
        <h1 className="text-[18px] font-semibold text-gray-900 mb-1">Admin CMS Login</h1>
        <p className="text-[12px] text-gray-500 mb-5">Akses CMS hanya untuk akun admin internal.</p>
        {errorMessage || localError ? (
          <div className="mb-4 text-[12px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">
            {errorMessage ?? localError}
          </div>
        ) : null}
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-[#D1D5DB] px-3 py-2 text-[14px]"
              placeholder="admin1 atau admin2"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#D1D5DB] px-3 py-2 text-[14px]"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white py-2 text-[13px] font-medium disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in to CMS"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminRoute() {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    adminMe()
      .then((res) => {
        if (!mounted) return;
        setSessionUser(res.data.username);
      })
      .catch(() => {
        if (!mounted) return;
        setSessionUser(null);
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLoggedIn = (username: string) => {
    setErrorMessage(undefined);
    setSessionUser(username);
  };

  const handleLogout = async () => {
    await adminLogout();
    setSessionUser(null);
  };

  if (checking) {
    return <div className="min-h-screen grid place-items-center text-[13px] text-gray-500">Checking admin session...</div>;
  }

  if (!sessionUser) {
    return (
      <AdminLoginScreen
        onLoggedIn={handleLoggedIn}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <AdminLayout>
      <AdminPage adminUser={sessionUser} onLogout={handleLogout} />
    </AdminLayout>
  );
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
    <ThemeProvider>
      <LocaleProvider>
        <ScrollToTop />
        <Switch>
        <Route path="/admin">
          <AdminRoute />
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
          <Layout withNewsletter={false}><AnalysisGate /></Layout>
        </Route>

        <Route path="/member/register">
          <Layout withNewsletter={false}><MemberRegisterPage /></Layout>
        </Route>

        <Route path="/member/login">
          <Layout withNewsletter={false}><MemberLoginPage /></Layout>
        </Route>

        <Route path="/member/subscribe">
          <Layout withNewsletter={false}><MemberSubscribePage /></Layout>
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
    </ThemeProvider>
  );
}
