# AndaraLab CMS — Manual Testing Guide

## Overview

```
URL:        http://76.13.17.91
API Base:  http://76.13.17.91/api
Admin:     http://76.13.17.91/admin
Data Hub:  http://76.13.17.91/data
Blog:      http://76.13.17.91/blog
```

---

## Pre-Test: Verify System is Up

### 1. API Health Check

```bash
curl http://76.13.17.91/api/healthz
```

**Expected:**
```json
{"status":"ok"}
```

If not `"ok"`, the API server is down. SSH to VPS and restart:
```bash
ssh root@76.13.17.91
pm2 restart api-server
```

### 2. Check All Data Counts

```bash
curl http://76.13.17.91/api/datasets | jq '.meta.total'
curl http://76.13.17.91/api/blog      | jq '.meta.total'
curl http://76.13.17.91/api/pages     | jq '.meta.total'
```

**Expected:** `11` datasets, `14` blog posts, `14` pages

---

## Section 1: Homepage (`/`)

### Test Steps

1. Open browser → `http://76.13.17.91`
2. Verify page loads without spinner/loading screen
3. Check for the following elements:

| Element | Should Appear |
|---------|--------------|
| Hero section | "Independent Economic Research for Indonesia" |
| Stats bar | 24+ Macro Reports, 8 Sectors Covered, 28+ Years of Data |
| Featured articles | 3 article cards |
| GDP Growth chart | Line chart with quarterly data |
| CTA section | Email subscription form |
| Navbar | Home, Data Hub, About, Contact |

### API Test
```bash
# Homepage is a page at slug "/"
curl "http://76.13.17.91/api/pages/slug/%2F?locale=en" | jq '.title'
# Expected: "AndaraLab — Independent Economic Research for Indonesia"
```

---

## Section 2: Data Hub (`/data`)

### Test Steps

1. Navigate to `http://76.13.17.91/data`
2. Verify 11 dataset cards appear
3. Click each dataset card to open chart view

### Expected Dataset List

| # | Dataset Title | Type | Category |
|---|--------------|------|----------|
| 1 | Produksi Minyak Bumi & Gas Alam | Line | Sectoral Intelligence |
| 2 | Indonesia GDP Growth Rate | Line | Macro Foundations |
| 3 | Indonesia Inflation Rate | Area | Macro Foundations |
| 4 | Bank Indonesia Policy Rate | Bar | Macro Foundations |
| 5 | Indonesia Trade Balance | Bar | Sectoral Intelligence |
| 6 | IDR/USD Exchange Rate | Line | Market Dashboard |
| 7 | Produksi Nikel Indonesia | Area | Sectoral Intelligence |
| 8 | Ekonomi Digital Indonesia | Line | Market Dashboard |
| 9 | Imbal Hasil SBN Indonesia | Line | Financial Markets |
| 10 | Produksi Batu Bara Indonesia | Bar | Sectoral Intelligence |
| 11 | Foreign Direct Investment | Bar | Macro Foundations |

### API Test
```bash
curl http://76.13.17.91/api/datasets | jq '.data[].title'
```

### Test Individual Chart
```bash
# Click "Produksi Minyak Bumi & Gas Alam" → should show line chart with data from 1996-2024
curl http://76.13.17.91/api/datasets/oil-gas-production | jq '.rows | length'
# Expected: 28 rows (1996-2024)
```

### Test Filter by Category
```bash
curl "http://76.13.17.91/api/datasets?category=Sectoral%20Intelligence" | jq '.meta.total'
# Expected: 4 datasets
```

---

## Section 3: Blog (`/blog`)

### Test Steps

1. Navigate to `http://76.13.17.91/blog`
2. Verify article list loads
3. Click any article to read full content

### Expected Blog Posts (14 total)

| # | Title (EN) | Category | Status |
|---|-----------|----------|--------|
| 1 | What Is a Current Account Deficit... | economics-101 | Published |
| 2 | CPI vs. Core Inflation: Why Central Banks... | economics-101 | Published |
| 3 | JCI at 7,200: Why BI's Rate Hold... | market-pulse | Published |
| 4 | How We Build Our Macro Models... | lab-notes | Published |
| 5 | Indonesia's Nickel Dominance... | sectoral-analysis | Published |
| 6 | Indonesia's Digital Economy: Why 2026... | sectoral-analysis | Published |
| 7 | Understanding G20's New Bank Capital... | financial-markets | Published |
| 8 | Omnibus Law Two Years Later... | policy-analysis | Published |
| 9 | Indonesia Government Bond Market... | financial-markets | Published |
| 10 | Tax Reform 2026 Indonesia... | policy-analysis | Draft |
| 11 | Prospek Makro Indonesia 2026... | economics-101 | Published |
| 12 | Downstreaming Nikel Indonesia... | sectoral-analysis | Published |
| 13 | Menggenggam Inflasi Harga Pangan... | economics-101 | Published |
| 14 | Ekonomi Digital Indonesia... | sectoral-analysis | Published |

### API Test
```bash
# List all published posts
curl "http://76.13.17.91/api/blog?status=published" | jq '.meta.total'
# Expected: 13 (1 is draft)

# Test language filter
curl "http://76.13.17.91/api/blog?locale=id" | jq '.meta.total'
# Expected: 4 Indonesian posts
```

### Test Article Detail
```bash
# Click article → should show full body
curl "http://76.13.17.91/api/blog" | node -e "
  let d='';process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    const r=JSON.parse(d).data;
    const p=r[0];
    console.log('Title:', p.title);
    console.log('Excerpt:', p.excerpt);
    console.log('Body paragraphs:', p.body.length);
    console.log('Category:', p.category);
    console.log('Read time:', p.readTime);
  })
"
```

---

## Section 4: Pages (Navigation)

### Test Steps

Navigate to each page and verify content loads:

| Page | URL | Content to Verify |
|------|-----|-----------------|
| Home EN | `/` | Hero + GDP chart + 3 featured posts |
| Home ID | `/?lang=id` | Hero Indonesia + chart |
| About EN | `/about` | "Who We Are" section |
| Data Hub | `/data` | 11 dataset cards with charts |
| Energy Sector | `/sectors/energy` | Oil, Gas, Coal, Nickel charts |
| Finance Sector | `/sectors/finance` | SBN Yield + IDR/USD charts |
| Contact | `/contact` | Contact form / email CTA |

### API Test
```bash
# All published pages
curl http://76.13.17.91/api/pages?status=published | jq '.meta.total'
# Expected: 14

# About page content
curl "http://76.13.17.91/api/pages/slug/about?locale=en" | jq '.content[0]'
# Expected: {type: "hero", headline: "Who We Are"...}

# Pages by section
curl "http://76.13.17.91/api/pages?section=Sectoral%20Intelligence" | jq '.meta.total'
# Expected: 2 pages (Energy EN + ID)
```

---

## Section 5: CMS Admin Panel (`/admin`)

### Test Steps

1. Open `http://76.13.17.91/admin`
2. Verify 3 tabs appear: **Data Hub**, **Pages**, **Blog**
3. Data should load without error

---

### Tab 1: Data Hub

**Verify:**
- [ ] 11 dataset cards visible in grid
- [ ] Each card shows: title, category badge, chart type icon, unit
- [ ] Search/filter bar works
- [ ] "New Dataset" button exists

**Test Create New Dataset:**

1. Click **"+ New Dataset"**
2. Fill form:
   - Title: `Test Dataset`
   - Category: `Macro Foundations`
   - Chart Type: `bar`
   - Unit: `%`
   - Columns: `["Quarter", "Value"]`
   - Add a row: `Q1 2025`, `5.5`
3. Click **Save**
4. Verify new card appears in list
5. Verify API returns it:
   ```bash
   curl http://76.13.17.91/api/datasets | jq '.meta.total'
   # Should now be 12
   ```

**Test Edit Dataset:**

1. Click edit icon on any dataset card
2. Change Title (e.g., add "(Updated)")
3. Change Color to `#ff0000`
4. Add new row
5. Save
6. Click back to Data Hub
7. Verify changes reflected in card

**Test Delete Dataset:**

1. Click delete icon on the "Test Dataset" you created
2. Confirm deletion
3. Verify it's gone:
   ```bash
   curl http://76.13.17.91/api/datasets | jq '.meta.total'
   # Should be back to 11
   ```

**Test Reset:**

1. Make several changes to datasets
2. Click **"Reset to Default"** button
3. Confirm
4. Verify all datasets restored to original state

---

### Tab 2: Pages

**Verify:**
- [ ] List of all pages (EN + ID)
- [ ] Status badge (Published / Draft)
- [ ] Language badge (EN / ID)
- [ ] Edit and Delete buttons

**Test Edit Page:**

1. Click **Edit** on "About EN" page
2. Change Title to: `About AndaraLab — Research & Analysis`
3. Change description
4. Add a new content section (e.g., CTA)
5. Click Save
6. Go to `/about` in new tab
7. Verify changes appear

**Test Create New Page:**

1. Click **"+ New Page (EN)"**
2. Fill:
   - Slug: `/test-page`
   - Title: `Test Page`
   - Status: `Draft`
   - Section: `root`
3. Add content: Hero section
4. Save
5. Verify page exists:
   ```bash
   curl http://76.13.17.91/api/pages | jq '.meta.total'
   # Should be 15
   ```

**Test Delete Page:**
1. Delete "Test Page"
2. Verify count back to 14

---

### Tab 3: Blog

**Verify:**
- [ ] List of all blog posts
- [ ] Language toggle (EN / ID)
- [ ] Category badge
- [ ] Status badge

**Test Create New Blog Post:**

1. Click **"+ New Post (EN)"**
2. Fill form:
   - Slug: `test-post-2026`
   - Title: `Test Post — CMS Testing`
   - Status: `Draft`
   - Category: `economics-101`
   - Tag: `Testing`
   - Excerpt: `This is a test post from the CMS admin panel.`
   - Body: Add 3 paragraphs of text
   - Published Date: today's date
3. Save
4. Verify in list:
   ```bash
   curl http://76.13.17.91/api/blog | jq '.meta.total'
   # Should be 15
   ```

**Test Edit Blog Post:**

1. Click **Edit** on "Test Post — CMS Testing"
2. Change Status to `Published`
3. Add body paragraph
4. Save
5. Visit `/blog/test-post-2026`
6. Verify full content displayed

**Test Delete:**
1. Delete the test post
2. Verify count back to 14

**Test Link EN/ID:**
1. Open an English blog post
2. Click "Link to Indonesian Version"
3. Select matching Indonesian post
4. Save
5. Verify linked post icon appears

---

## Section 6: Language Toggle

### Test Steps

1. Go to `/data`
2. Toggle language to ID (if available)
3. Verify labels change (if localized content exists)

### API Language Test
```bash
# English pages
curl "http://76.13.17.91/api/pages?locale=en" | jq '.meta.total'
# Indonesian pages
curl "http://76.13.17.91/api/pages?locale=id" | jq '.meta.total'
```

---

## Section 7: CORS (API from Browser)

If accessing from a different domain:

```bash
curl -H "Origin: http://example.com" -i http://76.13.17.91/api/healthz
# Should include: Access-Control-Allow-Origin: http://example.com
```

---

## Section 8: Error Scenarios

### Test 404 on Dataset
```bash
curl http://76.13.17.91/api/datasets/nonexistent-id
# Expected: 404 Not Found
```

### Test Validation Error on Create
```bash
curl -X POST http://76.13.17.91/api/datasets \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'  # Missing required fields
# Expected: 400 Bad Request with validation error
```

### Test Delete Non-existent
```bash
curl -X DELETE http://76.13.17.91/api/datasets/99999
# Expected: 404 Not Found
```

---

## Section 9: Performance

### Response Time Test
```bash
time curl -s http://76.13.17.91/api/datasets > /dev/null
time curl -s http://76.13.17.91/api/blog > /dev/null
time curl -s http://76.13.17.91/api/pages > /dev/null
```

Expected: All responses under **500ms**

### Large Payload Test
```bash
curl http://76.76.13.17.91/api/datasets/oil-gas-production | jq '.rows | length'
# Expected: 28 rows
```

---

## Section 10: Deployment / VPS Commands

### Restart API Server
```bash
ssh root@76.13.17.91
pm2 restart api-server
```

### Check API Logs
```bash
ssh root@76.13.17.91
pm2 logs api-server --lines 50
```

### Pull Latest Code & Rebuild
```bash
ssh root@76.13.17.91
cd /opt/andara-lab
git pull origin main
pnpm --filter @workspace/api-server run build
pm2 restart api-server
# Rebuild frontend
pnpm --filter @workspace/andaralab run build
nginx -s reload
```

### Rebuild Frontend Only
```bash
ssh root@76.13.17.91
cd /opt/andara-lab
pnpm --filter @workspace/andaralab run build
nginx -s reload
```

### PM2 Status
```bash
ssh root@76.13.17.91
pm2 list
```

### Check Nginx Logs
```bash
ssh root@76.13.17.91
tail -20 /var/log/nginx/access.log
tail -20 /var/log/nginx/error.log
```

### VPS System Status
```bash
ssh root@76.13.17.91
uptime
df -h
free -m
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Blank page at `/admin` | API unreachable | Check PM2 status, restart if needed |
| Charts not showing | Wrong datasetId in page config | Check API `/api/pages` content sections |
| Changes not saving | API 500 error | Check PM2 logs |
| Slow response | Server load | Check `free -m` on VPS |
| 502 Bad Gateway | Nginx can't reach API | Check if PM2 is running |
| CORS error | Wrong origin | Add domain to `app.ts` CORS list |

---

## Quick Smoke Test (2 minutes)

Run this in terminal:

```bash
echo "=== 1. API Health ==="
curl -s http://76.13.17.91/api/healthz

echo ""
echo "=== 2. Dataset Count ==="
curl -s http://76.13.17.91/api/datasets | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).meta.total"

echo ""
echo "=== 3. Blog Post Count ==="
curl -s http://76.13.17.91/api/blog | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).meta.total"

echo ""
echo "=== 4. Pages Count ==="
curl -s http://76.13.17.91/api/pages | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).meta.total"

echo ""
echo "=== 5. Frontend HTML ==="
curl -s http://76.13.17.91/ | grep -o '<title>[^<]*</title>'

echo ""
echo "=== 6. Blog Post Titles ==="
curl -s http://76.13.17.91/api/blog | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).data.map(p=>p.title).join(', ')"

echo ""
echo "=== 7. Datasets by Category ==="
curl -s http://76.13.17.91/api/datasets | node -p "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).data; const cats=[...new Set(d.map(x=>x.category))]; cats.forEach(c=>console.log(c,':',d.filter(x=>x.category===c).length))"

echo ""
echo "=== 8. Analisis Deskriptif Records ==="
curl -s http://76.13.17.91/api/analisis | node -p "const a=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Records:', a.meta.total, '| Sections:', a.data[0]?.sections?.length, '| Widgets per section:', a.data[0]?.sections?.map(s=>s.widgets.length))"
```

**Expected output:**
```
=== 1. API Health ===
{"status":"ok"}
=== 2. Dataset Count ===
11
=== 3. Blog Post Count ===
14
=== 4. Pages Count ===
14
=== 5. Frontend HTML ===
<title>AndaraLab</title>
=== 8. Analisis Deskriptif Records ===
Records: 1 | Sections: 3 | Widgets per section: 3,2,2
```

---

---

## Section 12: Analisis Deskriptif (CMS Admin)

### 12.1 Overview

Fitur **Analisis Deskriptif** memungkinkan administrator untuk membuat dan mengelola bagian analisis yang bisa di-customize langsung dari CMS Admin Panel. Setiap record analisis terdiri dari multiple **sections**, dan setiap section berisi multiple **widgets** dengan berbagai tipe.

**Endpoint API:** `http://76.13.17.91/api/analisis`

---

### 12.2 Widget Types

| Tipe Widget | Fungsi | Use Case |
|-------------|--------|----------|
| `metric-card` | Kartu KPI dengan trend indicator | Menampilkan total datasets, blog posts, pages |
| `distribution` | Distribusi dengan color-coded items | Breakdown kategori, bahasa, status |
| `comparison` | Tabel perbandingan multi-kolom | Risk matrix, feature comparison |
| `highlight` | Callout box dengan background color | Key insight, warning, important note |
| `bar-chart` | Horizontal bar chart | Perbandingan kuantitatif antar item |
| `donut-chart` | Ring/donut chart | Proporsi distribusi |
| `custom-text` | Free-form text/HTML | Catatan tambahan, penjelasan |

---

### 12.3 API Test Commands

```bash
# List all analysis records
curl http://76.13.17.91/api/analisis | jq '.meta.total'
# Expected: 1 (default overview)

# Get specific record
curl http://76.13.17.91/api/analisis/default-overview | jq '.sections | length'
# Expected: 3 sections

# Get sections and widgets
curl http://76.13.17.91/api/analisis/default-overview | jq '.sections[].widgets | length'
# Expected: [3, 2, 2] — section 1 has 3 widgets, etc.

# Create new analysis
curl -X POST http://76.13.17.91/api/analisis \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Analysis",
    "titleEn": "Test Analysis EN",
    "description": "A test analysis record",
    "locale": "both",
    "status": "active",
    "sections": []
  }' | jq '.data.id'

# Update analysis
curl -X PUT http://76.13.17.91/api/analisis/default-overview \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' | jq '.meta.updated'
# Expected: true

# Reset to seed
curl -X POST http://76.13.17.91/api/analisis/reset | jq '.meta.reset'
# Expected: true
```

---

### 12.4 CMS Admin Panel — Tab 4: Analisis Deskriptif

**Navigasi:** Buka `http://76.13.17.91/admin` → Klik tab **"Analisis Deskriptif"**

#### Test Create New Analysis:

1. Klik **"+ New Analysis"**
2. Fill form:
   - Title (EN): `Test Analysis 2026`
   - Title (ID): `Analisis Test 2026`
   - Description: `Manual testing analysis`
   - Language Scope: `EN + ID`
   - Status: `Active`
3. Klik **Save Analysis**
4. Verify new record appears in list

#### Test Add Section:

1. Klik **Edit** pada record default
2. Klik **"+ Add Section"**
3. Fill:
   - Section Title: `Test Section`
   - Section Type: `Custom Analysis`
   - Order: `10`
4. Klik **Save Analysis**
5. Verify section appears in list

#### Test Add Widgets:

1. Buka section editor (klik **Edit** pada section)
2. Add widgets:
   - Klik **"Add Metric Card"** → fill: Label `Test KPI`, Value `100`, Trend `↑ Up`
   - Klik **"Add Distribution"** → add item: Label `Category A`, Value `5`, Percentage `50%`
   - Klik **"Add Highlight / Callout"** → isi Callout Text `This is a test insight`
   - Klik **"Add Comparison Table"** → add header `Item, Before, After`, add row `Feature 1, No, Yes`
3. Simpan dan verify widgets appear in preview

#### Test Widget Reordering:

1. Dalam section editor, klik ↑ atau ↓ pada widget untuk reorder
2. Verify order berubah setelah refresh

#### Test Delete Widget:

1. Dalam section editor, klik **Trash** icon pada widget
2. Verify widget hilang dari list

#### Test Delete Section:

1. Dalam analysis editor, klik **Trash** icon pada section header
2. Verify semua widget di dalam section ikut terhapus

#### Test Delete Analysis Record:

1. Klik **Trash** icon pada record card
2. Confirm deletion
3. Verify record hilang dari list

#### Test Reset to Seed:

1. Klik **"Reset to Seed"** button
2. Confirm
3. Verify default record (`default-overview`) kembali dengan 3 sections

---

### 12.5 Seed Data Structure

Default record (`default-overview`) berisi 3 sections:

```
Section 1: Cakupan Data (Overview)
├── Widget 1: metric-card (Total Konten: 11 datasets, 14 posts, 14 pages, 4 kategori)
├── Widget 2: distribution (Distribusi Dataset per Kategori)
└── Widget 3: highlight (Key Insight - Sectoral Intelligence dominance)

Section 2: Konten Blog (Blog Insights)
├── Widget 1: metric-card (Blog Statistics: 13 published, 10 EN, 4 ID)
├── Widget 2: distribution (Distribusi Blog per Kategori)
└── Widget 3: highlight (Content Strategy Insight)

Section 3: Analisis Risiko (Custom)
├── Widget 1: comparison (Risk Matrix)
└── Widget 2: highlight (Critical Action - Reset reminder)
```

---

### 12.6 Customization Capabilities

Admin dapat membuat analisis kustom yang menampilkan:

| Kapabilitas | Contoh Penggunaan |
|-----------|------------------|
| **Auto-generated metrics** | Total konten per kategori, distribusi bahasa |
| **Risk analysis** | Risk matrix dengan Dampak vs Likelihood |
| **Trend analysis** | Perbandingan data antar periode |
| **Distribution charts** | Breakdown konten per kategori |
| **Custom insights** | Callout box untuk key findings |
| **Multi-language** | Judul dan deskripsi EN + ID |
| **Section ordering** | Urutan sections bisa di-customize |
| **Widget types** | 7 tipe widget berbeda |

---

### 12.7 Integration with Other CMS Tabs

- **Data Hub** → Dataset metrics dan distribution widgets membaca data dari tab Data Hub
- **Blog** → Blog statistics widgets membaca data dari tab Blog
- **Pages** → Page metrics bisa ditambahkan sebagai metric-card widget
- Semua data di-simpan ke `/data/analisis.json` (file-based persistence)

---

Last updated: April 6, 2026

### 11.1 Gambaran Umum Sistem

Sistem **AndaraLab CMS** adalah platform Content Management System berbasis web yang terdiri dari tiga komponen utama:

| Komponen | Deskripsi |
|----------|-----------|
| **Frontend** | Aplikasi Next.js yang menyajikan konten ekonomi Indonesia kepada pengguna publik |
| **API Server** | Backend Node.js/Express yang menangani CRUD data, autentikasi CMS, dan agregasi |
| **Database** | Penyimpanan data dinamis (datasets, blog posts, pages) + Analisis Deskriptif |
| **Admin Panel** | CMS untuk mengelola konten — Data Hub, Pages, Blog, dan **Analisis Deskriptif** |

**Karakteristik Arsitektur:**
- Sistem menggunakan arsitektur **headless CMS** — frontend terpisah dari konten
- Data disajikan via REST API yang dapat dikonsumsi oleh berbagai client
- Admin panel (`/admin`) terhubung langsung ke API untuk pengelolaan konten
- Mendukung **multilingual** (EN/ID) pada level konten

---

### 11.2 Cakupan Pengujian (Test Coverage)

Pengujian ini mencakup **5 area fungsional utama** dan **3 area non-fungsional**:

#### Area Fungsional

| # | Area | Komponen Diuji | Prioritas |
|---|------|---------------|-----------|
| 1 | **Homepage** | Hero, Stats bar, Featured articles, GDP chart, CTA | Tinggi |
| 2 | **Data Hub** | 11 dataset cards, chart rendering, filter by category | Tinggi |
| 3 | **Blog** | 14 posts (13 published, 1 draft), detail page, language filter | Tinggi |
| 4 | **Pages** | 14 halaman EN/ID, slug routing, section-based filtering | Sedang |
| 5 | **CMS Admin** | CRUD datasets, CRUD blog, CRUD pages, link EN/ID | Tinggi |
| 6 | **Analisis Deskriptif** | CRUD analysis, section builder, widget editor (7 types) | Sedang |

#### Area Non-Fungsional

| # | Area | Metrik | Target |
|---|------|--------|--------|
| 1 | **Performance** | Response time API | < 500ms |
| 2 | **CORS** | Cross-origin request dari browser | Header valid |
| 3 | **Error Handling** | 404, 400, 500 responses | Pesan error sesuai |

---

### 11.3 Analisis Fitur Berdasarkan Kategori Konten

#### Data Hub — 11 Dataset

```
Distribusi berdasarkan Category:
├── Macro Foundations      : 3 dataset (GDP, Inflation, FDI)
├── Sectoral Intelligence  : 4 dataset (Oil/Gas, Trade, Nickel, Coal)
├── Market Dashboard       : 2 dataset (Exchange Rate, Digital Economy)
└── Financial Markets      : 1 dataset (SBN Yield)
```

**Insight:**
- Fokus utama AndaraLab adalah **Sectoral Intelligence** (4/11 = 36%) — menunjukkan fokus pada analisis sektoral ekonomi Indonesia
- **Macro Foundations** menjadi landasan data (3/11 = 27%)
- Masih terdapat ruang untuk ekspansi kategori **Financial Markets**

#### Blog — 14 Artikel

```
Distribusi berdasarkan Category:
├── economics-101       : 4 post  (grundgeskonsep ekonomi)
├── sectoral-analysis   : 4 post  (analisis sektoral)
├── financial-markets   : 2 post  (pasar keuangan)
├── policy-analysis     : 2 post  (analisis kebijakan)
└── market-pulse        : 1 post  (kondisi pasar terkini)
└── lab-notes          : 1 post  (catatan metodologi)

Status Publikasi:
├── Published : 13 post (93%)
└── Draft     : 1 post  (7%)

Bahasa:
├── English   : 10 post (71%)
└── Indonesian: 4 post  (29%)
```

**Insight:**
- Dominasi konten **economics-101** dan **sectoral-analysis** menunjukkan positioning sebagai platform edukasi + analisis
- Ketimpangan bahasa (EN 71% vs ID 29%) mengindikasikan target audience lebih condong ke pembaca internasional
- Terdapat **1 draft** yang perlu keputusan publikasi

#### Pages — 14 Halaman

```
Berdasarkan Section:
├── Sectoral Intelligence : 2 halaman (Energy EN + ID)
├── About                  : 2 halaman (EN + ID)
├── Root (Homepage dsb)    : 10 halaman
└── Kontak, dll            : sisanya
```

---

### 11.4 Analisis Risiko Pengujian

| Risiko | Dampak | Likelihood | Mitigasi |
|--------|--------|------------|----------|
| API server down saat testing | High | Medium | Checklist `healthz` di awal; restart via PM2 |
| Data hilang saat CRUD test | High | Low | Gunakan "Reset to Default" setelah testing |
| Perubahan pada dataset mempengaruhi chart homepage | Medium | Low | Verifikasi homepage setelah edit dataset |
| Cross-browser incompatibility (chart rendering) | Medium | Medium | Test di Chrome, Firefox, Safari |
| Link EN/ID blog break setelah edit | Medium | Low | Selalu verifikasi linked post icon |
| Multilingual content mismatch | Low | Low | Verifikasi label toggle bahasa |

---

### 11.5 Alur Pengujian yang Disarankan

```
START
  │
  ├─► 1. Pre-Test: Health Check
  │       └─► API Health → Datasets → Blog → Pages count
  │
  ├─► 2. Smoke Test (2 menit)
  │       └─► Quick validation semua endpoint
  │
  ├─► 3. Functional Test — User-Facing
  │       ├─► Homepage load & elements
  │       ├─► Data Hub chart rendering
  │       ├─► Blog article read flow
  │       └─► Page navigation
  │
  ├─► 4. Functional Test — Admin Panel
  │       ├─► CRUD Datasets (Create → Read → Update → Delete)
  │       ├─► CRUD Blog Posts
  │       ├─► CRUD Pages
  │       └─► Link EN/ID verification
  │
  ├─► 5. Non-Functional Test
  │       ├─► Response time < 500ms
  │       ├─► CORS headers
  │       └─► Error handling (404, 400, 500)
  │
  └─► 6. Post-Test: Reset to Default
          └─► Pastikan data kembali ke state awal
```

---

### 11.6 Titik Rawan (Pain Points) yang Perlu Perhatian

1. **Tidak ada test untuk autentikasi admin** — Pengujian ini tidak mencakup login/logout ke `/admin`. Jika panel admin dilindungi password, test plan perlu diperbarui.

2. **Tidak ada test untuk image/media upload** — CMS memungkinkan upload media tetapi tidak tercakup dalam pengujian ini.

3. **Data persistence antar test** — Test CRUD mengubah data aktif. Disarankan untuk selalu menjalankan **Reset to Default** sebelum menutup sesi testing.

4. **Filter bahasa tidak konsisten** — Test menunjukkan bahasa ID memiliki lebih sedikit konten. Perlu verifikasi apakah filter berfungsi atau memang kurang data.

5. **Tidak ada test untuk real-time data refresh** — Jika data di Data Hub di-update dari sumber eksternal, tidak ada mekanisme validasi otomatis.

---

### 11.7 Rekomendasi Pengujian Lanjutan

| # | Rekomendasi | Alasan |
|---|-------------|--------|
| 1 | **Automated E2E Testing** (Playwright/Cypress) | Mengotomatiskan regression test agar dapat dijalankan setiap deployment |
| 2 | **Load Testing** (k6/Artillery) | Mengukur performance di bawah concurrent users |
| 3 | **Security Audit** | Verifikasi input sanitization pada form CMS |
| 4 | **Database Backup Verification** | Pastikan backup berjalan otomatis sebelum test CRUD |
| 5 | **Mobile Responsiveness Test** | Pastikan chart dan layout berfungsi di mobile |
| 6 | **Link Checker** | Otomasi verifikasi semua internal link tidak broken |

---

Last updated: April 6, 2026
