// AndaraLab Membership & Subscription Schema
// Created: 2026-06-22
// Purpose: User authentication, subscriptions, payments untuk Analysis member area

import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  index,
  boolean,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Users Table ──────────────────────────────────────────────────────────────
//
// Core user/member entity. Separate dari admin (admin tetap pakai auth lama).
// Password disimpan sebagai bcrypt hash.
//
// Role:
//   member — regular paying member (akses Analysis area)
//   admin  — internal admin (reserved untuk future RBAC)

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),

    // ── Identity
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    
    // ── Profile (dari registration form)
    name: varchar("name", { length: 255 }).notNull(),
    mobilePhone: varchar("mobile_phone", { length: 20 }).notNull(),
    hasRDN: boolean("has_rdn").notNull().default(false), // Sudah punya RDN?

    // ── Role & Status
    role: varchar("role", { length: 16 }).notNull().default("member"), // member | admin
    isActive: boolean("is_active").notNull().default(true), // untuk suspend/ban
    emailVerified: boolean("email_verified").notNull().default(false),

    // ── Audit
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    lastLoginAt: timestamp("last_login_at", { mode: "string" }),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
    index("idx_users_is_active").on(table.isActive),
  ]
);

// ─── Subscription Plans Table ─────────────────────────────────────────────────
//
// Plan definitions (konfigurabel via admin panel).
// Awalnya cuma 1 plan: "Analysis Access" Rp 1.000/tahun.

export const subscriptionPlansTable = pgTable(
  "subscription_plans",
  {
    id: serial("id").primaryKey(),

    // ── Plan details
    name: varchar("name", { length: 128 }).notNull(), // e.g. "Analysis Access"
    slug: varchar("slug", { length: 64 }).notNull().unique(), // e.g. "analysis-access"
    description: text("description"),

    // ── Pricing
    price: decimal("price", { precision: 10, scale: 2 }).notNull(), // IDR amount
    currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
    durationMonths: integer("duration_months").notNull().default(12), // 12 = 1 tahun

    // ── Status
    isActive: boolean("is_active").notNull().default(true), // hide dari public jika false

    // ── Features (JSON array of strings untuk display)
    features: text("features").array().notNull().default(["Access to Analysis section"]),

    // ── Audit
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_subscription_plans_slug").on(table.slug),
    index("idx_subscription_plans_is_active").on(table.isActive),
  ]
);

// ─── Subscriptions Table ──────────────────────────────────────────────────────
//
// User subscription records. Satu user bisa punya multiple subscriptions
// (history renewal).
//
// Status:
//   pending  — waiting payment
//   active   — paid and valid (startsAt <= now < endsAt)
//   expired  — endsAt passed
//   cancelled — user cancelled before expiry

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),

    // ── Relations
    userId: integer("user_id").notNull(), // FK to users.id
    planId: integer("plan_id").notNull(), // FK to subscription_plans.id

    // ── Status & Validity
    status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | active | expired | cancelled
    startsAt: timestamp("starts_at", { mode: "string" }), // null until payment confirmed
    endsAt: timestamp("ends_at", { mode: "string" }),     // null until payment confirmed

    // ── Payment tracking
    paymentId: varchar("payment_id", { length: 128 }), // reference to payments.id

    // ── Auto-renewal (future)
    autoRenew: boolean("auto_renew").notNull().default(false),

    // ── Audit
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    cancelledAt: timestamp("cancelled_at", { mode: "string" }),
  },
  (table) => [
    index("idx_subscriptions_user_id").on(table.userId),
    index("idx_subscriptions_status").on(table.status),
    index("idx_subscriptions_ends_at").on(table.endsAt),
  ]
);

// ─── Payments Table ───────────────────────────────────────────────────────────
//
// Transaction history untuk semua payments via Midtrans.
// One payment → one subscription activation.
//
// Status:
//   pending     — order created, waiting payment
//   settlement  — payment confirmed by Midtrans
//   cancel      — payment cancelled/expired
//   deny        — payment denied by bank/fraud detection
//   expire      — payment link expired
//   refund      — payment refunded

export const paymentsTable = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),

    // ── Relations
    userId: integer("user_id").notNull(), // FK to users.id
    subscriptionId: integer("subscription_id"), // FK to subscriptions.id (null sampai subscription created)

    // ── Midtrans identifiers
    orderId: varchar("order_id", { length: 128 }).notNull().unique(), // e.g. "ORDER-1234567890"
    transactionId: varchar("transaction_id", { length: 128 }), // Midtrans transaction_id

    // ── Payment details
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
    paymentMethod: varchar("payment_method", { length: 64 }), // e.g. "bank_transfer", "gopay", "qris"

    // ── Status tracking
    status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | settlement | cancel | deny | expire | refund
    statusMessage: text("status_message"), // error messages dari Midtrans

    // ── Timestamps dari Midtrans
    paidAt: timestamp("paid_at", { mode: "string" }),
    expiredAt: timestamp("expired_at", { mode: "string" }), // payment link expiry

    // ── Metadata (full Midtrans webhook payload untuk audit)
    metadata: text("metadata"), // JSON string dari Midtrans notification

    // ── Audit
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_payments_user_id").on(table.userId),
    index("idx_payments_order_id").on(table.orderId),
    index("idx_payments_status").on(table.status),
    index("idx_payments_subscription_id").on(table.subscriptionId),
  ]
);

// ─── Session Tokens Table (Optional - untuk JWT refresh tokens) ──────────────
//
// Kalau pakai JWT dengan refresh token pattern.
// Untuk sekarang skip dulu, pakai JWT sederhana dengan expiry.

// ─── Insert Schemas (Zod) ─────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlansTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Partial / Patch Schemas ──────────────────────────────────────────────────

export const updateUserSchema = insertUserSchema.partial();
export const updateSubscriptionPlanSchema = insertSubscriptionPlanSchema.partial();
export const updateSubscriptionSchema = insertSubscriptionSchema.partial();
export const updatePaymentSchema = insertPaymentSchema.partial();

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UpdateSubscriptionPlan = z.infer<typeof updateSubscriptionPlanSchema>;

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;
