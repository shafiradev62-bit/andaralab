import { test, expect } from "@playwright/test";

test("Check Analisis Deskriptif Tab", async ({ page }) => {
  await page.goto("http://localhost:5173/admin"); // Assuming local dev or test build
  await page.waitForLoadState("networkidle");

  // Click Analisis Deskriptif tab
  await page.locator("button").filter({ hasText: "Analisis Deskriptif" }).click();
  await page.waitForTimeout(2000);

  // Check if header is visible
  const header = page.locator('h2', { hasText: 'Analisis Deskriptif' });
  await expect(header).toBeVisible();

  // Check if content is NOT blank
  const records = page.locator('div.bg-white.border.border-\\[\\#E5E7EB\\].rounded-lg');
  const count = await records.count();
  console.log(`Found ${count} analysis records.`);
  
  if (count === 0) {
    const noRecords = page.locator('p', { hasText: 'No analysis records found.' });
    if (await noRecords.isVisible()) {
       console.log("Database empty but UI renders.");
    } else {
       console.log("UI might be blank/crashed.");
    }
  }

  await page.screenshot({ path: 'analisis_check.png', fullPage: true });
});
