import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function waitReady(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function goToTab(page: Page, tabName: "Data Hub" | "Pages" | "Blog") {
  const tab = page.locator("button").filter({ hasText: tabName });
  await tab.waitFor({ state: "visible", timeout: 10_000 });
  await tab.click();
  await page.waitForTimeout(800);
}

async function highlightAction(page: Page, locator: any) {
  // Hanya highlight kilat agar di OBS terlihat aksi yang sedang difokuskan
  await locator.evaluate((node: HTMLElement) => {
    node.style.outline = "2px solid #e67e22";
    node.style.outlineOffset = "2px";
  }).catch(() => {});
  await page.waitForTimeout(300);
  await locator.evaluate((node: HTMLElement) => {
    node.style.outline = "";
    node.style.outlineOffset = "";
  }).catch(() => {});
}

// ─── TEST SUITE: Admin CMS & Public Verification ─────────────────────────────

test.describe("AndaraLab CMS - Create, Edit, & Verify (OBS Ready)", () => {

  const timestamp = Date.now().toString().slice(-4);
  const pageSlug = `/macro/auto-page-${timestamp}`;
  const pageTitle = `Auto Target Page ${timestamp}`;
  const pageTitleEdited = `${pageTitle} [UPDATED VERSION]`;
  const pageDesc = `This is an automatically generated page for testing CMS. ID: ${timestamp}`;

  const postSlug = `auto-post-${timestamp}`;
  const postTitle = `Auto Blog Article ${timestamp}`;
  const postTitleEdited = `${postTitle} EXCLUSIVE EDITION`;
  const postBody = `Paragraf pertama dibuat melalui otomatisasi Playwright.\n\nParagraf kedua membahas tentang pengujian end-to-end.\n\nSelesai.`;
  const postBodyEdited = `${postBody}\n\n[TAMBAHAN] Paragraf baru hasil proses edit di CMS Admin. Berhasil!`;

  // ────────────────────────────────────────────────────────────────────────────
  // TC-01: Pages – Buat baru, Save, lalu CEK DI PUBLIC URL
  // ────────────────────────────────────────────────────────────────────────────
  test("TC-01 · CMS: Create Page & Verify Publicly", async ({ page }) => {
    console.log(`\n▶ [Pages] Creating Page: ${pageSlug}`);
    await page.goto("/admin");
    await waitReady(page);

    await goToTab(page, "Pages");
    
    // Klik Add New Page 
    const newPageBtn = page.locator("button").filter({ hasText: /new page/i }).first();
    await highlightAction(page, newPageBtn);
    await newPageBtn.click();
    await page.waitForTimeout(800);

    // Fill Slug
    const allInputs = page.locator('input[type="text"]');
    const slugInput = allInputs.first();
    await slugInput.click({ clickCount: 3 });
    await slugInput.fill(pageSlug);

    // Title
    const titleInput = allInputs.nth(1);
    await titleInput.click({ clickCount: 3 });
    await titleInput.fill(pageTitle);

    // Meta Description
    const textAreaDesc = page.locator("textarea").first();
    await textAreaDesc.click({ clickCount: 3 });
    await textAreaDesc.fill(pageDesc);

    // Nav Label
    const navInput = allInputs.nth(2);
    await navInput.click({ clickCount: 3 });
    await navInput.fill(`Nav ${timestamp}`);

    // Section (Pilih Macro)
    const sectionSelect = page.locator("select").first();
    await sectionSelect.selectOption("Macro Foundations");

    // SET STATUS: PUBLISHED
    const pubBtn = page.locator("button").filter({ hasText: "Published (live)" });
    await highlightAction(page, pubBtn);
    await pubBtn.click();

    // SAVE PAGE
    const saveBtn = page.locator("button").filter({ hasText: "Save Page" });
    await highlightAction(page, saveBtn);
    await saveBtn.click();

    // Wait for "Page saved successfully" text
    await expect(page.locator("text=Page saved successfully")).toBeVisible({ timeout: 8000 });
    console.log(`  ✅ Page Saved in CMS! Now navigating to ${pageSlug} ...`);
    await page.waitForTimeout(2000); // Jeda agar terekam di OBS bahwa sukses

    // ──────────────────────────────────────────────────────────────────────
    // VERIFY: Buka halaman publik dan lihat apakah judulnya muncul!
    // ──────────────────────────────────────────────────────────────────────
    await page.goto(pageSlug);
    await waitReady(page);
    await page.waitForTimeout(1000); // Jeda untuk OBS

    // Cek apakah Title muncul di halaman tersebut
    const pageHeader = page.locator("h1");
    // Karena dynamic page renderingnya pakai h1 / div text, kita cari teks judul
    await expect(page.locator(`text=${pageTitle}`).first()).toBeVisible({ timeout: 5000 });
    console.log(`  🎉 Verification Success! The page content "${pageTitle}" is live.`);
    
    // Balik ke admin untuk next test
    await page.goto("/admin");
    await waitReady(page);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TC-02: Pages – EDIT halaman, Save, lalu CEK HASIL EDITNYA DI PUBLIC URL
  // ────────────────────────────────────────────────────────────────────────────
  test("TC-02 · CMS: Edit Page & Verify Changes Publicly", async ({ page }) => {
    console.log(`\n▶ [Pages] Editing Page: ${pageSlug}`);
    await page.goto("/admin");
    await waitReady(page);

    await goToTab(page, "Pages");

    // Cari Row Page berdasarkan judul
    const pageRow = page.locator(".grid").filter({ hasText: pageTitle }).first();
    const editBtn = pageRow.locator("button").filter({ hasText: "Edit" });
    await highlightAction(page, editBtn);
    await editBtn.click();
    await page.waitForTimeout(800);

    // Ubah Judul
    const allInputs = page.locator('input[type="text"]');
    const titleInput = allInputs.nth(1);
    await titleInput.click({ clickCount: 3 });
    await titleInput.fill(pageTitleEdited);

    // Save
    const saveBtn = page.locator("button").filter({ hasText: "Save Page" });
    await saveBtn.click();

    await expect(page.locator("text=Page saved successfully")).toBeVisible({ timeout: 8000 });
    console.log(`  ✅ Edit Saved! Navigating back to ${pageSlug} ...`);
    await page.waitForTimeout(2000);

    // ──────────────────────────────────────────────────────────────────────
    // VERIFY JIKA TEREDIT: Buka halaman publik dan lihat apakah judul baru muncul!
    // ──────────────────────────────────────────────────────────────────────
    await page.goto(pageSlug);
    await waitReady(page);
    await page.waitForTimeout(1000);

    await expect(page.locator(`text=${pageTitleEdited}`).first()).toBeVisible({ timeout: 5000 });
    console.log(`  🎉 Verification Success! The title changed to "${pageTitleEdited}".`);
  });


  // ────────────────────────────────────────────────────────────────────────────
  // TC-03: Blog – Buat baru, Save, lalu CEK DI PUBLIC URL
  // ────────────────────────────────────────────────────────────────────────────
  test("TC-03 · CMS: Create Blog Post & Verify Publicly", async ({ page }) => {
    console.log(`\n▶ [Blog] Creating Post: ${postSlug}`);
    await page.goto("/admin");
    await waitReady(page);

    await goToTab(page, "Blog");
    
    // Klik Add New Post
    const newPostBtn = page.locator("button").filter({ hasText: /new post/i }).first();
    await highlightAction(page, newPostBtn);
    await newPostBtn.click();
    await page.waitForTimeout(800);

    const allInputs = page.locator('input[type="text"]');
    
    // Slug
    await allInputs.first().click({ clickCount: 3 });
    await allInputs.first().fill(postSlug);

    // Title
    await allInputs.nth(1).click({ clickCount: 3 });
    await allInputs.nth(1).fill(postTitle);

    // Excerpt 
    const textareas = page.locator("textarea");
    await textareas.first().click({ clickCount: 3 });
    await textareas.first().fill(`Deskripsi singkat berita - ID: ${timestamp}`);

    // Category
    await page.locator("select").selectOption("market-pulse");

    // PUBLISHED
    const pubBtn = page.locator("button").filter({ hasText: "Published (live)" });
    await highlightAction(page, pubBtn);
    await pubBtn.click();

    // Body
    const bodyTA = textareas.nth(textareas.count() > 1 ? await textareas.count() - 1 : 1);
    await bodyTA.click({ clickCount: 3 });
    await bodyTA.fill(postBody);

    // Save
    const saveBtn = page.locator("button").filter({ hasText: "Save Post" });
    await highlightAction(page, saveBtn);
    await saveBtn.click();

    await expect(page.locator("text=Post saved successfully")).toBeVisible({ timeout: 8000 });
    console.log(`  ✅ Blog Post Saved! Now visiting /article/${postSlug} ...`);
    await page.waitForTimeout(2000);

    // ──────────────────────────────────────────────────────────────────────
    // VERIFY BLOG LIVE
    // ──────────────────────────────────────────────────────────────────────
    await page.goto(`/article/${postSlug}`);
    await waitReady(page);
    await page.waitForTimeout(1000);

    await expect(page.locator(`text=${postTitle}`).first()).toBeVisible({ timeout: 5000 });
    // Verifikasi paragraf pertama tampil (kita ambil kata awal buat validasi gampang)
    await expect(page.locator("text=Paragraf pertama dibuat melalui otomatisasi Playwright").first()).toBeVisible();
    
    console.log(`  🎉 Verification Success! Blog post "${postTitle}" is live and readable.`);
  });


  // ────────────────────────────────────────────────────────────────────────────
  // TC-04: Blog – EDIT post, Save, lalu CEK HASIL EDITNYA
  // ────────────────────────────────────────────────────────────────────────────
  test("TC-04 · CMS: Edit Blog Post & Verify Changes Publicly", async ({ page }) => {
    console.log(`\n▶ [Blog] Editing Post: ${postSlug}`);
    await page.goto("/admin");
    await waitReady(page);

    await goToTab(page, "Blog");

    const postRow = page.locator(".grid").filter({ hasText: postTitle }).first();
    const editBtn = postRow.locator("button").filter({ hasText: "Edit" });
    await highlightAction(page, editBtn);
    await editBtn.click();
    await page.waitForTimeout(800);

    const allInputs = page.locator('input[type="text"]');
    
    // Ubah Judul
    await allInputs.nth(1).click({ clickCount: 3 });
    await allInputs.nth(1).fill(postTitleEdited);

    // Ubah Body (tambah paragraf)
    const textareas = page.locator("textarea");
    const bodyTA = textareas.nth(textareas.count() > 1 ? await textareas.count() - 1 : 1);
    await bodyTA.click({ clickCount: 3 });
    await bodyTA.fill(postBodyEdited);

    // Save
    const saveBtn = page.locator("button").filter({ hasText: "Save Post" });
    await saveBtn.click();

    await expect(page.locator("text=Post saved successfully")).toBeVisible({ timeout: 8000 });
    console.log(`  ✅ Edit Blog Saved! Visiting /article/${postSlug} ...`);
    await page.waitForTimeout(2000);

    // ──────────────────────────────────────────────────────────────────────
    // VERIFY PERUBAHAN BLOG LIVE
    // ──────────────────────────────────────────────────────────────────────
    await page.goto(`/article/${postSlug}`);
    await waitReady(page);
    await page.waitForTimeout(1000);

    await expect(page.locator(`text=${postTitleEdited}`).first()).toBeVisible({ timeout: 5000 });
    // Cek kalimat tambahan
    await expect(page.locator("text=Paragraf baru hasil proses edit di CMS Admin. Berhasil!").first()).toBeVisible();
    
    console.log(`  🎉 Verification Success! Blog post successfully updated and rendered.`);
  });

});
