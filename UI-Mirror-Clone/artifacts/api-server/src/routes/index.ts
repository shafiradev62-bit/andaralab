import { Router, type IRouter } from "express";
import healthRouter from "./health";
import datasetsRouter from "./datasets.js";
import pagesRouter from "./pages.js";
import blogPostsRouter from "./blog-posts.js";
import analisisRouter from "./analisis.js";
import featuredInsightsRouter from "./featured-insights.js";
import exchangeRatesRouter from "./exchange-rates.js";
import calendarRouter from "./calendar.js";
import calendarConfigRouter from "./calendar-config.js";
import webhookRouter from "./webhook.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/datasets", datasetsRouter);
router.use("/pages",    pagesRouter);
router.use("/blog",     blogPostsRouter);
router.use("/analisis", analisisRouter);
router.use("/featured-insights", featuredInsightsRouter);
router.use("/exchange-rates", exchangeRatesRouter);
router.use("/calendar/events", calendarRouter);
router.use("/calendar/config", calendarConfigRouter);
router.use("/webhook", webhookRouter);

export default router;
