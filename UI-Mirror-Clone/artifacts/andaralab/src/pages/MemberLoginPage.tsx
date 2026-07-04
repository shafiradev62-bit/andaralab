/**
 * MemberLoginPage — /member/login
 * Member credential entry and JWT issuance.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { memberLogin } from "@/lib/member-api";

export default function MemberLoginPage() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await memberLogin(email.trim().toLowerCase(), password);
      // Redirect: if already active → /analisis, else → subscribe
      if (res.data.is_active) {
        navigate("/analisis");
      } else {
        navigate("/member/subscribe");
      }
    } catch (err: unknown) {
      const msg =
        (err as Error & { apiDetail?: string }).apiDetail ??
        (err as Error).message ??
        "Email atau password salah.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] bg-white py-16">
      <div className="max-w-[460px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
            <LogIn className="w-3.5 h-3.5" />
            Member Area
          </div>
          <h1 className="text-[28px] font-bold text-gray-900 mb-1">Masuk ke Akun Member</h1>
          <p className="text-[13.5px] text-gray-500">
            Belum punya akun?{" "}
            <a href="/member/register" className="text-gray-900 font-medium underline">
              Daftar gratis
            </a>
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Alamat Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full border border-[#E5E7EB] px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white"
              placeholder="email@contoh.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full border border-[#E5E7EB] px-3 py-2.5 pr-10 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-[13.5px] font-medium py-3 hover:bg-gray-700 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {submitting ? "Memproses…" : "Masuk"}
          </button>
        </form>

        {/* Footer hint */}
        <p className="mt-6 text-[11.5px] text-gray-400 text-center">
          Masalah login?{" "}
          <a href="/contact" className="underline hover:text-gray-700">
            Hubungi kami
          </a>
        </p>
      </div>
    </div>
  );
}
