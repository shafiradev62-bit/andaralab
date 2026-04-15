import { test } from "@playwright/test";

test("Check localStorage", async ({ page }) => {
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

  const ls = await page.evaluate(() => localStorage.getItem("andaralab_pages"));
  console.log("=== LOCAL STORAGE ===");
  if (ls) {
    const pages = JSON.parse(ls);
    const found = pages.find((p: any) => p.slug === pageSlug);
    console.log("Found in LS?", !!found);
    if (found) console.log(found);
  } else {
    console.log("NO LOCAL STORAGE FOR PAGES!");
  }
  console.log("=====================");
});
