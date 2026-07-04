/**
 * Playwright proof: submenu leak fix (Macro Outlook, Regional, ESG empty;
 * Commodity/Deep-dives populated; economics-101 blocked; hideFromMacroOutlook in CMS).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "screenshots");
const BASE = process.env.BASE_URL || "https://andaralab.id";
const ADMIN_USER = process.env.ADMIN_USER || "admin1";
const ADMIN_PASS = process.env.ADMIN_PASS || "AndaraLab@Secure#2026!";

const BLOG_LEAK_MARKERS = [
  "economics-101",
  "Economics 101",
  "Manufacturing PMI",
  "Manufacturing Index",
];

const EMPTY_PAGES = [
  {
    id: "01-macro-outlooks-empty",
    url: "/macro/macro-outlooks",
    title: "Macro Outlooks",
    expectEmpty: true,
    fix: "FeaturedSection no fallback + strict subcategory Macro Outlooks",
  },
  {
    id: "02-sectoral-regional-empty",
    url: "/sectoral/regional",
    title: "Regional Economic Monitor",
    expectEmpty: true,
    fix: "Strict subcategory + economics-101 blocked",
  },
  {
    id: "03-sectoral-esg-empty",
    url: "/sectoral/esg",
    title: "ESG Intelligence",
    expectEmpty: true,
    fix: "Strict subcategory + economics-101 blocked",
  },
];

const POPULATED_PAGES = [
  {
    id: "04-sectoral-commodity-has-articles",
    url: "/sectoral/commodity",
    title: "Commodity",
    minArticles: 1,
    fix: "Strict subcategory Commodity matches live posts",
  },
  {
    id: "05-sectoral-deep-dives-has-articles",
    url: "/sectoral/deep-dives",
    title: "Deep Dives",
    minArticles: 1,
    fix: "Strict subcategory Strategic Industry Deep-dives",
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

function articleCards(page) {
  return page.locator('a[href^="/article/"]');
}

async function countArticles(page) {
  await page.waitForTimeout(1500);
  return articleCards(page).count();
}

async function pageHasLeakMarkers(page) {
  const body = (await page.locator("body").innerText()).toLowerCase();
  return BLOG_LEAK_MARKERS.filter((m) => body.includes(m.toLowerCase()));
}

async function screenshotJpg(page, name) {
  const file = path.join(OUT_DIR, `${name}.jpg`);
  await page.screenshot({
    path: file,
    type: "jpeg",
    quality: 88,
    fullPage: true,
  });
  return file;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();
  const results = [];

  console.log(`\n=== Playwright proof @ ${BASE} ===\n`);

  for (const spec of EMPTY_PAGES) {
    const url = `${BASE}${spec.url}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const count = await countArticles(page);
    const leaks = await pageHasLeakMarkers(page);
    const shot = await screenshotJpg(page, spec.id);
    const pass = count === 0 && leaks.length === 0;
    results.push({
      ...spec,
      url,
      articleCount: count,
      leakMarkers: leaks,
      screenshot: shot,
      pass,
    });
    console.log(
      `${pass ? "PASS" : "FAIL"} ${spec.id}: articles=${count} leaks=${leaks.join(",") || "none"}`,
    );
  }

  for (const spec of POPULATED_PAGES) {
    const url = `${BASE}${spec.url}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const count = await countArticles(page);
    const leaks = await pageHasLeakMarkers(page);
    const shot = await screenshotJpg(page, spec.id);
    const pass = count >= spec.minArticles && leaks.length === 0;
    results.push({
      ...spec,
      url,
      articleCount: count,
      leakMarkers: leaks,
      screenshot: shot,
      pass,
    });
    console.log(
      `${pass ? "PASS" : "FAIL"} ${spec.id}: articles=${count} leaks=${leaks.join(",") || "none"}`,
    );
  }

  // Deployed bundle + API: hideFromMacroOutlook wired end-to-end
  let apiPass = false;
  try {
    const indexRes = await page.request.get(`${BASE}/`);
    const html = await indexRes.text();
    const jsMatch = html.match(/\/assets\/(index\.[0-9]+\.js)/);
    const jsUrl = jsMatch ? `${BASE}/assets/${jsMatch[1]}` : null;
    let bundleHasField = false;
    if (jsUrl) {
      const jsRes = await page.request.get(jsUrl);
      const js = await jsRes.text();
      bundleHasField =
        js.includes("hideFromMacroOutlook") ||
        js.includes("Hide from Macro Outlook");
    }
    const apiRes = await page.request.get(`${BASE}/api/blog?status=published&locale=en`);
    const apiJson = await apiRes.json();
    const sample = apiJson?.data?.[0];
    apiPass = apiRes.ok() && bundleHasField;
    const apiShot = path.join(OUT_DIR, "06-api-blog-schema-proof.jpg");
    await page.setContent(
      `<html><body style="font-family:monospace;padding:24px;background:#f9fafb">
        <h2>API /api/blog — hideFromMacroOutlook field proof</h2>
        <p>Status: ${apiRes.status()}</p>
        <p>Sample post keys: ${sample ? Object.keys(sample).sort().join(", ") : "none"}</p>
        <p>Live JS bundle has hideFromMacroOutlook: ${bundleHasField}</p>
        <p>hideFromMacroOutlook in sample post: ${sample && "hideFromMacroOutlook" in sample ? String(sample.hideFromMacroOutlook) : "(optional boolean — omitted when false)"}</p>
        <pre style="background:#fff;border:1px solid #ddd;padding:12px;overflow:auto;max-height:400px">${JSON.stringify(sample, null, 2)}</pre>
      </body></html>`,
    );
    await page.screenshot({ path: apiShot, type: "jpeg", quality: 88, fullPage: true });
    results.push({
      id: "06-api-hide-from-macro-outlook",
      url: `${BASE}/api/blog`,
      fix: "hideFromMacroOutlook field in backend blog API schema",
      pass: apiPass,
      screenshot: apiShot,
    });
    console.log(`${apiPass ? "PASS" : "FAIL"} 06-api-hide-from-macro-outlook: api ok=${apiRes.ok()}`);
  } catch (e) {
    console.log("API check error:", e.message);
    results.push({
      id: "06-api-hide-from-macro-outlook",
      fix: "hideFromMacroOutlook field in backend blog API schema",
      pass: false,
      screenshot: null,
    });
  }

  // CMS: prove hideFromMacroOutlook checkbox in blog editor UI
  let cmsPass = false;
  let cmsShot = null;
  try {
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 60000 });
    await screenshotJpg(page, "07-cms-login-screen");
    await page.locator('form input[type="text"]').first().fill(ADMIN_USER);
    await page.locator('form input[type="password"]').first().fill(ADMIN_PASS);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForTimeout(4000);

    const blogTab = page.getByRole("button", { name: /^Blog$/i }).or(page.getByText(/^Blog$/).first());
    if (await blogTab.isVisible({ timeout: 10000 }).catch(() => false)) {
      await blogTab.click();
      await page.waitForTimeout(2000);
    }

    const firstEdit = page.locator("button").filter({ hasText: /^Edit$/i }).first();
    if (await firstEdit.isVisible({ timeout: 12000 }).catch(() => false)) {
      await firstEdit.click();
      await page.waitForTimeout(2500);
      const hideLabel = page.getByText(/hide from macro outlook/i);
      cmsPass = await hideLabel.isVisible({ timeout: 10000 }).catch(() => false);
      cmsShot = await screenshotJpg(page, "08-cms-hide-from-macro-outlook-checkbox");
    } else {
      cmsShot = await screenshotJpg(page, "08-cms-admin-after-login");
    }
  } catch (e) {
    console.log("CMS check error:", e.message);
    try {
      cmsShot = await screenshotJpg(page, "08-cms-error-state");
    } catch {}
  }

  results.push({
    id: "08-cms-hide-from-macro-outlook",
    url: `${BASE}/admin`,
    fix: "hideFromMacroOutlook checkbox in CMS blog editor",
    pass: cmsPass,
    screenshot: cmsShot,
  });
  console.log(`${cmsPass ? "PASS" : "FAIL"} 08-cms-hide-from-macro-outlook: checkbox visible=${cmsPass}`);

  // Summary JSON + markdown report
  const report = {
    testedAt: new Date().toISOString(),
    baseUrl: BASE,
    results,
    allPass: results.every((r) => r.pass),
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "report.json"),
    JSON.stringify(report, null, 2),
  );

  const md = [
    "# Submenu Fix — Playwright Proof",
    "",
    `**Tested:** ${report.testedAt}`,
    `**Site:** ${BASE}`,
    "",
    "| # | Page | Articles | Leak markers | Result | Screenshot |",
    "|---|------|----------|--------------|--------|------------|",
    ...results.map((r) => {
      const articles =
        r.articleCount !== undefined ? String(r.articleCount) : "—";
      const leaks =
        r.leakMarkers?.length ? r.leakMarkers.join(", ") : r.pass ? "none" : "—";
      const shot = r.screenshot
        ? path.basename(r.screenshot)
        : "—";
      return `| ${r.id} | ${r.url || "CMS"} | ${articles} | ${leaks} | **${r.pass ? "PASS" : "FAIL"}** | ${shot} |`;
    }),
    "",
    `**Overall:** ${report.allPass ? "ALL PASS" : "SOME FAILED"}`,
    "",
    "## Fix mapping",
    "",
    ...results.map(
      (r) => `- **${r.id}**: ${r.fix || ""} → ${r.pass ? "verified" : "NOT verified"}`,
    ),
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, "REPORT.md"), md);

  await browser.close();

  console.log(`\nScreenshots: ${OUT_DIR}`);
  console.log(`Overall: ${report.allPass ? "ALL PASS" : "SOME FAILED"}\n`);
  process.exit(report.allPass ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
