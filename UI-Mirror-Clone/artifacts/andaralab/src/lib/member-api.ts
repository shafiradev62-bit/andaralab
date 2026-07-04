/**
 * member-api.ts
 * API client helpers for the Premium Membership system.
 * Mirrors the admin auth pattern in api.ts.
 */

import { apiGet, apiPost, apiPut } from "./api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Token management ─────────────────────────────────────────────────────────

const MEMBER_TOKEN_KEY = "andaralab_member_token";

export function getMemberToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(MEMBER_TOKEN_KEY);
}

export function setMemberToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(MEMBER_TOKEN_KEY, token);
}

export function clearMemberToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(MEMBER_TOKEN_KEY);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberPublic {
  id: string;
  full_name: string;
  email: string;
  mobile_phone: string;
  has_rdn: boolean;
  membership_expiry_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MemberLoginResponse {
  data: {
    token: string;
    member: MemberPublic;
    is_active: boolean;
  };
}

export interface MemberProfileResponse {
  data: MemberPublic & { is_active: boolean };
}

export interface MemberStatusResponse {
  data: {
    is_active: boolean;
    membership_expiry_date: string | null;
    status: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_id: string;
  description: string;
  description_id: string;
  price: number;
  duration_months: number;
  features: string[];
  features_id: string[];
  is_active: boolean;
  order: number;
}

export interface PaymentConfig {
  client_key: string;
  is_production: boolean;
  enabled_payments: string[];
}

export interface CreatePaymentResponse {
  data: {
    order_id: string;
    snap_token: string;
    snap_redirect_url: string;
    amount: number;
    plan_name: string;
  };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function memberRegister(input: {
  full_name: string;
  email: string;
  mobile_phone: string;
  has_rdn: boolean;
  password: string;
}): Promise<{ data: MemberPublic }> {
  return apiPost<{ data: MemberPublic }>("/member-auth/register", input);
}

export async function memberLogin(email: string, password: string): Promise<MemberLoginResponse> {
  const res = await apiPost<MemberLoginResponse>("/member-auth/login", { email, password });
  setMemberToken(res.data.token);
  return res;
}

export async function memberLogout(): Promise<void> {
  try {
    await apiPost("/member-auth/logout", {});
  } finally {
    clearMemberToken();
  }
}

export async function memberProfile(): Promise<MemberProfileResponse> {
  return apiGet<MemberProfileResponse>("/member-auth/profile");
}

export async function memberUpdateProfile(updates: {
  full_name?: string;
  mobile_phone?: string;
  has_rdn?: boolean;
}): Promise<MemberProfileResponse> {
  return apiPut<MemberProfileResponse>("/member-auth/profile", updates);
}

// ─── Subscription API ─────────────────────────────────────────────────────────

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  const res = await apiGet<{ data: SubscriptionPlan[] }>("/subscriptions/plans");
  return res.data;
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const res = await apiGet<{ data: PaymentConfig }>("/subscriptions/payment-config");
  return res.data;
}

export async function createPayment(planId: string): Promise<CreatePaymentResponse> {
  return apiPost<CreatePaymentResponse>("/subscriptions/create-payment", { plan_id: planId });
}

export async function confirmPayment(orderId: string, transactionStatus: string): Promise<void> {
  await apiPost("/subscriptions/confirm-payment", {
    order_id: orderId,
    transaction_status: transactionStatus,
  });
}

export async function fetchMembershipStatus(): Promise<MemberStatusResponse["data"]> {
  const res = await apiGet<MemberStatusResponse>("/subscriptions/status");
  return res.data;
}

// ─── TanStack Query hooks ─────────────────────────────────────────────────────

const MEMBER_QUERY_KEY = {
  profile: ["member-profile"] as const,
  status: ["member-status"] as const,
  plans: ["subscription-plans"] as const,
  paymentConfig: ["payment-config"] as const,
};

export function useMemberProfile() {
  const token = getMemberToken();
  return useQuery({
    queryKey: MEMBER_QUERY_KEY.profile,
    queryFn: memberProfile,
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useMemberStatus() {
  const token = getMemberToken();
  return useQuery({
    queryKey: MEMBER_QUERY_KEY.status,
    queryFn: fetchMembershipStatus,
    enabled: !!token,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: MEMBER_QUERY_KEY.plans,
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 30,
  });
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: MEMBER_QUERY_KEY.paymentConfig,
    queryFn: fetchPaymentConfig,
    staleTime: 1000 * 60 * 60,
  });
}

export function useMemberUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: memberUpdateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBER_QUERY_KEY.profile });
    },
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (planId: string) => createPayment(planId),
  });
}

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      confirmPayment(orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBER_QUERY_KEY.status });
      qc.invalidateQueries({ queryKey: MEMBER_QUERY_KEY.profile });
    },
  });
}
