import { test, expect, type Page } from "@playwright/test";

async function waitReady(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function goToTab(page: Page, tabName: "Data Hub" | "Pages" | "Blog") {
  const tab = page.locator("button").filter({ hasText: tabName });
  await tab.waitFor({ state: "visible", timeout: 15_000 });
  await tab.click();
  await page.waitForTimeout(1000);
}

test.describe("Real Deploy Blog Test", () => {
  const timestamp = Math.floor(Date.now() / 1000).toString().slice(-5);
  const postSlug = `real-test-${timestamp}`;
  const postTitle = `AndaraLab Production Test Post ${timestamp}`;
  const postBody = `This is a real blog post content created by Antigravity AI to verify the VPS deployment.\n\nTime: ${new Date().toLocaleString()}\n\nDeployment Status: Verified.`;

  test("Create Blog Post on VPS and Verify", async ({ page }) => {
    // 1. Go to Admin
    console.log(`Navigating to Admin...`);
    await page.goto("/admin");
    await waitReady(page);

    // 2. Go to Blog Tab
    console.log(`Switching to Blog tab...`);
    await goToTab(page, "Blog");

    // 3. Create New Post
    console.log(`Creating new post: ${postTitle}`);
    const newPostBtn = page.locator("button").filter({ hasText: /new post/i }).first();
    await newPostBtn.click();
    await page.waitForTimeout(1000);

    const allInputs = page.locator('input[type="text"]');
    
    // Slug
    await allInputs.first().fill(postSlug);
    // Title
    await allInputs.nth(1).fill(postTitle);

    // Excerpt
    const textareas = page.locator("textarea");
    await textareas.first().fill(`Real verification post for VPS deployment - ID: ${timestamp}`);

    // Category
    await page.locator("select").selectOption("lab-notes");

    // Body
    // In our CMS, the last textarea is usually the body
    const bodyTA = textareas.nth(await textareas.count() - 1);
    await bodyTA.fill(postBody);

    // SET STATUS: PUBLISHED
    const pubBtn = page.locator("button").filter({ hasText: "Published (live)" });
    await pubBtn.click();

    // 4. Save
    console.log(`Saving post...`);
    const saveBtn = page.locator("button").filter({ hasText: "Save Post" });
    await saveBtn.click();

    // Wait for success toast
    await expect(page.locator("text=Post saved successfully")).toBeVisible({ timeout: 15_000 });
    console.log(`✅ Post saved successfully!`);

    // 5. Verify on Public Site
    const publicUrl = `/article/${postSlug}`;
    console.log(`Verifying live content at ${publicUrl}...`);
    await page.goto(publicUrl);
    await waitReady(page);

    // Assert title and content
    await expect(page.locator("h1")).toContainText(postTitle);
    await expect(page.locator("text=" + postBody.split("\n")[0])).toBeVisible();
    
    console.log(`🎉 SUCCESS! Post is live at http://76.13.17.91${publicUrl}`);
  });
});
