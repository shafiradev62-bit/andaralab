import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { activityLogger } from "./middlewares/activity-logger.js";

const app: Express = express();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(activityLogger);
app.use("/api", router);

export default app;
