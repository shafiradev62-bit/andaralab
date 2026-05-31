import { ArrowRight, Target, Eye, Zap } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/lib/locale";

export default function AboutPage() {
  const { locale } = useLocale();
  const id = locale === "id";

  const pillars = [
    {
      icon: Target,
      title: id ? "Misi" : "Mission",
      text: id
        ? "Memberikan fondasi analitis yang memungkinkan mitra kami berkembang dalam lanskap ekonomi yang terus berubah."
        : "To provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape.",
    },
    {
      icon: Eye,
      title: id ? "Visi" : "Vision",
      text: id
        ? "Menjadi pusat intelijen ekonomi terkemuka di Asia Tenggara, menjembatani data makroekonomi dan strategi yang dapat ditindaklanjuti."
        : "To become the premier economic intelligence hub in Southeast Asia, bridging macro-economic data and actionable strategy.",
    },
    {
      icon: Zap,
      title: id ? "Pendekatan" : "Approach",
      text: id
        ? "Pendekatan 'laboratorium' kami menggabungkan pemodelan ekonometrik yang ketat dengan keahlian institusional mendalam untuk wawasan yang berbasis ilmiah."
        : "Our 'laboratory' approach combines rigorous econometric modeling with deep institutional expertise for scientifically grounded insights.",
    },
  ];

  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[720px]">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-4">
              {id ? "Tentang AndaraLab" : "About AndaraLab"}
            </div>
            <h1 className="text-[38px] font-bold text-gray-900 leading-tight mb-6">
              {id ? "Pusat Riset Ekonomi Terkemuka" : "A Premier Economic Research Hub"}
            </h1>
            <p className="text-[16px] text-gray-500 leading-relaxed mb-6">
              {id
                ? "Di AndaraLab, kami beroperasi sebagai pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas. Kami menjembatani kesenjangan antara data makroekonomi yang kompleks dan intelijen yang dapat ditindaklanjuti. Dibangun di atas pilar \"Tumbuh\", misi kami adalah memberikan fondasi analitis yang memungkinkan mitra kami berkembang."
                : "At AndaraLab, we operate as a premier economic research hub under PT. Andara Investasi Cerdas. We bridge the gap between complex macro-economic data and actionable intelligence. Built on the pillar of \"Tumbuh\" (Growth), our mission is to provide the analytical foundation that allows our partners to flourish in an ever-evolving economic landscape."}
            </p>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              {id
                ? "Di AndaraLab, kami menjembatani kesenjangan antara pergeseran global yang kompleks dan peluang investasi lokal dengan mengubah data ekonomi mentah menjadi intelijen strategis presisi tinggi. Sebagai divisi riset PT. Andara Investasi Cerdas, pendekatan 'laboratorium' kami menggabungkan pemodelan ekonometrik yang ketat dengan keahlian institusional mendalam untuk memastikan setiap wawasan berbasis ilmiah dan dapat ditindaklanjuti secara praktis."
                : "At AndaraLab, we bridge the gap between complex global shifts and local investment opportunities by transforming raw economic data into high-precision strategic intelligence. As the dedicated research arm of PT. Andara Investasi Cerdas, our \"laboratory\" approach combines rigorous econometric modeling with deep institutional expertise to ensure every insight is both scientifically grounded and practically actionable."}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[22px] font-semibold text-gray-900 mb-10">
            {id ? "Fondasi Kami" : "Our Foundation"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((p) => (
              <div key={p.title} className="border border-[#E5E7EB] p-6">
                <div className="w-10 h-10 bg-[#f0f4f9] flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-3">{p.title}</h3>
                <p className="text-[13.5px] text-gray-500 leading-relaxed">{p.text}</p>
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
              {id ? "Tulang Punggung Institusional" : "The Institutional Backbone"}
            </h2>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-4">
              {id
                ? "AndaraLab adalah divisi riset PT. Andara Investasi Cerdas, yang menyatukan ekonom, ilmuwan data, dan pakar regional yang berkomitmen menghasilkan riset yang kredibel dan dapat ditindaklanjuti."
                : "AndaraLab is the dedicated research division of PT. Andara Investasi Cerdas, bringing together economists, data scientists, and regional experts committed to producing credible, actionable research."}
            </p>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-6">
              {id
                ? "Tim kami menggabungkan pengetahuan lokal mendalam tentang Indonesia dan Asia Tenggara dengan metode kuantitatif yang ketat, menghasilkan intelijen yang relevan secara global dan berakar secara lokal."
                : "Our team combines deep local knowledge of Indonesia and Southeast Asia with rigorous quantitative methods, delivering intelligence that is both globally relevant and locally grounded."}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white bg-gray-900 px-6 py-2.5 hover:bg-gray-700 transition-colors"
            >
              {id ? "Hubungi Kami" : "Get in Touch"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-[280px] bg-[#f0f4f9] flex items-center justify-center border border-[#E5E7EB]">
            <div className="text-center px-8">
              <div className="text-[48px] font-bold text-gray-900 mb-2">2+</div>
              <div className="text-[13px] text-gray-500">
                {id ? "Tahun Keunggulan Riset" : "Years of Research Excellence"}
              </div>
              <div className="h-px bg-[#E5E7EB] my-4" />
              <div className="text-[48px] font-bold text-gray-900 mb-2">100+</div>
              <div className="text-[13px] text-gray-500">
                {id ? "Titik Data Dilacak Bulanan" : "Data Points Tracked Monthly"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
