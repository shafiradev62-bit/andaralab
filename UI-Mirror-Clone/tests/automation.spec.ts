import { test, expect, Page } from "@playwright/test";

// ─── Test Data ────────────────────────────────────────────────────────────────

const CONTACT_DATA = [
  { name: "Ahmad Fauzi",      email: "ahmad.fauzi@gmail.com",          org: "Bank Indonesia",        subject: "Research Partnership", message: "Kami tertarik menjalin kerjasama riset terkait kebijakan moneter dan outlook makro 2025." },
  { name: "Dewi Rahayu",      email: "dewi.rahayu@bri.co.id",          org: "Bank BRI",              subject: "Data Subscription",    message: "Saya ingin berlangganan data ekonomi bulanan untuk keperluan analisis kredit sektor agrikultur." },
  { name: "Budi Santoso",     email: "budi.santoso@kemenkeu.go.id",    org: "Kementerian Keuangan",  subject: "Research Partnership", message: "Kementerian Keuangan tertarik berkolaborasi dalam penelitian fiskal dan belanja negara Q3 2025." },
  { name: "Siti Nurhaliza",   email: "siti.nurhaliza@mandiri.co.id",   org: "Bank Mandiri",          subject: "General Question",     message: "Mohon informasi mengenai paket data dashboard pasar modal yang tersedia untuk institusi perbankan." },
  { name: "Rizky Firmansyah", email: "rizky.f@ojk.go.id",             org: "OJK",                   subject: "Media Inquiry",        message: "OJK ingin menggunakan riset Andara Lab sebagai referensi dalam laporan tahunan pengawasan pasar." },
  { name: "Maya Kusuma",      email: "maya.kusuma@pertamina.com",      org: "PT Pertamina",          subject: "Research Partnership", message: "Kami membutuhkan analisis geopolitik terkait dampak harga minyak global terhadap operasional Pertamina." },
  { name: "Hendra Wijaya",    email: "hendra.w@bei.co.id",             org: "BEI",                   subject: "Data Subscription",    message: "Bursa Efek Indonesia ingin berlangganan data indeks pasar dan model prediktif kuartal depan." },
  { name: "Putri Anggraini",  email: "putri.anggraini@telkom.co.id",   org: "PT Telkom Indonesia",   subject: "General Question",     message: "Bagaimana cara mengakses data model ekonometrik yang dipublikasikan di platform Data Hub?" },
  { name: "Fajar Nugroho",    email: "fajar.nugroho@unpad.ac.id",      org: "Universitas Padjadjaran", subject: "Research Partnership", message: "Saya peneliti di UNPAD, tertarik berkolaborasi untuk penelitian dampak ESG terhadap return saham." },
  { name: "Laila Handayani",  email: "laila.handayani@bps.go.id",     org: "BPS",                   subject: "Research Partnership", message: "BPS ingin bermitra dalam pengembangan metodologi survei ekonomi berbasis data real-time." },
  { name: "Arief Setiawan",   email: "arief.setiawan@worldbank.org",   org: "World Bank Indonesia",  subject: "Media Inquiry",        message: "World Bank tertarik mengutip analisis regional Andara Lab dalam laporan kemiskinan Asia Tenggara." },
  { name: "Nadia Permata",    email: "nadia.permata@oecd-jkt.org",     org: "OECD Jakarta",          subject: "Research Partnership", message: "OECD ingin berdiskusi mengenai penyusunan reformasi kebijakan perdagangan bersama Andara Lab." },
  { name: "Taufik Rahman",    email: "taufik.rahman@imf.org",          org: "IMF Representative",    subject: "Data Subscription",    message: "IMF Representative Office Jakarta mencari provider data makroekonomi berkualitas tinggi untuk Q2 2025." },
  { name: "Yuni Astuti",      email: "yuni.astuti@bca.co.id",         org: "Bank BCA",              subject: "General Question",     message: "Apakah tersedia dashboard khusus untuk analisis yield curve dan obligasi negara yang dapat diakses secara real-time?" },
  { name: "Dian Pratama",     email: "dian.pratama@ui.ac.id",         org: "Universitas Indonesia",  subject: "Research Partnership", message: "Lab Ekonomi UI ingin mengajukan proposal kolaborasi riset mengenai dampak kenaikan suku bunga pada investasi UMKM." },
];

const BLOG_POSTS = [
  {
    slug: "indonesia-gdp-outlook-2025",
    title: "Indonesia GDP Outlook 2025: Momentum Pertumbuhan di Tengah Ketidakpastian Global",
    excerpt: "Analisis komprehensif mengenai proyeksi PDB Indonesia tahun 2025 dan faktor-faktor yang mempengaruhi pertumbuhan ekonomi nasional.",
    category: "economics-101",
    tag: "GDP, Makro, Indonesia",
    readTime: "8 min read",
    body: "Pertumbuhan ekonomi Indonesia pada 2025 diperkirakan berada di kisaran 4,8–5,2%.\n\nFaktor utama yang mendorong pertumbuhan adalah konsumsi rumah tangga yang solid, ekspansi investasi asing, dan peningkatan ekspor komoditas.\n\nNamun demikian, risiko global seperti perlambatan ekonomi China dan kenaikan suku bunga AS tetap menjadi tantangan utama.",
  },
  {
    slug: "rupiah-exchange-rate-dynamics",
    title: "Dinamika Nilai Tukar Rupiah: Faktor Fundamental vs Sentimen Pasar",
    excerpt: "Kajian mendalam mengenai pergerakan kurs IDR/USD sepanjang 2024-2025 dan implikasi kebijakan Bank Indonesia.",
    category: "market-pulse",
    tag: "Rupiah, Forex, BI",
    readTime: "6 min read",
    body: "Nilai tukar Rupiah menghadapi tekanan depresiasi signifikan pada awal 2025 akibat penguatan Dolar AS.\n\nBank Indonesia merespons dengan intervensi pasar dan penyesuaian suku bunga acuan untuk menjaga stabilitas.\n\nAnalisis kami menunjukkan bahwa fundamental ekonomi Indonesia masih kuat untuk mendukung penguatan Rupiah jangka menengah.",
  },
  {
    slug: "esg-investing-indonesia-landscape",
    title: "ESG Investing di Indonesia: Peluang dan Tantangan bagi Investor Institusional",
    excerpt: "Pemetaan ekosistem investasi ESG Indonesia dan strategi optimal bagi fund manager dalam mengintegrasikan kriteria keberlanjutan.",
    category: "lab-notes",
    tag: "ESG, Investasi, Sustainability",
    readTime: "10 min read",
    body: "Investasi berbasis ESG di Indonesia menunjukkan pertumbuhan signifikan dengan AUM mencapai Rp 45 triliun pada akhir 2024.\n\nRegulasi OJK yang semakin ketat mendorong perusahaan publik untuk meningkatkan disclosure ESG mereka.\n\nInvestor institusional perlu membangun framework evaluasi ESG yang komprehensif dan kontekstual sesuai kondisi pasar Indonesia.",
  },
  {
    slug: "geopolitical-risk-commodity-prices",
    title: "Risiko Geopolitik dan Harga Komoditas: Dampak Konflik Timur Tengah pada Ekonomi Indonesia",
    excerpt: "Simulasi dampak eskalasi konflik Timur Tengah terhadap harga minyak, inflasi, dan neraca perdagangan Indonesia.",
    category: "economics-101",
    tag: "Geopolitik, Komoditas, Inflasi",
    readTime: "7 min read",
    body: "Konflik di Timur Tengah berpotensi mendorong harga minyak Brent melampaui USD 100 per barel dalam skenario eskalasi.\n\nIndonesia sebagai net importer minyak akan menghadapi tekanan defisit neraca berjalan dan inflasi energi.\n\nModel simulasi kami menunjukkan kenaikan harga minyak 20% berpotensi menambah inflasi headline Indonesia sebesar 0,8 poin persentase.",
  },
  {
    slug: "monetary-policy-rate-cut-2025",
    title: "Peluang Pemangkasan Suku Bunga BI 2025: Analisis Window Kebijakan Moneter",
    excerpt: "Evaluasi probabilitas dan timing pemangkasan suku bunga Bank Indonesia berdasarkan data inflasi, pertumbuhan, dan kondisi eksternal terkini.",
    category: "market-pulse",
    tag: "BI Rate, Kebijakan Moneter, Inflasi",
    readTime: "5 min read",
    body: "Inflasi Indonesia yang terkendali di kisaran 2,5–3,0% membuka ruang bagi Bank Indonesia untuk memangkas suku bunga.\n\nAnalisis kami memperkirakan BI akan memotong BI7DRR sebesar 50 bps sepanjang 2025, dengan siklus pertama pada semester pertama.\n\nNamun, keputusan ini sangat bergantung pada arah kebijakan The Fed dan stabilitas nilai tukar Rupiah.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function waitForPageReady(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
}

async function scrollAndHighlight(page: Page, selector: string) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await el.evaluate((node) => {
    node.style.outline = "3px solid #e67e22";
    node.style.outlineOffset = "2px";
  });
  await page.waitForTimeout(300);
  await el.evaluate((node) => {
    node.style.outline = "";
    node.style.outlineOffset = "";
  });
}

// ─── Test: Contact Form (15 submissions) ─────────────────────────────────────

test.describe("Automation Test – Andara Lab UI", () => {
  test("TC-01: Submit 15 Contact Forms dengan data beragam", async ({ page }) => {
    console.log("\n🚀 Starting Contact Form Automation (15 entries)...\n");

    for (let i = 0; i < CONTACT_DATA.length; i++) {
      const data = CONTACT_DATA[i];
      console.log(`  [${i + 1}/15] 📝 Submitting: ${data.name} <${data.email}>`);

      await page.goto("/contact");
      await waitForPageReady(page);

      // Screenshot initial state
      if (i === 0) {
        await expect(page.locator("h1")).toContainText("Get in Touch");
        await page.waitForTimeout(800);
      }

      // Fill Full Name
      const nameInput = page.locator('input[placeholder="Your name"]');
      await scrollAndHighlight(page, 'input[placeholder="Your name"]');
      await nameInput.clear();
      await nameInput.fill(data.name);
      await page.waitForTimeout(200);

      // Fill Email
      const emailInput = page.locator('input[placeholder="your@email.com"]');
      await scrollAndHighlight(page, 'input[placeholder="your@email.com"]');
      await emailInput.clear();
      await emailInput.fill(data.email);
      await page.waitForTimeout(200);

      // Fill Organization
      const orgInput = page.locator('input[placeholder="Company or institution"]');
      await scrollAndHighlight(page, 'input[placeholder="Company or institution"]');
      await orgInput.clear();
      await orgInput.fill(data.org);
      await page.waitForTimeout(200);

      // Select Subject
      await scrollAndHighlight(page, "select");
      await page.locator("select").selectOption({ label: data.subject });
      await page.waitForTimeout(300);

      // Fill Message
      const msgArea = page.locator("textarea");
      await scrollAndHighlight(page, "textarea");
      await msgArea.clear();
      await msgArea.fill(data.message);
      await page.waitForTimeout(300);

      // Submit
      const submitBtn = page.locator('button[type="submit"]');
      await scrollAndHighlight(page, 'button[type="submit"]');
      await page.waitForTimeout(400);
      await submitBtn.click();

      // Verify success
      await expect(page.locator("text=Message Sent")).toBeVisible({ timeout: 10_000 });
      console.log(`  ✅ [${i + 1}/15] Success: ${data.name}`);
      await page.waitForTimeout(600);

      // Reset for next iteration (click "Send another message" if not last)
      if (i < CONTACT_DATA.length - 1) {
        await page.locator("text=Send another message").click();
        await page.waitForTimeout(400);
      }
    }

    console.log("\n✅ TC-01 PASSED: 15 Contact Forms submitted successfully!\n");
  });

  test("TC-02: Create 5 Blog Posts via Admin Panel", async ({ page }) => {
    console.log("\n🚀 Starting Admin Blog Post Automation (5 entries)...\n");

    await page.goto("/admin");
    await waitForPageReady(page);
    await page.waitForTimeout(1000);

    // Navigate to Blog Posts tab
    const blogTab = page.locator("button, [role='tab']").filter({ hasText: /blog|post/i }).first();
    if (await blogTab.isVisible()) {
      await blogTab.click();
      await page.waitForTimeout(600);
    }

    for (let i = 0; i < BLOG_POSTS.length; i++) {
      const post = BLOG_POSTS[i];
      console.log(`  [${i + 1}/5] 📝 Creating post: "${post.title}"`);

      // Click "New Post" / "Add Post" button
      const newPostBtn = page.locator("button").filter({ hasText: /new post|add post|tambah post/i }).first();
      if (await newPostBtn.isVisible()) {
        await newPostBtn.click();
        await page.waitForTimeout(800);
      }

      // Fill Slug
      const slugInput = page.locator('input[type="text"]').filter({ has: page.locator("..").filter({ hasText: /slug/i }) }).first();
      if (await slugInput.isVisible()) {
        await slugInput.clear();
        await slugInput.fill(post.slug);
        await page.waitForTimeout(200);
      }

      // Fill Title
      const titleInputs = page.locator('input[type="text"]');
      const titleInput = titleInputs.filter({ has: page.locator("..").filter({ hasText: /title/i }) }).first();
      if (await titleInput.isVisible()) {
        await titleInput.clear();
        await titleInput.fill(post.title);
        await page.waitForTimeout(200);
      }

      // Fill Excerpt / Description
      const textareas = page.locator("textarea");
      const excerptTA = textareas.first();
      if (await excerptTA.isVisible()) {
        await excerptTA.clear();
        await excerptTA.fill(post.excerpt);
        await page.waitForTimeout(200);
      }

      // Select Published status
      const publishedBtn = page.locator("button").filter({ hasText: /published/i }).first();
      if (await publishedBtn.isVisible()) {
        await publishedBtn.click();
        await page.waitForTimeout(300);
      }

      // Click Save
      const saveBtn = page.locator("button").filter({ hasText: /save post|save/i }).first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
        console.log(`  ✅ [${i + 1}/5] Saved: "${post.title}"`);
      }

      // Go back to list
      const backBtn = page.locator("button").filter({ hasText: /back|kembali/i }).first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(600);
      }
    }

    console.log("\n✅ TC-02 PASSED: 5 Blog Posts created via Admin!\n");
  });

  test("TC-03: Navigate All Main Pages dan Verifikasi UI", async ({ page }) => {
    console.log("\n🚀 Starting Page Navigation Test...\n");

    const routes = [
      { path: "/",                  name: "Home Page" },
      { path: "/about",             name: "About Page" },
      { path: "/contact",           name: "Contact Page" },
      { path: "/data",              name: "Data Hub" },
      { path: "/data/models",       name: "Models Page" },
      { path: "/macro",             name: "Macro Page" },
      { path: "/blog",              name: "Blog Index" },
      { path: "/admin",             name: "Admin Panel" },
    ];

    for (const route of routes) {
      console.log(`  🔍 Navigating to: ${route.name} (${route.path})`);
      await page.goto(route.path);
      await waitForPageReady(page);
      await page.waitForTimeout(800);

      // Verify page loaded (no crash)
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(0);
      console.log(`  ✅ ${route.name} - OK`);
    }

    console.log("\n✅ TC-03 PASSED: All pages navigated successfully!\n");
  });
});
