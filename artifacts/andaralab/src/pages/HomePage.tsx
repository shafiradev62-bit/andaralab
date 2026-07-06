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

export default function HomePage() {
  useEffect(() => {
    applyDocumentSeo({
      title: `${SITE_NAME} | Economic Intelligence`,
      description: "AndaraLab — Independent economic research and strategic intelligence for Indonesia.",
      pathname: "/",
    });
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <MarketTicker dark />
        <Navbar dark />
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
