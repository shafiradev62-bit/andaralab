// Member Authentication Routes
// Separate dari admin auth — untuk member yang daftar membership

import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { activityLogStore } from "../lib/store.js";
import { membershipStore } from "../lib/membership-store.js";
import { resolveJwtSecret } from "../lib/membership-config.js";

const router = Router();

const JWT_SECRET = resolveJwtSecret();
const JWT_EXPIRES_IN = "7d";

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  mobilePhone: z.string().min(10, "Nomor telepon tidak valid"),
  hasRDN: z.boolean(),
});

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function getUserAgent(req: Request): string | undefined {
  const ua = req.headers["user-agent"];
  if (typeof ua === "string") return ua.slice(0, 120);
  return undefined;
}

function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email, type: "member" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verifyToken(token: string): { userId: number; email: string; type: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; type: string };
    if (decoded.type !== "member") return null;
    return decoded;
  } catch {
    return null;
  }
}

function publicUser(user: { id: number; email: string; name: string; mobilePhone: string; hasRDN: boolean; emailVerified?: boolean }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mobilePhone: user.mobilePhone,
    hasRDN: user.hasRDN,
    emailVerified: user.emailVerified ?? false,
  };
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password, name, mobilePhone, hasRDN } = validation.data;
    const normalizedEmail = email.toLowerCase();

    if (membershipStore.getMemberByEmail(normalizedEmail)) {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = membershipStore.createMember({
      email: normalizedEmail,
      passwordHash,
      name,
      mobilePhone,
      hasRDN,
    });

    activityLogStore.log({
      action: "register",
      resource: "member",
      resourceId: String(user.id),
      resourceTitle: name,
      ip: getIp(req),
      userAgent: getUserAgent(req),
      detail: `Member registration: ${normalizedEmail}`,
    });

    const token = generateToken(user.id, normalizedEmail);

    return res.status(201).json({
      data: { user: publicUser(user), token },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase();
    const user = membershipStore.getMemberByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Akun Anda telah dinonaktifkan" });
    }

    membershipStore.updateMemberLogin(normalizedEmail);

    activityLogStore.log({
      action: "login",
      resource: "member",
      resourceId: String(user.id),
      resourceTitle: user.name,
      ip: getIp(req),
      userAgent: getUserAgent(req),
      detail: `Member login: ${normalizedEmail}`,
    });

    const token = generateToken(user.id, normalizedEmail);

    return res.json({
      data: { user: publicUser(user), token },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid or expired token" });

  const user = membershipStore.getMemberByEmail(decoded.email);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ data: publicUser(user) });
});

router.post("/logout", (req: Request, res: Response) => {
  const token = getBearerToken(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      activityLogStore.log({
        action: "logout",
        resource: "member",
        resourceId: String(decoded.userId),
        resourceTitle: decoded.email,
        ip: getIp(req),
        userAgent: getUserAgent(req),
        detail: `Member logout: ${decoded.email}`,
      });
    }
  }
  return res.json({ data: { success: true } });
});

export function requireMemberAuth(req: Request, res: Response, next: Function) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid or expired token" });

  const user = membershipStore.getMemberByEmail(decoded.email);
  if (!user || !user.isActive) return res.status(401).json({ error: "Unauthorized" });

  (req as any).user = user;
  next();
}

router.get("/admin/users", (_req: Request, res: Response) => {
  const users = membershipStore.listMembers().map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    mobilePhone: user.mobilePhone,
    hasRDN: user.hasRDN,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }));

  return res.json({ data: users });
});

export default router;
