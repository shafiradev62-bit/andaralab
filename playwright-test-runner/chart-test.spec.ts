import { test, expect, type Page } from "@playwright/test";
import path from "path";

async function waitReady(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

test("Update Description for Existing Chart and Capture Result", async ({ page }) => {
  const timestamp = Date.now().toString().slice(-4);
  const newDesc = `Updated description via Playwright at ${timestamp}. Check if this text appears correctly on the site!`;

  console.log(`\n▶ [Data Hub] Navigating to Admin...`);
  await page.goto("/admin");
  await waitReady(page);

  // Go to Data Hub tab
  console.log(`  - Switching to Data Hub tab`);
  await page.locator("button").filter({ hasText: "Data Hub" }).click();
  await page.waitForTimeout(2000);

  // Find the first dataset and click Edit
  console.log(`  - Clicking Edit on the first dataset`);
  const firstRow = page.locator('.bg-white.border.border-gray-200').first();
  await firstRow.locator('button').filter({ hasText: "Edit" }).click();
  await page.waitForTimeout(1500);

  // Fill Description
  console.log(`  - Updating Description`);
  const descArea = page.locator('textarea').first();
  await descArea.fill(newDesc);

  // Save
  console.log(`  - Saving Dataset`);
  await page.locator("button").filter({ hasText: "Save Dataset" }).click();
  
  // Wait for it to show "Dataset saved successfully" or return to list
  await page.waitForTimeout(2500);
  console.log(`  ✅ Dataset updated!`);

  // Navigate to Public Data Hub page
  console.log(`  - Navigating to Public Data Hub to verify...`);
  await page.goto("/data-hub");
  await waitReady(page);

  // Verify the new description appears
  console.log(`  - Verifying the new description on the public page...`);
  await expect(page.locator(`text=${newDesc}`)).toBeVisible({ timeout: 10000 });
  
  // Take screenshot
  const screenshotPath = path.resolve(process.cwd(), "chart-description-update.jpg");
  await page.screenshot({ path: screenshotPath, type: "jpeg", quality: 90, fullPage: true });
  console.log(`  📸 Result captured: ${screenshotPath}`);
  
  // Also take a focused screenshot of the chart
  const chartSection = page.locator('.bg-white.border.border-gray-200').filter({ hasText: newDesc });
  const chartScreenshotPath = path.resolve(process.cwd(), "chart-focus.jpg");
  await chartSection.screenshot({ path: chartScreenshotPath, type: "jpeg", quality: 90 });
  console.log(`  📸 Focused chart screenshot captured: ${chartScreenshotPath}`);
});
