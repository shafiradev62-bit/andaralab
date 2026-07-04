import MemberAnalysisShell from "@/components/MemberAnalysisShell";
import AnalysisPage from "@/pages/AnalysisPage";
import { useLocale } from "@/lib/locale";

export default function MemberAnalysisPage() {
  const { locale } = useLocale();

  return (
    <MemberAnalysisShell
      title={locale === "id" ? "Analysis 1" : "Analysis 1"}
      subtitle={
        locale === "id"
          ? "Statistik dan insight dari konten AndaraLab — area member premium."
          : "Statistics and insights from AndaraLab content — premium member area."
      }
    >
      <div className="-mt-4">
        <AnalysisPage embedded />
      </div>
    </MemberAnalysisShell>
  );
}
