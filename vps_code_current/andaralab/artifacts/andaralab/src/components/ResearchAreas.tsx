import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const areas = [
  {
    title: "Macro Foundations",
    description: "GDP, inflation, interest rates, fiscal and monetary policy.",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    href: "/macro/macro-outlooks",
  },
  {
    title: "Sectoral Intelligence",
    description: "Industry deep-dives, regional economic monitors, and ESG.",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=800&q=80",
    href: "/sectoral/deep-dives",
  },
  {
    title: "Data Hub",
    description: "Interactive charts, economic calendar, and market dashboard.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    href: "/data",
  },
];

export default function ResearchAreas() {
  return (
    <section className="py-12 bg-white border-t border-[#E5E7EB]">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-[22px] font-semibold text-gray-900 mb-8">
          Our Research Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {areas.map((area) => (
            <Link
              key={area.title}
              href={area.href}
              className="relative overflow-hidden border border-[#E5E7EB] h-[200px] cursor-pointer group block"
            >
              <img
                src={area.image}
                alt={area.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-[15px] font-semibold text-white mb-1">
                  {area.title}
                </h3>
                <p className="text-[12px] text-white/80 leading-relaxed mb-2">
                  {area.description}
                </p>
                <span className="flex items-center gap-1 text-[11.5px] text-white/70 font-medium group-hover:text-white transition-colors">
                  Explore <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
