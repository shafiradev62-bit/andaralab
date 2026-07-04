// Membership data store — separate JSON files, does NOT touch CMS data.
// Files: members.json, subscription-plans.json, member-subscriptions.json, member-payments.json

import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "/data";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, "utf-8");
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error(`[membership-store] Failed to read ${filepath}:`, err);
  }
  return fallback;
}

function writeJson<T>(filename: string, data: T): void {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[membership-store] Failed to write ${filepath}:`, err);
  }
}

export interface MemberRecord {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  mobilePhone: string;
  hasRDN: boolean;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface SubscriptionPlanRecord {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  durationMonths: number;
  isActive: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: number;
  userId: number;
  planId: number;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  paymentId: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface PaymentRecord {
  id: number;
  userId: number;
  planId: number;
  subscriptionId: number | null;
  orderId: string;
  transactionId: string | null;
  amount: string;
  currency: string;
  paymentMethod: string | null;
  status: string;
  statusMessage: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PLAN: SubscriptionPlanRecord = {
  id: 1,
  name: "Analysis Access",
  slug: "analysis-access",
  description: "Akses penuh ke Analysis premium untuk 1 tahun",
  price: "1000.00",
  currency: "IDR",
  durationMonths: 12,
  isActive: true,
  features: ["Akses Analysis section", "Update data berkala", "Premium insights"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

class MembershipStore {
  private members: Map<string, MemberRecord> = new Map();
  private plans: Map<number, SubscriptionPlanRecord> = new Map();
  private subscriptions: Map<number, SubscriptionRecord> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();

  private memberIdCounter = 1;
  private subscriptionIdCounter = 1;
  private paymentIdCounter = 1;

  constructor() {
    this.load();
  }

  private load() {
    const membersArr = readJson<MemberRecord[]>("members.json", []);
    for (const m of membersArr) {
      this.members.set(m.email.toLowerCase(), m);
      if (m.id >= this.memberIdCounter) this.memberIdCounter = m.id + 1;
    }

    const plansArr = readJson<SubscriptionPlanRecord[]>("subscription-plans.json", []);
    if (plansArr.length === 0) {
      this.plans.set(DEFAULT_PLAN.id, DEFAULT_PLAN);
      this.savePlans();
    } else {
      for (const p of plansArr) {
        this.plans.set(p.id, p);
      }
    }

    const subsArr = readJson<SubscriptionRecord[]>("member-subscriptions.json", []);
    for (const s of subsArr) {
      this.subscriptions.set(s.id, s);
      if (s.id >= this.subscriptionIdCounter) this.subscriptionIdCounter = s.id + 1;
    }

    const paysArr = readJson<PaymentRecord[]>("member-payments.json", []);
    for (const p of paysArr) {
      this.payments.set(p.orderId, p);
      if (p.id >= this.paymentIdCounter) this.paymentIdCounter = p.id + 1;
    }

    console.log(
      `[membership-store] Loaded ${this.members.size} members, ${this.plans.size} plans, ${this.subscriptions.size} subscriptions, ${this.payments.size} payments`,
    );
  }

  private saveMembers() {
    writeJson("members.json", Array.from(this.members.values()));
  }

  private savePlans() {
    writeJson("subscription-plans.json", Array.from(this.plans.values()));
  }

  private saveSubscriptions() {
    writeJson("member-subscriptions.json", Array.from(this.subscriptions.values()));
  }

  private savePayments() {
    writeJson("member-payments.json", Array.from(this.payments.values()));
  }

  // ── Members ────────────────────────────────────────────────────────────────

  getMemberByEmail(email: string): MemberRecord | undefined {
    return this.members.get(email.toLowerCase());
  }

  getMemberById(id: number): MemberRecord | undefined {
    return Array.from(this.members.values()).find((m) => m.id === id);
  }

  listMembers(): MemberRecord[] {
    return Array.from(this.members.values());
  }

  createMember(data: Omit<MemberRecord, "id" | "createdAt" | "updatedAt" | "role" | "isActive" | "emailVerified">): MemberRecord {
    const now = new Date().toISOString();
    const member: MemberRecord = {
      ...data,
      id: this.memberIdCounter++,
      role: "member",
      isActive: true,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    this.members.set(member.email.toLowerCase(), member);
    this.saveMembers();
    return member;
  }

  updateMemberLogin(email: string) {
    const member = this.members.get(email.toLowerCase());
    if (member) {
      member.lastLoginAt = new Date().toISOString();
      member.updatedAt = member.lastLoginAt;
      this.saveMembers();
    }
  }

  // ── Plans ──────────────────────────────────────────────────────────────────

  getPlan(id: number): SubscriptionPlanRecord | undefined {
    return this.plans.get(id);
  }

  listActivePlans(): SubscriptionPlanRecord[] {
    return Array.from(this.plans.values())
      .filter((p) => p.isActive)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }

  listAllPlans(): SubscriptionPlanRecord[] {
    return Array.from(this.plans.values());
  }

  updatePlan(id: number, patch: Partial<SubscriptionPlanRecord>): SubscriptionPlanRecord | null {
    const plan = this.plans.get(id);
    if (!plan) return null;
    Object.assign(plan, patch, { updatedAt: new Date().toISOString() });
    this.plans.set(id, plan);
    this.savePlans();
    return plan;
  }

  // ── Subscriptions ──────────────────────────────────────────────────────────

  getActiveSubscription(userId: number): SubscriptionRecord | undefined {
    const now = new Date();
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.userId === userId && sub.status === "active" && sub.endsAt && new Date(sub.endsAt) > now,
    );
  }

  hasActiveAccess(userId: number): boolean {
    return !!this.getActiveSubscription(userId);
  }

  listSubscriptions(): SubscriptionRecord[] {
    return Array.from(this.subscriptions.values());
  }

  activateSubscription(userId: number, planId: number, orderId: string): SubscriptionRecord {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error("Plan not found");

    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setMonth(endsAt.getMonth() + plan.durationMonths);

    const subscription: SubscriptionRecord = {
      id: this.subscriptionIdCounter++,
      userId,
      planId,
      status: "active",
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      paymentId: orderId,
      autoRenew: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      cancelledAt: null,
    };

    this.subscriptions.set(subscription.id, subscription);
    this.saveSubscriptions();
    return subscription;
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  getPayment(orderId: string): PaymentRecord | undefined {
    return this.payments.get(orderId);
  }

  listPayments(): PaymentRecord[] {
    return Array.from(this.payments.values());
  }

  createPayment(data: {
    userId: number;
    planId: number;
    orderId: string;
    amount: string;
    currency: string;
  }): PaymentRecord {
    const now = new Date().toISOString();
    const payment: PaymentRecord = {
      id: this.paymentIdCounter++,
      userId: data.userId,
      planId: data.planId,
      subscriptionId: null,
      orderId: data.orderId,
      transactionId: null,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: null,
      status: "pending",
      statusMessage: null,
      paidAt: null,
      expiredAt: null,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(data.orderId, payment);
    this.savePayments();
    return payment;
  }

  updatePayment(orderId: string, patch: Partial<PaymentRecord>): PaymentRecord | null {
    const payment = this.payments.get(orderId);
    if (!payment) return null;
    Object.assign(payment, patch, { updatedAt: new Date().toISOString() });
    this.payments.set(orderId, payment);
    this.savePayments();
    return payment;
  }

  settlePayment(orderId: string, transactionId: string, paymentMethod: string, metadata?: string): SubscriptionRecord | null {
    const payment = this.payments.get(orderId);
    if (!payment) return null;
    if (payment.status === "settlement" && payment.subscriptionId) {
      return this.subscriptions.get(payment.subscriptionId) ?? null;
    }

    payment.status = "settlement";
    payment.transactionId = transactionId;
    payment.paymentMethod = paymentMethod;
    payment.paidAt = new Date().toISOString();
    if (metadata) payment.metadata = metadata;

    const subscription = this.activateSubscription(payment.userId, payment.planId, orderId);
    payment.subscriptionId = subscription.id;
    this.payments.set(orderId, payment);
    this.savePayments();
    return subscription;
  }
}

export const membershipStore = new MembershipStore();
