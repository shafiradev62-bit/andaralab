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

## File Penting
- Frontend source: `/opt/andara-lab/artifacts/andaralab/src/`
- Backend source: `/opt/andara-lab/artifacts/api-server/src/`
- Nginx config: di dalam container `andaralab-frontend-1:/etc/nginx/conf.d/default.conf`
- AdminPage.tsx: sudah di-patch dengan image upload UI di PostEditor
- Auth: `AdminAuthPage.tsx` (client-side), `admin-auth.ts` (backend session)

## Known Issues
- Docker compose build broken — pnpm install gagal karena @tanstack/query-test-utils
- Backend jalan via Docker container `backend` (image lama andaralab-backend:latest)
- Frontend container nginx butuh backend container bernama `backend` agar nginx bisa resolve hostname
- **PENTING**: Setiap kali backend container di-restart, semua session token hilang. Client harus logout + login ulang untuk dapat token baru. Token disimpan sebagai `andara_admin_token` di localStorage.
- Activity log endpoint sudah di-patch untuk tidak butuh auth (GET /api/activity bebas token)
- /images/ sudah di-proxy nginx ke backend untuk serve uploaded images
- Nginx config ada di dalam container: andaralab-frontend-1:/etc/nginx/conf.d/default.conf

## Jangan Lakukan
- JANGAN restart backend container kecuali terpaksa — semua client session akan expired
- JANGAN rebuild frontend dari source kecuali benar-benar perlu — pakai docker cp + nginx reload
- JANGAN pakai `docker compose build` — broken
