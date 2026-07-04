---
inclusion: manual
---

# AndaraLab Project Rules

## Stack & Infrastructure
- VPS: 177.7.55.182 (AlmaLinux 10.1), user: root
- Frontend: Docker container `andaralab-frontend-1`, image `andaralab-frontend:latest`, nginx port 8080
- Backend: Docker container `backend` (renamed), image `andaralab-backend:latest`, port 3001
- Data: `/opt/andaralab-data/` — bind mount ke container backend sebagai `/data`
- App source: `/opt/andara-lab/`
- Backup data: `/opt/andaralab-data-backup-[timestamp]/`
- Network: `andara-lab_andaralab-network`
- Node.js tersedia di host via dnf (v22), pnpm v11, PM2 tersedia
- Docker compose build BROKEN (pnpm install gagal di Dockerfile) — jangan pakai `docker compose build`

## Login Credentials
- Frontend login: client-side auth di `AdminAuthPage.tsx`
- admin1 / AndaraLab@Secure#2026!
- admin2 / AndaraLab@Secure#2026@
- Backend auth endpoint: POST /api/auth/login (ada di Docker image, bukan di host source)

## Data Safety — WAJIB DIIKUTI
- JANGAN PERNAH sentuh `/opt/andaralab-data/` kecuali untuk backup
- JANGAN PERNAH `docker compose down -v` atau `docker volume rm`
- JANGAN PERNAH `rm -rf` apapun di `/opt/andaralab-data/`
- Sebelum deploy apapun: backup dulu dengan `cp -r /opt/andaralab-data /opt/andaralab-data-backup-[timestamp]`
- Data saat ini: 84 datasets, 45 blog posts, 28 pages — angka referensi per Jun 2026

## ⚠️ RACE CONDITION — Edit File JSON Saat Backend Aktif
**JANGAN PERNAH** edit `posts.json`, `pages.json`, `datasets.json`, atau file data lain di `/opt/andaralab-data/` secara langsung (Python/shell) **selama backend container sedang running dan client sedang aktif edit di CMS.**

### Kenapa berbahaya:
Backend auto-save tiap 3 detik dari browser client ke file yang sama. Urutan kejadian yang merusak data:
```
1. Python baca posts.json  → dapat 45 posts
2. Backend auto-save       → tulis 45 posts ke disk (ok)
3. Client buat post baru   → backend tulis 46 posts ke disk
4. Python tulis balik      → OVERWRITE dengan 45 posts lama → post baru HILANG
```
Kejadian ini terbukti terjadi Jun 2026 — posts 85 & 92 sempat hilang, harus di-restore dari backup.

### Yang BOLEH dilakukan (aman):
- **Edit via API PUT**: `curl -X PUT http://localhost:3001/api/blog/:id -H 'Content-Type: application/json' -d '{...}'` — backend yang handle, thread-safe
- **Edit JSON hanya kalau backend STOP dulu**: `docker stop backend` → edit file → `docker start backend`
- **Baca-only** (`cat`, `python3 -c "json.load(...)"` tanpa write) — aman kapan saja

### Cara aman edit konten post via API (contoh patch body):
```bash
# Baca dulu
curl -s http://localhost:3001/api/blog/85 | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin)['data']['body'], indent=2))"
# Update via PUT (JANGAN tulis langsung ke JSON)
curl -s -X PUT http://localhost:3001/api/blog/85 \
  -H 'Content-Type: application/json' \
  -d '{"body": ["line 1", "line 2"]}'
```

## Script Deploy Aman (pakai ini, jangan script lama)
- **Dari PC (SSH timeout → otomatis HTTPS/Cloudflare):** `UI-Mirror-Clone/scripts/deploy-andaralab-safe.ps1`
  - Script ini sudah include: `rm -rf dist` sebelum build, copy `Navbar.tsx` + `nav-order.ts`, backup data otomatis
- **HTTPS only (bypass port 22):** `UI-Mirror-Clone/scripts/deploy-via-cloudflare.ps1` → `POST https://andaralab.id/api/webhook/deploy?secret=...` (sama seperti tombol deploy di CMS / Zed)
  - Frontend saja: `-FrontendOnly` (tidak restart backend / tidak sentuh data)
  - Backend saja: `-BackendOnly` (hanya file route, **bukan** `seed-data.ts`)
  - Keduanya: tanpa flag (default partial hari ini)
- **Dari Web Console VPS (kalau SSH timeout):** `bash /opt/andara-lab/scripts/vps-deploy-on-server.sh`
- **Python frontend-only:** `deploy_frontend_only_safe.py` (aturan sama: build di VPS, docker cp, verifikasi count)

### Yang menyebabkan overwrite (JANGAN PAKAI LAGI)
- `docker compose build` / `up --force-recreate` / `down -v`
- `rsync --delete` ke folder frontend lama (`/opt/andaralab/frontend`)
- Extract tarball / `git reset --hard` di atas seluruh `/opt/andara-lab` tanpa backup
- Deploy `seed-data.ts` ke production (hanya untuk reset CMS, bukan update live)
- Restart container `backend` kecuali terpaksa — **session admin hilang + data in-flight bisa hilang kalau ada yang lagi edit**

## Cara Deploy yang Benar
### Frontend changes (AdminPage.tsx, UI, dll):
1. **WAJIB clean build** — `rm -rf dist` dulu, baru build. Tanpa ini `index.html` bisa tetap nunjuk ke bundle JS lama (menu/UI tidak ikut update meski source sudah benar).
2. Build di host: `cd /opt/andara-lab/artifacts/andaralab && rm -rf dist && pnpm run build`
3. Copy ke container: `docker cp dist/public/. andaralab-frontend-1:/usr/share/nginx/html/`
4. Reload nginx: `docker exec andaralab-frontend-1 nginx -s reload`
5. JANGAN restart container frontend — nginx reload saja
6. **Verifikasi wajib setelah deploy frontend** (lihat bagian "Checklist Verifikasi Deploy" di bawah)

### Backend changes (routes, lib, dll):
1. Copy file ke host source: `/opt/andara-lab/artifacts/api-server/src/`
2. Rebuild dengan tsx via PM2 (bukan Docker): `pm2 restart api-server`
3. Backend jalan via PM2 + tsx, BUKAN Docker (Docker build broken)
4. Kalau PM2 mati, jalankan: `cd /opt/andara-lab/artifacts/api-server && PORT=3001 NODE_ENV=production DATA_DIR=/opt/andaralab-data CORS_ALLOW_ALL=true pm2 start --interpreter ./node_modules/.bin/tsx src/index.ts --name api-server`

### Kalau frontend container crash:
- Jangan rebuild image
- Jalankan dari image lama: `docker run -d --name andaralab-frontend-1 --network andara-lab_andaralab-network -p 127.0.0.1:8080:80 --restart unless-stopped andaralab-frontend:latest`
- Backend container harus bernama `backend` (bukan andaralab-backend-1) agar nginx bisa resolve

## Rules untuk Kiro — WAJIB
1. **DIAGNOSE DULU sebelum action** — baca kode yang relevan, pahami sistem, baru eksekusi
2. **JANGAN trial-error di production** — kalau tidak yakin, tanya dulu
3. **Satu perubahan sekaligus** — jangan ubah banyak hal bersamaan
4. **Test di staging/localhost dulu** kalau ada perubahan besar
5. **Kalau ada error, stop dan diagnose** — jangan langsung coba fix lain
6. **Selalu verifikasi data count** setelah setiap operasi (datasets harus 74, posts 18, pages 32)
7. **Jangan restart container** kalau bisa reload saja
8. **Kalau ragu, tanya** — lebih baik tanya 1 pertanyaan daripada bikin chaos
9. **Setelah deploy frontend** — wajib verifikasi `index.html` hash + menu Commodity di bundle sebelum bilang "selesai" ke client

## SSH / SCP ke VPS — WAJIB
- **Selalu pakai SSH key baru**: `-i ~/.ssh/id_ed25519_andaralab_new` (fallback: `id_ed25519_andaralab`, `id_rsa_andaralab`)
- **Selalu pakai**: `-o StrictHostKeyChecking=no`
- **JANGAN pernah** jalankan `ssh` atau `scp` tanpa flag `-i` — akan hang nunggu password input dan timeout
- Template SSH: `ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_ed25519_andaralab_new root@177.7.55.182 "<command>"`
- Template SCP: `scp -o StrictHostKeyChecking=no -i ~/.ssh/id_ed25519_andaralab_new <local> root@177.7.55.182:<remote>`
- Kalau timeout juga, cek dulu apakah SSH key-nya `id_rsa_andaralab` atau `id_ed25519_andaralab` (coba keduanya)

## File Penting
- Frontend source: `/opt/andara-lab/artifacts/andaralab/src/`
- Backend source: `/opt/andara-lab/artifacts/api-server/src/`
- Nginx config: di dalam container `andaralab-frontend-1:/etc/nginx/conf.d/default.conf`
- AdminPage.tsx: sudah di-patch dengan image upload UI di PostEditor
- Auth: `AdminAuthPage.tsx` (client-side), `admin-auth.ts` (backend session)
- **Navbar submenu:** `src/components/Navbar.tsx` + `src/lib/nav-order.ts` (urutan submenu otomatis)
- **Commodity page (hardcoded):** route di `App.tsx`, komponen `CommodityPage` di `SectionPage.tsx` — **BUKAN** entry di `pages.json` CMS

## Navbar & Submenu — WAJIB PAHAMI
Submenu **Sectoral Intelligence** dibangun dari:
1. Halaman CMS dengan `section = "Sectoral Intelligence"` / `"Intelijen Sektoral"` (deep-dives, regional, esg)
2. **Plus inject wajib** di `Navbar.tsx`: **Commodity** (`/sectoral/commodity`) — karena halaman ini tidak ada di CMS `pages.json`

Urutan submenu sectoral (client tidak perlu set manual di CMS):
| Urutan | Slug | Label EN | Label ID |
|--------|------|----------|----------|
| 1 | `/sectoral/deep-dives` | Strategic Industry Deep-dives | Deep-dive Industri |
| 2 | `/sectoral/regional` | Regional Economic Monitor | Monitor Regional |
| 3 | `/sectoral/esg` | ESG | ESG |
| 4 | `/sectoral/commodity` | Commodity | Komoditas |

**JANGAN** hapus logic inject Commodity di Navbar. **JANGAN** expect Commodity muncul dari CMS Pages — memang sengaja hardcoded.

## Checklist Verifikasi Deploy (Frontend)
Jalankan **setelah setiap** deploy frontend — supaya client tidak lihat UI lama:

```bash
# 1. index.html harus nunjuk bundle TERBARU (bukan hash lama)
docker exec andaralab-frontend-1 grep -o 'index\.[0-9]*\.js' /usr/share/nginx/html/index.html

# 2. Bundle itu harus ada di container
docker exec andaralab-frontend-1 ls -la /usr/share/nginx/html/assets/index.*.js | tail -3

# 3. Commodity harus ada di bundle (menu + route)
docker exec andaralab-frontend-1 sh -c 'grep -c sectoral/commodity /usr/share/nginx/html/assets/index.*.js | grep -v ":0"'

# 4. Live site (dari luar)
curl -s https://andaralab.id/ | grep -o 'index\.[0-9]*\.js'
curl -s https://andaralab.id/sectoral/commodity | head -c 500
```

Kalau langkah 3 gagal (count 0): **deploy belum efektif** — ulangi clean build + docker cp. Minta client hard refresh (`Ctrl+Shift+R`) setelah fix.

File frontend yang **wajib** ikut deploy script (`deploy-andaralab-safe.ps1`) kalau ubah menu:
- `src/components/Navbar.tsx`
- `src/lib/nav-order.ts`

## Backend Keepalive Setup
- **Restart policy**: `always` — container auto-restart kalau crash + auto-start on VPS reboot
- **Cron watchdog**: `*/2 * * * * /opt/andara-lab/scripts/watchdog-backend.sh` — cek tiap 2 menit
  - Cek `docker inspect backend` → running?
  - Cek `GET /api/healthz` → `{"status":"ok"}`?
  - Kalau salah satu gagal → `docker start` atau `docker restart backend` otomatis
  - Log: `/var/log/andaralab-watchdog.log`
- **Health endpoint**: `GET http://localhost:3001/api/healthz` → `{"status":"ok"}` (bukan `/api/health` — itu 404)
- **Cek watchdog log**: `tail -20 /var/log/andaralab-watchdog.log`

## Known Issues (Masih Aktif)
- Docker compose build broken — pnpm install gagal karena @tanstack/query-test-utils
- Backend jalan via Docker container `backend` (image lama andaralab-backend:latest)
- Frontend container nginx butuh backend container bernama `backend` agar nginx bisa resolve hostname
- **PENTING**: Setiap kali backend container di-restart, semua session token hilang. Client harus logout + login ulang untuk dapat token baru. Token disimpan sebagai `andara_admin_token` di localStorage.
- Activity log endpoint sudah di-patch untuk tidak butuh auth (GET /api/activity bebas token)
- /images/ sudah di-proxy nginx ke backend untuk serve uploaded images
- Nginx config ada di dalam container: andaralab-frontend-1:/etc/nginx/conf.d/default.conf
- **Container frontend menumpuk banyak `index.*.js`** dari deploy lama — yang dipakai browser cuma yang direferensikan `index.html`. Selalu verifikasi hash di `index.html` setelah deploy (lihat checklist di atas).
- Browser client bisa cache bundle lama — setelah deploy menu/UI, infoin client untuk hard refresh.

## Bug/Error yang Sudah Diperbaiki (✓ All Resolved)

### 15. Paste gambar ke doc editor → 413 loop + save gagal (Jun 2026)
- **Problem**: `BlogDocEditor` tidak punya `onPaste` handler → paste gambar dari clipboard → browser embed base64 dataUrl ke contentEditable → `htmlToBodyLines` simpan string base64 (bisa >50MB) ke `draft.body` → auto-save tiap 2 detik kirim payload >50MB → backend return 413 terus-menerus. Post 85 kena 1,245 kali 413 error dalam ~1 jam.
- **Fix**: (1) Tambah `onPaste` handler di `BlogDocEditor.tsx` — intercept paste gambar, langsung upload via `/api/upload/image`, insert URL yang proper. (2) Tambah filter `!src.startsWith("data:")` di semua `pushBlock([IMG: ...])` di `blog-doc-editor.ts` sebagai safety net.
- **Cegah regresi**: Jangan hapus `onPaste` handler di `BlogDocEditor`. Jangan store base64 di body lines.
- **Perlu diketahui**: Gambar yang dipaste sebelum fix ini di-deploy hanya ada di localStorage browser client, TIDAK tersimpan di server. Client perlu re-upload gambar via tombol UploadCloud di toolbar editor (bukan paste).

### 16. Gambar body artikel hilang di live site meski terlihat di CMS (Jun 2026)
- **Problem**: Gambar di CMS editor kelihatan (dari localStorage) tapi tidak muncul di live site. Terjadi karena: (1) silent fallback `updatePost` menyimpan ke localStorage waktu 413 terjadi, CMS tampilkan "Saved" padahal backend reject. (2) Setelah fix base64 filter, `preflush()` strip base64 sehingga gambar hilang dari payload save.
- **Fix**: Tambah `preflush()` async di `BlogDocEditorHandle` — sebelum save, scan DOM untuk `<img src="data:...">`, upload masing-masing ke `/api/upload/image`, replace src dengan URL yang proper, BARU serialize body lines. `doSave` di `PostEditor` memanggil `preflush()` bukan `flush()`.
- **Untuk gambar yang sudah hilang**: Cek `/opt/andaralab-data/images/` untuk orphaned uploads. Gambar yang ter-upload via toolbar tapi tidak sempat tersimpan di body (karena 413) akan ada di sana sebagai ORPHAN. Cek dengan: `python3 -c "import json; posts=json.load(open('/opt/andaralab-data/posts.json')); print(json.dumps([l for p in posts for l in p.get('body',[]) if '[IMG:' in l], indent=2))"`. Kalau gambar ada di `/images/` tapi tidak direferensikan di posts/pages mana pun → ORPHAN, bisa di-restore manual ke body post via edit posts.json langsung + `docker restart backend`.

### 1. Home Page kembali ke interface awal sebelum di-update
- **Problem**: Deploy ke VPS menimpa seluruh folder frontend, docker image di-build dari source code lama sehingga hero image, menu, dan konten statis kembali ke default.
- **Fix**: Proses deploy frontend dan backend dipisahkan, build selalu pakai source code terbaru, backup otomatis setiap deploy.

### 2. Grafik chart tidak berurut dengan tahun/bulan/Q
- **Problem**: Data dari CMS tidak ada mekanisme sorting otomatis, urutan mengikuti urutan input bukan kronologis.
- **Fix**: Logika sorting ditambahkan di backend sebelum data dikirim ke frontend. Normalisasi format periode (tahun, bulan, kuartal) supaya konsisten dan berurutan dari terlama ke terbaru.

### 3. Login page /admin hilang (404)
- **Problem**: Konfigurasi Nginx untuk SPA routing tidak menangani path /admin setelah index.html diganti.
- **Fix**: Nginx config pakai `try_files $uri /index.html` untuk semua route, sehingga React Router bisa handle navigasi internal termasuk /admin.

### 4. Kategori pada dataset tidak muncul semua di chart
- **Problem**: Komponen chart hanya merender kategori dari data point pertama. Inkonsistensi format key kategori (huruf besar/kecil, spasi).
- **Fix**: Logika agregasi kategori di frontend membaca semua data point + normalisasi key sebelum rendering chart.

### 5. Data failed to upload — 413 Payload Too Large
- **Problem**: Express.js dan Nginx default hanya allow 1MB request body. Dataset ekonomi bisa 10-30MB.
- **Fix**: Express `express.json({limit: '50mb'})`, Nginx `client_max_body_size 50m`, validasi ukuran file di frontend.

### 6. Updated content tidak muncul di CMS dan website
- **Problem**: Browser cache agresif pada response API + race condition antara simpan dan fetch ulang.
- **Fix**: Header `Cache-Control: no-store` pada semua response API, invalidasi cache di React Query setiap mutasi, re-fetch otomatis setelah create/update/delete.

### 7. Data baru tidak memunculkan grafik
- **Problem**: InteractiveChart versi lama tidak punya auto-detection untuk skala Y-axis ketika magnitude data sangat berbeda. Parser parseXLabel tidak mengenali format baru.
- **Fix**: Deploy InteractiveChart terbaru dengan: (1) auto log-scale detection (rasio >50x), (2) dynamic Y-axis scaling, (3) improved parseXLabel yang mengenali format BPS/Indonesia (Q1 2024, Jan 2024, dll) + sorting kronologis, (4) fallback ke preserveInputOrder.

### 8. Artikel blog muncul di section yang salah (Sectoral Intelligence → Macro Foundation)
- **Problem**: SectionPage melakukan word-splitting pada nama kategori dan match setiap kata individual, menyebabkan false positive.
- **Fix**: Logika matching diganti ke strict direct-match: post hanya muncul di section jika field category/subcategory/tag cocok exact match atau contains, tanpa word-splitting.

### 9. Body text artikel blog tidak ada font size dan bold
- **Problem**: Body text di-render sebagai plain paragraph tanpa formatting.
- **Fix**: Dukungan markdown-like di ArticlePage: `#` = heading (22px bold), `##` = subheading (18px bold), `###` = sub-subheading (15px bold), `**teks**` = bold. Langsung diproses saat render, tanpa plugin tambahan.

### 10. Upload image artikel blog gagal (hanya <100KB yang berhasil)
- **Problem**: Nginx default `client_max_body_size` 1MB, request tidak sampai ke backend (413 error).
- **Fix**: `client_max_body_size 50m` di Nginx frontend container. Backend validasi maks 10MB per file, format: JPG, PNG, GIF, WebP, SVG.

### 11. Posisi image pada CMS tidak sesuai dengan live
- **Problem**: Field imagePosition tersimpan benar di DB tapi ArticlePage tidak punya conditional rendering berdasarkan imagePosition.
- **Fix**: Conditional rendering: top = image di atas body, bottom = image di bawah body. Gallery images (post.images array) ditampilkan sebagai grid 2-3 kolom.

### 12. Search bar di Data Hub suggestion tidak sesuai ketikan
- **Problem**: Search filter hanya match title/description/category. Kata seperti 'GDP' ada di nama kolom dataset tapi tidak di title.
- **Fix**: Search matching diperluas ke: (1) nama kolom dataset (ds.columns), (2) field subcategory.

### 13. Custom theme table hilang di live website
- **Problem**: Frontend yang di-serve pakai build lama sebelum fitur tableStyle ditambahkan. Data tableStyle di DB tetap utuh.
- **Fix**: Deploy build terbaru dengan: (1) DatasetPreviewTable + dukungan tableStyle (headerBg, headerText, headerBorder, rowOddBg, rowEvenBg, rowHoverBg, cellBorder, containerBg, containerBorder), (2) AdminPage DatasetEditor dengan panel 'Table Color Palette' + color picker per dataset. Default tema oranye (#E67E22).

### 14. Menu Commodity hilang di submenu Sectoral Intelligence (Jun 2026)
- **Problem**: Client tidak lihat "Commodity" / "Komoditas" di navbar meski halaman `/sectoral/commodity` sudah ada di kode. Penyebab ganda: (1) halaman Commodity **tidak** ada di CMS `pages.json` — navbar production hanya baca submenu dari CMS; (2) setelah fix Navbar, `index.html` di container masih mereferensikan bundle JS lama (`index.1780192835257.js` dari 31 Mei) yang tidak punya menu Commodity, sementara bundle baru sudah ter-build tapi tidak ter-link.
- **Fix**: (1) `Navbar.tsx` selalu inject Commodity ke submenu Sectoral + sort via `nav-order.ts`; (2) deploy script pakai `rm -rf dist` sebelum `pnpm run build` agar `index.html` update hash bundle; (3) `docker cp dist/public/.` + `nginx -s reload`; (4) verifikasi `grep sectoral/commodity` di bundle yang direferensikan `index.html`.
- **Cegah regresi**: Jangan deploy frontend tanpa clean build. Jangan hapus inject Commodity di Navbar. Selalu jalankan checklist verifikasi deploy.

## Jangan Lakukan
- JANGAN restart backend container kecuali terpaksa — semua client session akan expired
- JANGAN rebuild frontend dari source kecuali benar-benar perlu — pakai docker cp + nginx reload
- JANGAN pakai `docker compose build` — broken
- JANGAN `pnpm run build` tanpa `rm -rf dist` dulu — risiko `index.html` stuck ke bundle lama (menu Commodity/UI lain tidak muncul)
- JANGAN anggap deploy sukses cuma karena `pnpm build` selesai — **wajib** cek hash JS di `index.html` container vs bundle terbaru
- JANGAN hapus menu Commodity dari Navbar atau expect muncul otomatis dari CMS Pages
- **JANGAN edit file JSON di `/opt/andaralab-data/` langsung saat backend running** — race condition, data bisa hilang (lihat seksi ⚠️ Race Condition di atas)
- **JANGAN `docker restart backend` saat client lagi aktif edit** — data in-flight dari auto-save bisa hilang ke backup state
