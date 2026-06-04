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
- Data saat ini: 74 datasets, 18 blog posts, 32 pages — ini angka referensi

## Script Deploy Aman (pakai ini, jangan script lama)
- **Dari PC (SSH key wajib):** `UI-Mirror-Clone/scripts/deploy-andaralab-safe.ps1`
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
- Restart container `backend` kecuali terpaksa (session admin hilang)

## Cara Deploy yang Benar
### Frontend changes (AdminPage.tsx, UI, dll):
1. Build di host: `cd /opt/andara-lab/artifacts/andaralab && pnpm run build`
2. Copy ke container: `docker cp dist/public/. andaralab-frontend-1:/usr/share/nginx/html/`
3. Reload nginx: `docker exec andaralab-frontend-1 nginx -s reload`
4. JANGAN restart container frontend — nginx reload saja

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

## Known Issues (Masih Aktif)
- Docker compose build broken — pnpm install gagal karena @tanstack/query-test-utils
- Backend jalan via Docker container `backend` (image lama andaralab-backend:latest)
- Frontend container nginx butuh backend container bernama `backend` agar nginx bisa resolve hostname
- **PENTING**: Setiap kali backend container di-restart, semua session token hilang. Client harus logout + login ulang untuk dapat token baru. Token disimpan sebagai `andara_admin_token` di localStorage.
- Activity log endpoint sudah di-patch untuk tidak butuh auth (GET /api/activity bebas token)
- /images/ sudah di-proxy nginx ke backend untuk serve uploaded images
- Nginx config ada di dalam container: andaralab-frontend-1:/etc/nginx/conf.d/default.conf

## Bug/Error yang Sudah Diperbaiki (✓ All Resolved)

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

## Jangan Lakukan
- JANGAN restart backend container kecuali terpaksa — semua client session akan expired
- JANGAN rebuild frontend dari source kecuali benar-benar perlu — pakai docker cp + nginx reload
- JANGAN pakai `docker compose build` — broken
