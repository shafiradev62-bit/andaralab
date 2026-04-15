import { test } from "@playwright/test";

test("Hunt Blank Screen Bug", async ({ page }) => {
  page.on("console", msg => console.log("BROWSER CONSOLE:", msg.text()));
  page.on("pageerror", err => console.log("BROWSER ERROR:", err.message));

  await page.goto("/admin");
  await page.waitForLoadState("networkidle");

  const timestamp = Date.now().toString().slice(-4);
  const pageSlug = `/macro/auto-page-${timestamp}`;
  const pageTitle = `Auto Target Page ${timestamp}`;

  console.log(`Creating page ${pageSlug}...`);

  await page.locator("button").filter({ hasText: "Pages" }).click();
  await page.waitForTimeout(1000);
  await page.locator("button").filter({ hasText: /new page/i }).first().click();
  await page.waitForTimeout(1000);

  const allInputs = page.locator('input[type="text"]');
  await allInputs.first().fill(pageSlug);
  await allInputs.nth(1).fill(pageTitle);
  
  // Choose Published
  await page.locator("button").filter({ hasText: "Published (live)" }).click();

  // Pick section to make sure it enters navbar
  await page.locator("select").first().selectOption("Macro Foundations");

  await page.locator("button").filter({ hasText: "Save" }).click();
  
  await page.waitForTimeout(2000);
  console.log("Navigating to public URL...");

  // Navigate directly
  await page.goto(pageSlug);
  await page.waitForLoadState("networkidle");
  // Give it 2 seconds for any render errors
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  if (content.includes(pageTitle)) {
    console.log("SUCCESS! Title found in HTML.");
  } else {
    console.log("FAILED! Title not found. Page is blank?");
  }
});
