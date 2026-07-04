import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screenshots");
const BASE = "https://andaralab.id";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 60000 });
await page.locator('form input[type="text"]').first().fill("admin1");
await page.locator('form input[type="password"]').first().fill("AndaraLab@Secure#2026!");
await page.getByRole("button", { name: "Login" }).click();
await page.waitForTimeout(5000);

const blogBtn = page.getByText("Blog", { exact: true }).first();
if (await blogBtn.isVisible().catch(() => false)) await blogBtn.click();
await page.waitForTimeout(2000);

const edit = page.locator("button").filter({ hasText: /^Edit$/i }).first();
await edit.click({ timeout: 15000 });
await page.waitForTimeout(2500);

const visible = await page.getByText(/hide from macro outlook/i).isVisible();
await page.screenshot({
  path: path.join(OUT, "08-cms-hide-from-macro-outlook-checkbox.jpg"),
  type: "jpeg",
  quality: 88,
  fullPage: true,
});
console.log("CMS checkbox visible:", visible);
await browser.close();
process.exit(visible ? 0 : 1);
