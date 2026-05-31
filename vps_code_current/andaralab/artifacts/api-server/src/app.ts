import express, { type Express, type Request } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { activityLogger } from "./middlewares/activity-logger.js";
import { requireAdminAuth, type AdminAuthRequest } from "./middlewares/admin-auth.js";

const app: Express = express();
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:4173",
  "http://localhost:3001",
  "http://76.13.17.91",
  "http://76.13.17.91:80",
  "http://76.13.17.91:3000",
  "http://76.13.17.91:3001",
  "http://76.13.17.91:5173",
  // Vercel production & preview deployments
  "https://andaralab-ui.vercel.app",
  "https://andaralab-lkxp7b875-rahmis-projects-881d2cc1.vercel.app",
  "https://andara-lab.vercel.app",
  "https://andara-cl3il0m9o-rahmis-projects-881d2cc1.vercel.app",
];

/** Comma-separated extra origins (e.g. https://lab.example.com,http://10.0.0.5:8080) */
const extraOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (process.env.CORS_ALLOW_ALL !== "false") {
      return callback(null, true);
    }
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Dynamic localhost allowing for development (all ports)
    if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (extraOrigins.includes(origin)) return callback(null, true);
    // Allow all Vercel preview/deployment URLs
    if (origin && origin.includes(".vercel.app")) return callback(null, true);
    // Self-hosted deployments (same IP, any port)
    if (/^https?:\/\/76\.13\.17\.91(?::\d+)?$/i.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(activityLogger);

app.use((req, res, next) => {
  const isLocalHost = req.hostname === "localhost" || req.hostname === "127.0.0.1";
  const forwardedProto = (req.headers["x-forwarded-proto"] ?? "").toString().split(",")[0].trim();
  const isHttps = req.secure || forwardedProto === "https";
  const forceHttps = process.env.FORCE_HTTPS === "true";

  if (forceHttps && !isLocalHost && !isHttps) {
    const host = req.headers.host;
    if (host) {
      return res.redirect(308, `https://${host}${req.originalUrl}`);
    }
  }

  if (!isLocalHost && isHttps) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Prevent browser/proxy caching on all API responses
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

function isProtectedAdminApi(req: Request): boolean {
  const apiPath = req.path;
  const method = req.method.toUpperCase();
  const isMutation = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  const cmsPath =
    apiPath.startsWith("/datasets") ||
    apiPath.startsWith("/pages") ||
    apiPath.startsWith("/blog") ||
    apiPath.startsWith("/analisis") ||
    apiPath.startsWith("/featured-insights") ||
    apiPath.startsWith("/exchange-rates") ||
    apiPath.startsWith("/calendar/events") ||
    apiPath.startsWith("/calendar/config") ||
    apiPath.startsWith("/webhook");

  if (apiPath.startsWith("/auth/login")) return false;
  if (apiPath.startsWith("/health")) return false;
  if (apiPath.startsWith("/activity")) return true;
  return isMutation && cmsPath;
}

app.use("/api", (req, res, next) => {
  if (!isProtectedAdminApi(req)) return next();
  return requireAdminAuth(req as AdminAuthRequest, res, next);
});

app.use("/api", router);

export default app;
