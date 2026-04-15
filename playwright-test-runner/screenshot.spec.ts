import { test, expect } from "@playwright/test";

test("Capture Screenshot", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");

  const timestamp = Date.now().toString().slice(-4);
  const pageSlug = `/macro/auto-page-${timestamp}`;
  const pageTitle = `Auto Target Page ${timestamp}`;

  await page.locator("button").filter({ hasText: "Pages" }).click();
  await page.waitForTimeout(1000);
  await page.locator("button").filter({ hasText: /new page/i }).first().click();
  await page.waitForTimeout(1000);

  const allInputs = page.locator('input[type="text"]');
  await allInputs.first().fill(pageSlug);
  await allInputs.nth(1).fill(pageTitle);
  
  await page.locator("button").filter({ hasText: "Published (live)" }).click();
  await page.locator("select").first().selectOption("Macro Foundations");

  await page.locator("button").filter({ hasText: "Save" }).click();
  
  await page.waitForTimeout(2000);

  // Navigate directly
  await page.goto(pageSlug);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  
  // CAPTURE WHAT IT LOOKS LIKE
  await page.screenshot({ path: "blank-issue.png" });
  console.log("SCREENSHOT TAKEN! CHECK blank-issue.png");

  // DUMP ALL TEXT ON PAGE
  const text = await page.locator("body").innerText();
  console.log("--- TEXT CONTENT ---");
  console.log(text);
  console.log("--------------------");
});
