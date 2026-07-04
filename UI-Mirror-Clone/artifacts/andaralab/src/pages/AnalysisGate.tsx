/**
 * AnalysisGate.tsx
 * Route guard wrapper for /analisis.
 * Checks member JWT + membership status before rendering AnalysisPage.
 * - No token → redirect to /member/login
 * - Token but membership expired/inactive → redirect to /member/subscribe
 * - Token + active membership → render children (AnalysisPage)
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Lock } from "lucide-react";
import { getMemberToken, useMemberStatus } from "@/lib/member-api";
import AnalysisPage from "./AnalysisPage";

export default function AnalysisGate() {
  const [, navigate] = useLocation();
  const token = getMemberToken();

  // If no token, redirect immediately
  useEffect(() => {
    if (!token) navigate("/member/login");
  }, [token, navigate]);

  const { data: status, isLoading, isError } = useMemberStatus();

  // No token — render nothing while redirect fires
  if (!token) return null;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-[13.5px]">Memeriksa akses…</span>
      </div>
    );
  }

  // API error or inactive membership
  if (isError || !status?.is_active) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <Lock className="w-10 h-10 text-gray-300 mb-5" />
        <h2 className="text-[20px] font-bold text-gray-900 mb-2">Konten Premium</h2>
        <p className="text-[13.5px] text-gray-500 max-w-sm mb-6 leading-relaxed">
          Halaman ini hanya dapat diakses oleh member dengan keanggotaan aktif.
          Aktifkan atau perpanjang langganan Anda untuk mendapatkan akses penuh.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/member/subscribe"
            className="px-6 py-2.5 bg-gray-900 text-white text-[13.5px] font-medium hover:bg-gray-700 transition-colors"
          >
            Aktifkan Akses Premium
          </a>
          <a
            href="/member/login"
            className="px-6 py-2.5 border border-[#E5E7EB] text-gray-700 text-[13.5px] hover:border-gray-400 transition-colors"
          >
            Masuk Akun Lain
          </a>
        </div>
      </div>
    );
  }

  // Active membership — render the real Analysis page
  return <AnalysisPage />;
}
