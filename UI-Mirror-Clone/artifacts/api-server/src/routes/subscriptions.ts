// Subscriptions & Payments Routes — Midtrans Snap (sandbox)

import { Router } from "express";
import type { Request, Response } from "express";
import { requireMemberAuth } from "./member-auth.js";
import { activityLogStore } from "../lib/store.js";
import { membershipStore } from "../lib/membership-store.js";
import { resolveMidtransConfig } from "../lib/membership-config.js";

const router = Router();

function getMidtransUrls(isProduction: boolean) {
  return {
    snap: isProduction ? "https://app.midtrans.com/snap/v1" : "https://app.sandbox.midtrans.com/snap/v1",
    status: isProduction ? "https://api.midtrans.com/v2" : "https://api.sandbox.midtrans.com/v2",
  };
}

const DEFAULT_ENABLED_PAYMENTS = [
  "credit_card",
  "bca_va",
  "bni_va",
  "bri_va",
  "mandiri_va",
  "permata_va",
  "other_va",
  "gopay",
  "shopeepay",
  "qris",
];

function midtransAuth(serverKey: string): string {
  return Buffer.from(`${serverKey}:`).toString("base64");
}

function generateOrderId(): string {
  return `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function isPaymentSuccess(status: string, fraudStatus?: string): boolean {
  if (status === "settlement") return true;
  if (status === "capture" && (fraudStatus === "accept" || !fraudStatus)) return true;
  return false;
}

async function fetchMidtransStatus(orderId: string, serverKey: string, isProduction: boolean): Promise<any | null> {
  const { status: statusBase } = getMidtransUrls(isProduction);
  try {
    const res = await fetch(`${statusBase}/${orderId}/status`, {
      headers: { Authorization: `Basic ${midtransAuth(serverKey)}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Midtrans status check failed:", err);
    return null;
  }
}

function processSettlement(orderId: string, notification: Record<string, any>) {
  const payment = membershipStore.getPayment(orderId);
  if (!payment) return null;

  if (payment.status === "settlement" && payment.subscriptionId) {
    return membershipStore.listSubscriptions().find((s) => s.id === payment.subscriptionId) ?? null;
  }

  return membershipStore.settlePayment(
    orderId,
    notification.transaction_id || notification.transactionId || orderId,
    notification.payment_type || "unknown",
    JSON.stringify(notification),
  );
}

router.get("/plans", (_req: Request, res: Response) => {
  return res.json({ data: membershipStore.listActivePlans() });
});

router.get("/payment-config", (_req: Request, res: Response) => {
  const cfg = resolveMidtransConfig();
  const keysConfigured =
    !cfg.serverKey.includes("CHANGE") &&
    !cfg.clientKey.includes("CHANGE") &&
    !cfg.serverKey.includes("REPLACE") &&
    !cfg.clientKey.includes("REPLACE");
  return res.json({
    data: {
      clientKey: cfg.clientKey,
      isSandbox: !cfg.isProduction,
      keysConfigured,
      payoutBank: cfg.payoutBank,
      payoutAccountName: cfg.payoutAccountName,
      payoutAccountNumber: cfg.payoutAccountNumber,
      enabledPayments: cfg.enabledPayments ?? DEFAULT_ENABLED_PAYMENTS,
    },
  });
});

router.post("/create-payment", requireMemberAuth, async (req: Request, res: Response) => {
  try {
    const midtransCfg = resolveMidtransConfig();
    const { snap: snapBase } = getMidtransUrls(midtransCfg.isProduction);
    const user = (req as any).user;
    const planId = Number(req.body?.planId);

    if (!planId) {
      return res.status(400).json({ error: "planId is required" });
    }

    const plan = membershipStore.getPlan(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: "Plan not found or inactive" });
    }

    const orderId = generateOrderId();
    membershipStore.createPayment({
      userId: user.id,
      planId: plan.id,
      orderId,
      amount: plan.price,
      currency: plan.currency,
    });

    const snapPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseInt(plan.price, 10),
      },
      item_details: [
        {
          id: plan.slug,
          price: parseInt(plan.price, 10),
          quantity: 1,
          name: plan.name,
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.mobilePhone,
      },
      enabled_payments: midtransCfg.enabledPayments?.length
        ? midtransCfg.enabledPayments
        : DEFAULT_ENABLED_PAYMENTS,
    };

    const snapResponse = await fetch(`${snapBase}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${midtransAuth(midtransCfg.serverKey)}`,
      },
      body: JSON.stringify(snapPayload),
    });

    if (!snapResponse.ok) {
      const errorData = await snapResponse.json();
      console.error("Midtrans error:", errorData);
      throw new Error(errorData.error_messages?.[0] || "Failed to create payment");
    }

    const snapData = await snapResponse.json();

    membershipStore.updatePayment(orderId, {
      transactionId: snapData.token,
      metadata: JSON.stringify({ snap_token: snapData.token, redirect_url: snapData.redirect_url, planId: plan.id }),
    });

    activityLogStore.log({
      action: "create_payment",
      resource: "payment",
      resourceId: orderId,
      resourceTitle: `${plan.name} - ${user.email}`,
      ip: getIp(req),
      detail: `Payment created: ${orderId} for plan ${plan.name}`,
    });

    return res.json({
      data: {
        orderId,
        snapToken: snapData.token,
        redirectUrl: snapData.redirect_url,
        clientKey: midtransCfg.clientKey,
        isSandbox: !midtransCfg.isProduction,
      },
    });
  } catch (error: any) {
    console.error("Create payment error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Confirm payment after Snap onSuccess — needed for sandbox without webhook
router.post("/confirm-payment", requireMemberAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orderId = req.body?.orderId as string;

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const payment = membershipStore.getPayment(orderId);
    if (!payment || payment.userId !== user.id) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status === "settlement" && payment.subscriptionId) {
      const sub = membershipStore.listSubscriptions().find((s) => s.id === payment.subscriptionId);
      const plan = sub ? membershipStore.getPlan(sub.planId) : undefined;
      return res.json({ data: { subscription: sub, plan, alreadyActive: true } });
    }

    const midtransCfg = resolveMidtransConfig();
    const statusData = await fetchMidtransStatus(orderId, midtransCfg.serverKey, midtransCfg.isProduction);
    if (!statusData) {
      return res.status(502).json({ error: "Gagal memverifikasi status pembayaran" });
    }

    if (!isPaymentSuccess(statusData.transaction_status, statusData.fraud_status)) {
      membershipStore.updatePayment(orderId, {
        status: statusData.transaction_status || "pending",
        metadata: JSON.stringify(statusData),
      });
      return res.status(402).json({
        error: "Pembayaran belum selesai",
        status: statusData.transaction_status,
      });
    }

    const subscription = processSettlement(orderId, statusData);
    if (!subscription) {
      return res.status(500).json({ error: "Gagal mengaktifkan subscription" });
    }

    const plan = membershipStore.getPlan(subscription.planId);

    activityLogStore.log({
      action: "payment_success",
      resource: "payment",
      resourceId: orderId,
      resourceTitle: `Subscription activated for user ${user.id}`,
      ip: getIp(req),
      detail: `Payment ${orderId} confirmed via client callback`,
    });

    return res.json({ data: { subscription, plan } });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/webhook/midtrans", async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    const orderId = notification.order_id as string;
    const transactionStatus = notification.transaction_status as string;
    const fraudStatus = notification.fraud_status as string | undefined;

    console.log("Midtrans webhook:", { orderId, transactionStatus, fraudStatus });

    const payment = membershipStore.getPayment(orderId);
    if (!payment) {
      console.error("Payment not found:", orderId);
      return res.status(404).json({ error: "Payment not found" });
    }

    membershipStore.updatePayment(orderId, {
      transactionId: notification.transaction_id,
      paymentMethod: notification.payment_type,
      metadata: JSON.stringify(notification),
    });

    if (isPaymentSuccess(transactionStatus, fraudStatus)) {
      processSettlement(orderId, notification);
      activityLogStore.log({
        action: "payment_success",
        resource: "payment",
        resourceId: orderId,
        resourceTitle: `Subscription activated for user ${payment.userId}`,
        ip: "midtrans-webhook",
        detail: `Payment ${orderId} settled via webhook`,
      });
    } else if (transactionStatus === "pending") {
      membershipStore.updatePayment(orderId, { status: "pending" });
    } else if (["deny", "cancel", "expire", "refund"].includes(transactionStatus)) {
      membershipStore.updatePayment(orderId, { status: transactionStatus });
    }

    return res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-subscription", requireMemberAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const subscription = membershipStore.getActiveSubscription(user.id);

  if (!subscription) {
    return res.json({ data: null });
  }

  const plan = membershipStore.getPlan(subscription.planId);
  return res.json({ data: { ...subscription, plan } });
});

router.get("/check-access", requireMemberAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  return res.json({ data: { hasAccess: membershipStore.hasActiveAccess(user.id) } });
});

router.get("/admin/subscriptions", (_req: Request, res: Response) => {
  const subs = membershipStore.listSubscriptions().map((sub) => {
    const user = membershipStore.getMemberById(sub.userId);
    const plan = membershipStore.getPlan(sub.planId);
    return {
      ...sub,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      plan: plan ? { id: plan.id, name: plan.name, price: plan.price } : null,
    };
  });
  return res.json({ data: subs });
});

router.get("/admin/payments", (_req: Request, res: Response) => {
  return res.json({ data: membershipStore.listPayments() });
});

router.get("/admin/plans", (_req: Request, res: Response) => {
  return res.json({ data: membershipStore.listAllPlans() });
});

router.patch("/admin/plans/:id", (req: Request, res: Response) => {
  const planId = parseInt(req.params.id, 10);
  const { price, isActive, name, description } = req.body;

  const plan = membershipStore.updatePlan(planId, {
    ...(price !== undefined && { price: String(price) }),
    ...(isActive !== undefined && { isActive }),
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
  });

  if (!plan) {
    return res.status(404).json({ error: "Plan not found" });
  }

  activityLogStore.log({
    action: "update",
    resource: "subscription_plan",
    resourceId: String(planId),
    resourceTitle: plan.name,
    ip: getIp(req),
    detail: `Plan updated: ${plan.name}`,
  });

  return res.json({ data: plan });
});

export default router;
