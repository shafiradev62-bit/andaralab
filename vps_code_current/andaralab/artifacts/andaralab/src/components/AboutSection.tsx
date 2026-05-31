import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

const pillars = [
  { num: "01", title: "Rigor", desc: "Every analysis is grounded in verified data sources, peer-reviewed methodology, and transparent assumptions." },
  { num: "02", title: "Relevance", desc: "We focus on what matters now — policy shifts, market dislocations, and structural economic changes." },
  { num: "03", title: "Clarity", desc: "Complex economic intelligence translated into clear, actionable insights for decision-makers." },
];

const stats = [
  { value: "100+", label: "Economic Indicators Tracked" },
  { value: "15+", label: "Economies Monitored" },
  { value: "5+", label: "Research Verticals" },
  { value: "2019", label: "Founded, Jakarta" },
];

export default function AboutSection() {
  return (
    <section className="border-t border-[#E5E7EB] bg-white">
      {/* Stats bar */}
      <div className="border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E5E7EB]">
            {stats.map((s, i) => (
              <div key={i} className="px-6 py-6 text-center">
                <div className="text-[32px] font-bold text-gray-900 leading-none">{s.value}</div>
                <div className="text-[12px] text-gray-400 mt-1.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
              About AndaraLab
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 leading-tight mb-5">
              A Laboratory for<br />Economic Intelligence
            </h2>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-7">
              At AndaraLab, we operate as a premier economic research hub under PT. Andara Investasi Cerdas. We bridge the gap between complex macro-economic data and actionable intelligence. Built on the pillar of <strong className="text-gray-700">"Tumbuh"</strong> (Growth), our mission is to provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-[13.5px] font-medium text-gray-900 border border-gray-900 px-6 py-2.5 hover:bg-gray-100 transition-colors"
              >
                About Us <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-[13.5px] font-medium text-gray-700 border border-[#D1D5DB] px-6 py-2.5 hover:border-gray-400 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Our Approach
            </div>
            <div className="space-y-0 border border-[#E5E7EB]">
              {pillars.map((p, i) => (
                <div key={p.num} className={`flex gap-4 p-5 ${i < pillars.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}>
                  <div className="text-[11px] font-bold text-gray-300 w-6 flex-shrink-0 mt-0.5">{p.num}</div>
                  <div>
                    <div className="text-[14px] font-semibold text-gray-900 mb-1">{p.title}</div>
                    <div className="text-[13px] text-gray-500 leading-relaxed">{p.desc}</div>
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
