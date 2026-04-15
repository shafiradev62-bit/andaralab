import { Link } from "wouter";
import { useLocale } from "@/lib/locale";

export default function Footer() {
  const { t, locale } = useLocale();

  const links = {
    [t("research")]: [
      { label: t("macro_outlooks"), href: "/macro/macro-outlooks" },
      { label: t("policy_monetary"), href: "/macro/policy-monetary" },
      { label: t("nav_sectoral"), href: "/sectoral/deep-dives" },
      { label: t("esg"), href: "/sectoral/esg" },
      { label: t("nav_data"), href: "/data" },
    ],
    [t("explore")]: [
      { label: t("economic_calendar"), href: "/data/economic-calendar" },
      { label: t("nav_market_dashboard"), href: "/data/market-dashboard" },
      { label: t("nav_blog"), href: "/blog/economics-101" },
      { label: t("nav_lab_notes"), href: "/blog/lab-notes" },
    ],
    [t("company")]: [
      { label: t("about_us"), href: "/about" },
      { label: t("contact_label"), href: "/contact" },
      { label: t("admin_cms"), href: "/admin" },
    ],
  };

  return (
    <footer className="bg-white border-t border-[#E5E7EB] py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 border border-gray-400 flex items-center justify-center">
                <span className="text-gray-700 text-[11px] font-bold">AL</span>
              </div>
              <span className="text-[15px] font-bold text-gray-900 tracking-tight">AndaraLab</span>
            </div>
            <p className="text-[12.5px] text-gray-500 leading-relaxed max-w-[280px] mb-5">
              {locale === "id"
                ? "Pusat riset ekonomi terkemuka di bawah PT. Andara Investasi Cerdas. Menguraikan ekonomi, mendorong pertumbuhan."
                : "A premier economic research hub under PT. Andara Investasi Cerdas. Decoding economies, empowering growth."}
            </p>
            <Link
              href="/contact"
              className="inline-flex items text-[12.5px] font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700 transition-colors"
            >
              {t("get_in_touch_label")} →
            </Link>
          </div>
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
                {group}
              </div>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[12.5px] text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E5E7EB] pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[11.5px] text-gray-400">
            © 2026 AndaraLab · PT. Andara Investasi Cerdas. {t("all_rights_reserved")}
          </p>
          <p className="text-[11.5px] text-gray-400">andaralab.id</p>
        </div>
      </div>
    </footer>
  );
}
