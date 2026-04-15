# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-deploy-test.spec.ts >> Real Deploy Blog Test >> Create Blog Post on VPS and Verify
- Location: real-deploy-test.spec.ts:21:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "AndaraLab Production Test Post 56942"
Received string:    "Article not found"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    9 × locator resolved to <h1 class="text-[24px] font-semibold text-gray-900 mb-3">Article not found</h1>
      - unexpected value "Article not found"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e8]: Live
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: IDR/USD
          - generic [ref=e13]: "17.094"
          - generic [ref=e14]: +0.32%
        - generic [ref=e15]:
          - generic [ref=e16]: JCI
          - generic [ref=e17]: 7,214.3
          - generic [ref=e18]: +1.14%
        - generic [ref=e19]:
          - generic [ref=e20]: BI Rate
          - generic [ref=e21]: 6.00%
          - generic [ref=e22]: Unch
        - generic [ref=e23]:
          - generic [ref=e24]: US 10Y
          - generic [ref=e25]: 4.28%
          - generic [ref=e26]: "-0.05%"
        - generic [ref=e27]:
          - generic [ref=e28]: Gold
          - generic [ref=e29]: $2,285
          - generic [ref=e30]: +0.63%
        - generic [ref=e31]:
          - generic [ref=e32]: Brent Crude
          - generic [ref=e33]: $82.4
          - generic [ref=e34]: +0.78%
        - generic [ref=e35]:
          - generic [ref=e36]: IDR/USD
          - generic [ref=e37]: "17.094"
          - generic [ref=e38]: +0.32%
        - generic [ref=e39]:
          - generic [ref=e40]: JCI
          - generic [ref=e41]: 7,214.3
          - generic [ref=e42]: +1.14%
        - generic [ref=e43]:
          - generic [ref=e44]: BI Rate
          - generic [ref=e45]: 6.00%
          - generic [ref=e46]: Unch
        - generic [ref=e47]:
          - generic [ref=e48]: US 10Y
          - generic [ref=e49]: 4.28%
          - generic [ref=e50]: "-0.05%"
        - generic [ref=e51]:
          - generic [ref=e52]: Gold
          - generic [ref=e53]: $2,285
          - generic [ref=e54]: +0.63%
        - generic [ref=e55]:
          - generic [ref=e56]: Brent Crude
          - generic [ref=e57]: $82.4
          - generic [ref=e58]: +0.78%
    - banner [ref=e59]:
      - generic [ref=e60]:
        - link "AL AndaraLab" [ref=e61] [cursor=pointer]:
          - /url: /
          - generic [ref=e63]: AL
          - generic [ref=e65]: AndaraLab
        - navigation [ref=e66]:
          - link "Home" [ref=e68] [cursor=pointer]:
            - /url: /
          - link "About Us" [ref=e70] [cursor=pointer]:
            - /url: /about
          - button "Macro Foundations" [ref=e72]:
            - text: Macro Foundations
            - img [ref=e73]
          - button "Sectoral Intelligence" [ref=e76]:
            - text: Sectoral Intelligence
            - img [ref=e77]
          - button "Data Hub" [ref=e80]:
            - text: Data Hub
            - img [ref=e81]
          - button "Blog" [ref=e84]:
            - text: Blog
            - img [ref=e85]
          - link "Analysis" [ref=e88] [cursor=pointer]:
            - /url: /analisis
          - link "Contact" [ref=e90] [cursor=pointer]:
            - /url: /contact
        - generic [ref=e91]:
          - generic [ref=e92]:
            - button "EN" [ref=e93]
            - button "ID" [ref=e94]
          - link "Get in Touch" [ref=e95] [cursor=pointer]:
            - /url: /contact
  - main [ref=e96]:
    - generic [ref=e97]:
      - generic [ref=e98]: "404"
      - heading "Article not found" [level=1] [ref=e99]
      - paragraph [ref=e100]: This article doesn't exist, is still a draft in the CMS, or may have been moved.
      - link "Go Home" [ref=e101] [cursor=pointer]:
        - /url: /
  - contentinfo [ref=e102]:
    - generic [ref=e103]:
      - generic [ref=e104]:
        - generic [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e108]: AL
            - generic [ref=e109]: AndaraLab
          - paragraph [ref=e110]: A premier economic research hub under PT. Andara Investasi Cerdas. Decoding economies, empowering growth.
          - link "Get in Touch →" [ref=e111] [cursor=pointer]:
            - /url: /contact
        - generic [ref=e112]:
          - generic [ref=e113]: Research
          - list [ref=e114]:
            - listitem [ref=e115]:
              - link "Macro Outlooks" [ref=e116] [cursor=pointer]:
                - /url: /macro/macro-outlooks
            - listitem [ref=e117]:
              - link "Policy & Monetary Watch" [ref=e118] [cursor=pointer]:
                - /url: /macro/policy-monetary
            - listitem [ref=e119]:
              - link "Sectoral Intelligence" [ref=e120] [cursor=pointer]:
                - /url: /sectoral/deep-dives
            - listitem [ref=e121]:
              - link "ESG" [ref=e122] [cursor=pointer]:
                - /url: /sectoral/esg
            - listitem [ref=e123]:
              - link "Data Hub" [ref=e124] [cursor=pointer]:
                - /url: /data
        - generic [ref=e125]:
          - generic [ref=e126]: Explore
          - list [ref=e127]:
            - listitem [ref=e128]:
              - link "Economic Calendar" [ref=e129] [cursor=pointer]:
                - /url: /data/economic-calendar
            - listitem [ref=e130]:
              - link "Market Dashboard" [ref=e131] [cursor=pointer]:
                - /url: /data/market-dashboard
            - listitem [ref=e132]:
              - link "Blog" [ref=e133] [cursor=pointer]:
                - /url: /blog/economics-101
            - listitem [ref=e134]:
              - link "Lab Notes" [ref=e135] [cursor=pointer]:
                - /url: /blog/lab-notes
        - generic [ref=e136]:
          - generic [ref=e137]: Company
          - list [ref=e138]:
            - listitem [ref=e139]:
              - link "About Us" [ref=e140] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e141]:
              - link "Contact" [ref=e142] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e143]:
              - link "Admin CMS" [ref=e144] [cursor=pointer]:
                - /url: /admin
      - generic [ref=e145]:
        - paragraph [ref=e146]: © 2026 AndaraLab · PT. Andara Investasi Cerdas. All rights reserved.
        - paragraph [ref=e147]: andaralab.id
```

# Test source

```ts
  1  | import { test, expect, type Page } from "@playwright/test";
  2  | 
  3  | async function waitReady(page: Page) {
  4  |   await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  5  |   await page.waitForTimeout(1000);
  6  | }
  7  | 
  8  | async function goToTab(page: Page, tabName: "Data Hub" | "Pages" | "Blog") {
  9  |   const tab = page.locator("button").filter({ hasText: tabName });
  10 |   await tab.waitFor({ state: "visible", timeout: 15_000 });
  11 |   await tab.click();
  12 |   await page.waitForTimeout(1000);
  13 | }
  14 | 
  15 | test.describe("Real Deploy Blog Test", () => {
  16 |   const timestamp = Math.floor(Date.now() / 1000).toString().slice(-5);
  17 |   const postSlug = `real-test-${timestamp}`;
  18 |   const postTitle = `AndaraLab Production Test Post ${timestamp}`;
  19 |   const postBody = `This is a real blog post content created by Antigravity AI to verify the VPS deployment.\n\nTime: ${new Date().toLocaleString()}\n\nDeployment Status: Verified.`;
  20 | 
  21 |   test("Create Blog Post on VPS and Verify", async ({ page }) => {
  22 |     // 1. Go to Admin
  23 |     console.log(`Navigating to Admin...`);
  24 |     await page.goto("/admin");
  25 |     await waitReady(page);
  26 | 
  27 |     // 2. Go to Blog Tab
  28 |     console.log(`Switching to Blog tab...`);
  29 |     await goToTab(page, "Blog");
  30 | 
  31 |     // 3. Create New Post
  32 |     console.log(`Creating new post: ${postTitle}`);
  33 |     const newPostBtn = page.locator("button").filter({ hasText: /new post/i }).first();
  34 |     await newPostBtn.click();
  35 |     await page.waitForTimeout(1000);
  36 | 
  37 |     const allInputs = page.locator('input[type="text"]');
  38 |     
  39 |     // Slug
  40 |     await allInputs.first().fill(postSlug);
  41 |     // Title
  42 |     await allInputs.nth(1).fill(postTitle);
  43 | 
  44 |     // Excerpt
  45 |     const textareas = page.locator("textarea");
  46 |     await textareas.first().fill(`Real verification post for VPS deployment - ID: ${timestamp}`);
  47 | 
  48 |     // Category
  49 |     await page.locator("select").selectOption("lab-notes");
  50 | 
  51 |     // Body
  52 |     // In our CMS, the last textarea is usually the body
  53 |     const bodyTA = textareas.nth(await textareas.count() - 1);
  54 |     await bodyTA.fill(postBody);
  55 | 
  56 |     // SET STATUS: PUBLISHED
  57 |     const pubBtn = page.locator("button").filter({ hasText: "Published (live)" });
  58 |     await pubBtn.click();
  59 | 
  60 |     // 4. Save
  61 |     console.log(`Saving post...`);
  62 |     const saveBtn = page.locator("button").filter({ hasText: "Save Post" });
  63 |     await saveBtn.click();
  64 | 
  65 |     // Wait for success toast
  66 |     await expect(page.locator("text=Post saved successfully")).toBeVisible({ timeout: 15_000 });
  67 |     console.log(`✅ Post saved successfully!`);
  68 | 
  69 |     // 5. Verify on Public Site
  70 |     const publicUrl = `/article/${postSlug}`;
  71 |     console.log(`Verifying live content at ${publicUrl}...`);
  72 |     await page.goto(publicUrl);
  73 |     await waitReady(page);
  74 | 
  75 |     // Assert title and content
> 76 |     await expect(page.locator("h1")).toContainText(postTitle);
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  77 |     await expect(page.locator("text=" + postBody.split("\n")[0])).toBeVisible();
  78 |     
  79 |     console.log(`🎉 SUCCESS! Post is live at http://76.13.17.91${publicUrl}`);
  80 |   });
  81 | });
  82 | 
```