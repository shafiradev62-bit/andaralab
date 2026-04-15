import { test } from "@playwright/test";

test("Debug Page Response", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");

  const timestamp = Date.now().toString().slice(-4);
  const pageSlug = `/macro/auto-page-${timestamp}`;
  const pageTitle = `Auto Target Page ${timestamp}`;

  // Create page
  await page.locator("button").filter({ hasText: "Pages" }).click();
  await page.waitForTimeout(1000);
  await page.locator("button").filter({ hasText: /new page/i }).first().click();
  await page.waitForTimeout(1000);

  const allInputs = page.locator('input[type="text"]');
  await allInputs.first().fill(pageSlug);
  await allInputs.nth(1).fill(pageTitle);
  await page.locator("button").filter({ hasText: "Published (live)" }).click();
  await page.locator("button").filter({ hasText: "Save" }).click();
  
  await page.waitForTimeout(2000);

  // Navigate directly
  await page.goto(pageSlug);
  await page.waitForLoadState("networkidle");
  const content = await page.content();
  console.log("=== HTML START ===");
  console.log(content);
  console.log("=== HTML END ===");
});
