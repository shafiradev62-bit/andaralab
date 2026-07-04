import { useLocale } from "@/lib/locale";
import { useMemberAuth } from "@/contexts/MemberAuthContext";
import { BarChart3, Lock } from "lucide-react";

interface MemberAnalysisShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function MemberAnalysisShell({ title, subtitle, children }: MemberAnalysisShellProps) {
  const { locale } = useLocale();
  const { user, subscription } = useMemberAuth();

  const endsAt = subscription?.endsAt
    ? new Date(subscription.endsAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="border border-[#E5E7EB] rounded-lg bg-[#FAFAFA] px-5 py-4 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md border border-[#E67E22]/30 bg-white flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#E67E22]" />
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              {locale === "id" ? "Area Member" : "Member Area"}
            </p>
            <p className="text-[13px] text-gray-700">
              {user?.name}
              {endsAt && (
                <span className="text-gray-400">
                  {" "}
                  · {locale === "id" ? "Aktif hingga" : "Active until"} {endsAt}
                </span>
              )}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#E67E22] border border-[#E67E22]/30 bg-white px-3 py-1 rounded-full">
          {locale === "id" ? "Premium" : "Premium"}
        </span>
      </div>

      <div className="mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 mb-3">
          <BarChart3 className="w-3.5 h-3.5" />
          {locale === "id" ? "Analysis Premium" : "Premium Analysis"}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && <p className="text-gray-500 text-[15px] leading-relaxed max-w-2xl">{subtitle}</p>}
      </div>

      {children ?? (
        <div className="border border-dashed border-gray-200 rounded-lg bg-white px-8 py-16 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">
            {locale === "id" ? "Konten akan segera tersedia" : "Content coming soon"}
          </p>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {locale === "id"
              ? "Engine membership sudah aktif. Konten analysis premium akan dikembangkan bertahap."
              : "Membership engine is active. Premium analysis content will be developed in phases."}
          </p>
        </div>
      )}
    </div>
  );
}
