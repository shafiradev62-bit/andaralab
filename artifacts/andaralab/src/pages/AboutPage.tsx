import { ArrowRight, Target, Eye, Zap } from "lucide-react";
import { Link } from "wouter";

const pillars = [
  {
    icon: Target,
    title: "Mission",
    text: "To provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape.",
  },
  {
    icon: Eye,
    title: "Vision",
    text: "To become the premier economic intelligence hub in Southeast Asia, bridging macro-economic data and actionable strategy.",
  },
  {
    icon: Zap,
    title: "Approach",
    text: "Our 'laboratory' approach combines rigorous econometric modeling with deep institutional expertise for scientifically grounded insights.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[720px]">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-4">
              About AndaraLab
            </div>
            <h1 className="text-[38px] font-bold text-gray-900 leading-tight mb-6">
              A Premier Economic Research Hub
            </h1>
            <p className="text-[16px] text-gray-500 leading-relaxed mb-6">
              At AndaraLab, we operate as a premier economic research hub under
              PT. Andara Investasi Cerdas. We bridge the gap between complex
              macro-economic data and actionable intelligence. Built on the
              pillar of "Tumbuh" (Growth), our mission is to provide the
              analytical foundation that allows our partners to flourish in an
              ever-evolving economic landscape.
            </p>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              At AndaraLab, we bridge the gap between complex global shifts and local investment opportunities by transforming raw economic data into high-precision strategic intelligence. As the dedicated research arm of PT. Andara Investasi Cerdas, our "laboratory" approach combines rigorous econometric modeling with deep institutional expertise to ensure every insight is both scientifically grounded and practically actionable. We don’t just track the market; we decode the underlying forces of the Indonesian economy to fulfill our core promise of "Tumbuh"—empowering our partners with the clarity and foresight needed to achieve sustainable, long-term growth in an ever-evolving financial landscape.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[22px] font-semibold text-gray-900 mb-10">
            Our Foundation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((p) => (
              <div key={p.title} className="border border-[#E5E7EB] p-6">
                <div className="w-10 h-10 bg-[#f0f4f9] flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-3">
                  {p.title}
                </h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-4">
              PT. Andara Investasi Cerdas
            </div>
            <h2 className="text-[26px] font-bold text-gray-900 leading-tight mb-5">
              The Institutional Backbone
            </h2>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-4">
              AndaraLab is the dedicated research division of PT. Andara
              Investasi Cerdas, bringing together economists, data scientists,
              and regional experts committed to producing credible, actionable
              research.
            </p>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-6">
              Our team combines deep local knowledge of Indonesia and Southeast
              Asia with rigorous quantitative methods, delivering intelligence
              that is both globally relevant and locally grounded.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white bg-gray-900 px-6 py-2.5 hover:bg-gray-700 transition-colors"
            >
              Get in Touch
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-[280px] bg-[#f0f4f9] flex items-center justify-center border border-[#E5E7EB]">
            <div className="text-center px-8">
              <div className="text-[48px] font-bold text-gray-900 mb-2">2+</div>
              <div className="text-[13px] text-gray-500">Years of Research Excellence</div>
              <div className="h-px bg-[#E5E7EB] my-4" />
              <div className="text-[48px] font-bold text-gray-900 mb-2">100+</div>
              <div className="text-[13px] text-gray-500">Data Points Tracked Monthly</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
