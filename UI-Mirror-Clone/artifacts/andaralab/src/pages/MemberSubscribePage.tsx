/**
 * MemberSubscribePage — /member/subscribe
 * Billing desk: shows active plans, triggers Midtrans Snap payment.
 * Handles post-payment status (finish/error/pending from callback URL).
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CreditCard, CheckCircle, Clock, AlertCircle, Loader2, LogOut, ShieldCheck } from "lucide-react";
import {
  useSubscriptionPlans,
  usePaymentConfig,
  useCreatePayment,
  useConfirmPayment,
  useMemberProfile,
  getMemberToken,
  memberLogout,
} from "@/lib/member-api";

// Midtrans Snap is loaded from CDN — declare on window
declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: {
        onSuccess?: (result: SnapResult) => void;
        onPending?: (result: SnapResult) => void;
        onError?: (result: SnapResult) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface SnapResult {
  order_id: string;
  transaction_status: string;
  payment_type?: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatExpiry(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function MemberSubscribePage() {
  const [, navigate] = useLocation();
  const [searchParams] = typeof window !== "undefined"
    ? [new URLSearchParams(window.location.search)]
    : [new URLSearchParams()];

  const callbackStatus = searchParams.get("status"); // finish | error | pending

  const token = getMemberToken();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) navigate("/member/login");
  }, [token, navigate]);

  const { data: profileData, isLoading: profileLoading } = useMemberProfile();
  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: paymentConfig } = usePaymentConfig();

  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();

  const [snapLoaded, setSnapLoaded] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "loading" | "pending" | "success" | "error">("idle");
  const [paymentMessage, setPaymentMessage] = useState("");

  // Set initial state based on callback URL param
  useEffect(() => {
    if (callbackStatus === "finish") setPaymentState("success");
    else if (callbackStatus === "pending") {
      setPaymentState("pending");
      setPaymentMessage("Pembayaran Anda sedang diproses. Akses akan aktif setelah konfirmasi.");
    } else if (callbackStatus === "error") {
      setPaymentState("error");
      setPaymentMessage("Terjadi kesalahan saat pembayaran. Silakan coba lagi.");
    }
  }, [callbackStatus]);

  // Load Midtrans Snap.js when config is available
  useEffect(() => {
    if (!paymentConfig || snapLoaded) return;

    const scriptId = "midtrans-snap";
    if (document.getElementById(scriptId)) {
      setSnapLoaded(true);
      return;
    }

    const src = paymentConfig.is_production
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = src;
    script.setAttribute("data-client-key", paymentConfig.client_key);
    script.onload = () => setSnapLoaded(true);
    script.onerror = () => console.error("[MemberSubscribePage] Failed to load Snap.js");
    document.body.appendChild(script);

    return () => {
      // Don't remove — keep cached for subsequent renders
    };
  }, [paymentConfig, snapLoaded]);

  async function handlePay(planId: string) {
    if (!snapLoaded || !window.snap) {
      setPaymentState("error");
      setPaymentMessage("Payment gateway belum siap. Refresh halaman dan coba lagi.");
      return;
    }

    setPaymentState("loading");
    setPaymentMessage("");

    try {
      const res = await createPayment.mutateAsync(planId);
      const { snap_token, order_id } = res.data;

      setPaymentState("idle"); // Snap takes over UI

      window.snap.pay(snap_token, {
        onSuccess: async (result) => {
          await confirmPayment.mutateAsync({ orderId: order_id, status: result.transaction_status });
          setPaymentState("success");
          setPaymentMessage("Pembayaran berhasil! Akses premium Anda telah aktif.");
        },
        onPending: async (result) => {
          await confirmPayment.mutateAsync({ orderId: order_id, status: result.transaction_status });
          setPaymentState("pending");
          setPaymentMessage("Pembayaran Anda sedang menunggu konfirmasi. Akses akan aktif setelah dana diterima.");
        },
        onError: (result) => {
          console.error("[Snap] Payment error:", result);
          setPaymentState("error");
          setPaymentMessage("Pembayaran gagal. Silakan coba lagi atau gunakan metode pembayaran lain.");
        },
        onClose: () => {
          if (paymentState === "loading") setPaymentState("idle");
        },
      });
    } catch (err: unknown) {
      const msg =
        (err as Error & { apiDetail?: string }).apiDetail ??
        (err as Error).message ??
        "Gagal memulai pembayaran.";
      setPaymentState("error");
      setPaymentMessage(msg);
    }
  }

  async function handleLogout() {
    await memberLogout();
    navigate("/member/login");
  }

  if (!token) return null; // redirecting

  if (profileLoading || plansLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-[13.5px]">Memuat…</span>
      </div>
    );
  }

  const member = profileData?.data;
  const isActive = profileData?.data?.is_active ?? false;
  const expiryDate = member?.membership_expiry_date ?? null;

  return (
    <div className="min-h-[80vh] bg-white py-16">
      <div className="max-w-[760px] mx-auto px-6">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
            <CreditCard className="w-3.5 h-3.5" />
            Member Area
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold text-gray-900 mb-1">Berlangganan</h1>
              {member && (
                <p className="text-[13.5px] text-gray-500">
                  Selamat datang, <strong>{member.full_name}</strong> · {member.email}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors mt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>

        {/* Membership status card */}
        <div className={`mb-8 border px-5 py-4 flex items-center gap-4 ${isActive ? "border-green-200 bg-green-50" : "border-[#E5E7EB] bg-[#F9FAFB]"}`}>
          {isActive ? (
            <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
          )}
          <div>
            <div className={`text-[13.5px] font-semibold ${isActive ? "text-green-700" : "text-gray-700"}`}>
              {isActive ? "Keanggotaan Premium Aktif" : "Keanggotaan Tidak Aktif"}
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5">
              {isActive
                ? `Akses berlaku hingga ${formatExpiry(expiryDate)}`
                : "Pilih paket di bawah untuk mengaktifkan akses premium Anda"}
            </div>
          </div>
          {isActive && (
            <a
              href="/analisis"
              className="ml-auto text-[12.5px] text-green-700 font-medium underline hover:no-underline"
            >
              Ke halaman Analisis →
            </a>
          )}
        </div>

        {/* Payment state feedback */}
        {paymentState === "success" && (
          <div className="mb-8 border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-[13.5px] font-semibold text-green-700">Pembayaran Berhasil</p>
              <p className="text-[12px] text-green-600 mt-0.5">
                {paymentMessage || "Akses premium Anda telah aktif. Silakan akses halaman Analisis."}
              </p>
            </div>
            <a
              href="/analisis"
              className="ml-auto text-[12.5px] text-green-700 font-medium underline"
            >
              Buka Analisis →
            </a>
          </div>
        )}

        {paymentState === "pending" && (
          <div className="mb-8 border border-yellow-200 bg-yellow-50 px-5 py-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-[13px] text-yellow-700">{paymentMessage}</p>
          </div>
        )}

        {paymentState === "error" && (
          <div className="mb-8 border border-red-200 bg-red-50 px-5 py-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-600">{paymentMessage}</p>
          </div>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
            {isActive ? "Perpanjang Langganan" : "Pilih Paket Langganan"}
          </h2>

          {plans.length === 0 ? (
            <p className="text-[13.5px] text-gray-400">Belum ada paket tersedia.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-[#E5E7EB] p-6 hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-[16px] font-bold text-gray-900">{plan.name_id || plan.name}</h3>
                      <p className="text-[13px] text-gray-500 mt-1">{plan.description_id || plan.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[22px] font-bold text-gray-900">{formatRupiah(plan.price)}</div>
                      <div className="text-[12px] text-gray-400">per {plan.duration_months} bulan</div>
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-1.5 mb-5">
                    {(plan.features_id?.length ? plan.features_id : plan.features).map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px] text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handlePay(plan.id)}
                    disabled={paymentState === "loading" || !snapLoaded}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-[13.5px] font-medium py-3 hover:bg-gray-700 transition-colors disabled:opacity-60"
                  >
                    {paymentState === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memproses…
                      </>
                    ) : !snapLoaded ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memuat payment gateway…
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        {isActive ? "Perpanjang Sekarang" : "Bayar Sekarang"}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment methods hint */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
          <p className="text-[11.5px] text-gray-400 text-center">
            Didukung: Transfer Bank (Mandiri, BCA, BNI, BRI), QRIS, GoPay, dan metode lainnya.
            Pembayaran diproses secara aman melalui Midtrans.
          </p>
        </div>
      </div>
    </div>
  );
}
