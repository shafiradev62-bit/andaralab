import { useEffect } from "react";
import { applyDocumentSeo, SITE_NAME } from "@/lib/document-meta";
import Hero from "@/components/Hero";
import DataHub from "@/components/DataHub";
import FeaturedInsights from "@/components/FeaturedInsights";
import AboutSection from "@/components/AboutSection";
import MarketTicker from "@/components/MarketTicker";
import Navbar from "@/components/Navbar";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";
import { useDarkMode } from "@/lib/dark-mode-context";

export default function HomePage() {
  const { darkMode } = useDarkMode();
  
  useEffect(() => {
    applyDocumentSeo({
      title: `${SITE_NAME} | Economic Intelligence`,
      description: "AndaraLab — Independent economic research and strategic intelligence for Indonesia.",
      pathname: "/",
    });
  }, []);

  return (
    <div className={`min-h-screen font-sans ${darkMode ? "bg-[hsl(222,47%,8%)] text-[hsl(210,40%,98%)]" : "bg-white text-gray-900"}`}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <MarketTicker dark={darkMode} />
        <Navbar dark={darkMode} />
      </div>
      <Hero />
      <DataHub />
      <FeaturedInsights />
      <AboutSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
