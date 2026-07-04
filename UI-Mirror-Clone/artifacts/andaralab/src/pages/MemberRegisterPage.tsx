/**
 * MemberRegisterPage — /member/register
 * New member registration form.
 * Matches AndaraLab design language (clean borders, gray-900 palette).
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { UserPlus, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { memberRegister, memberLogin, setMemberToken } from "@/lib/member-api";

const NAME_RE = /^[a-zA-Z\s]{3,150}$/;
const PHONE_RE = /^\+?[0-9]{9,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MemberRegisterPage() {
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile_phone: "",
    has_rdn: false,
    password: "",
    password_confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
    setError(null);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!NAME_RE.test(form.full_name.trim()))
      errs.full_name = "Nama hanya boleh huruf dan spasi, minimal 3 karakter";
    if (!EMAIL_RE.test(form.email.trim()))
      errs.email = "Masukkan alamat email yang valid";
    if (!PHONE_RE.test(form.mobile_phone.trim()))
      errs.mobile_phone = "Nomor handphone 9–15 digit, boleh diawali +";
    if (form.password.length < 8)
      errs.password = "Password minimal 8 karakter";
    if (form.password !== form.password_confirm)
      errs.password_confirm = "Konfirmasi password tidak cocok";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await memberRegister({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile_phone: form.mobile_phone.trim(),
        has_rdn: form.has_rdn,
        password: form.password,
      });
      // Auto-login after successful registration
      const loginRes = await memberLogin(form.email.trim().toLowerCase(), form.password);
      setMemberToken(loginRes.data.token);
      setSuccess(true);
      setTimeout(() => navigate("/member/subscribe"), 1800);
    } catch (err: unknown) {
      const msg =
        (err as Error & { apiDetail?: string }).apiDetail ??
        (err as Error).message ??
        "Pendaftaran gagal. Coba lagi.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-gray-900 mx-auto mb-4" />
          <h2 className="text-[20px] font-semibold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-[13.5px] text-gray-500">Mengarahkan ke halaman berlangganan…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-white py-16">
      <div className="max-w-[520px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
            <UserPlus className="w-3.5 h-3.5" />
            Member Area
          </div>
          <h1 className="text-[28px] font-bold text-gray-900 mb-1">Daftar Akun Member</h1>
          <p className="text-[13.5px] text-gray-500">
            Sudah punya akun?{" "}
            <a href="/member/login" className="text-gray-900 font-medium underline">
              Masuk di sini
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
          {/* Full Name */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nama Lengkap <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className={`w-full border px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white ${fieldErrors.full_name ? "border-red-400" : "border-[#E5E7EB]"}`}
              placeholder="Nama sesuai identitas resmi"
              autoComplete="name"
              required
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-[11.5px] text-red-500">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Alamat Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={`w-full border px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white ${fieldErrors.email ? "border-red-400" : "border-[#E5E7EB]"}`}
              placeholder="email@contoh.com"
              autoComplete="email"
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-[11.5px] text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Nomor Handphone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.mobile_phone}
              onChange={(e) => set("mobile_phone", e.target.value)}
              className={`w-full border px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white ${fieldErrors.mobile_phone ? "border-red-400" : "border-[#E5E7EB]"}`}
              placeholder="+62812xxxxxxxx"
              autoComplete="tel"
              required
            />
            {fieldErrors.mobile_phone && (
              <p className="mt-1 text-[11.5px] text-red-500">{fieldErrors.mobile_phone}</p>
            )}
          </div>

          {/* RDN Status */}
          <div className="flex items-start gap-3 border border-[#E5E7EB] px-4 py-3">
            <input
              type="checkbox"
              id="has_rdn"
              checked={form.has_rdn}
              onChange={(e) => set("has_rdn", e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-gray-900 flex-shrink-0"
            />
            <label htmlFor="has_rdn" className="text-[13px] text-gray-700 leading-relaxed cursor-pointer">
              Saya memiliki <strong>Rekening Dana Nasabah (RDN)</strong> yang aktif
            </label>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className={`w-full border px-3 py-2.5 pr-10 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white ${fieldErrors.password ? "border-red-400" : "border-[#E5E7EB]"}`}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
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
            {fieldErrors.password && (
              <p className="mt-1 text-[11.5px] text-red-500">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Konfirmasi Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={form.password_confirm}
              onChange={(e) => set("password_confirm", e.target.value)}
              className={`w-full border px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white ${fieldErrors.password_confirm ? "border-red-400" : "border-[#E5E7EB]"}`}
              placeholder="Ulangi password"
              autoComplete="new-password"
              required
            />
            {fieldErrors.password_confirm && (
              <p className="mt-1 text-[11.5px] text-red-500">{fieldErrors.password_confirm}</p>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-[11.5px] text-gray-400 leading-relaxed">
            Dengan mendaftar, Anda menyetujui penggunaan data sesuai kebijakan privasi AndaraLab.
            Data Anda hanya digunakan untuk keperluan akses layanan berlangganan.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-[13.5px] font-medium py-3 hover:bg-gray-700 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {submitting ? "Mendaftarkan…" : "Daftar Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
