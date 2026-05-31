# AndaraLab VPS Deployment

## Stack

- Frontend: React + Vite (served via Nginx in Docker)
- Backend: Node.js Express API (JSON file-based storage)
- Infrastructure: Docker Compose on VPS (Ubuntu)
- Data persistence: bind mount ke `/opt/andaralab-data` di host VPS

## Deploy

Cukup jalankan satu perintah dari folder `UI-Mirror-Clone/`:

```bash
python vps_deploy.py
```

## Deployment Contract (for all code assistants)

- Repo ini punya kontrak deploy wajib di `AGENTS.md`.
- `vps_deploy.py` akan memvalidasi kontrak tersebut sebelum deploy.
- Jika ada drift (metode diganti), deploy akan ditolak otomatis.
- Override hanya jika maintainer eksplisit menyetujui perubahan strategi:
  - `ALLOW_CONTRACT_DRIFT=1 python vps_deploy.py`

## Git Hook Lock (all laptops)

Jalankan sekali di setiap laptop developer:

```bash
pnpm run hooks:install
```

Hook ini akan:
- memblokir `commit`
- memblokir `push`

jika deployment contract berubah dari metode yang sudah distabilkan.

Script ini akan:
1. Buat tarball source code lokal (exclude node_modules, .git, dll)
2. Upload ke VPS via SFTP
3. Backup data live dari `/opt/andaralab-data` (tidak pernah dihapus)
4. Extract source, build Docker image frontend + backend
5. Restart containers dengan `docker compose up -d --force-recreate`
6. Verifikasi HTTP 200 frontend + backend

## Data Persistence

Data disimpan di **host VPS** di `/opt/andaralab-data/`, bukan di dalam container.

```
/opt/andaralab-data/
├── datasets.json
├── posts.json
├── pages.json
├── analisis.json
├── calendar-events.json
├── exchange-rates.json
└── featured-insights.json
```

Docker Compose mount path ini ke `/data` di dalam container backend:

```yaml
volumes:
  - /opt/andaralab-data:/data
```

Artinya: rebuild container, ganti image, pindah domain — **data tidak pernah hilang** selama VPS-nya masih ada.

## Automatic Daily Backup (Enabled)

Backup host data otomatis setiap hari:

- Script VPS: `/usr/local/bin/andaralab-backup.sh`
- Cron: `17 2 * * *` (pukul 02:17 server time)
- Backup dir: `/opt/andaralab-backups`
- Retensi: 14 hari (default)

Setiap deploy, `vps_deploy.py` akan:
1. install/update script backup,
2. memastikan cron aktif,
3. menjalankan 1 backup langsung (seed snapshot saat deploy).

## Akses

| URL | Keterangan |
|-----|------------|
| http://76.13.17.91 | Site publik |
| http://76.13.17.91/admin | CMS Admin |
| http://76.13.17.91:3001/api/datasets | API datasets |

## HTTPS Wajib (anti "Not Secure")

Untuk production, jangan expose HTTP mentah ke user. Wajib pasang TLS terminator (Nginx/Caddy/Cloudflare tunnel) dan redirect HTTP -> HTTPS.

Minimal checklist:

1. Domain diarahkan ke VPS (A record).
2. Pasang sertifikat valid (Let's Encrypt atau CDN SSL).
3. Force redirect 80 -> 443 di reverse proxy.
4. Set env backend `FORCE_HTTPS=true` agar API ikut menolak akses non-HTTPS di public host.
5. Pastikan frontend/API yang dipakai user lewat `https://domain...`, bukan IP `http://...`.

Contoh Nginx host-level:

```nginx
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com www.your-domain.com;

  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:80;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

## VPS Credentials

- Host: `76.13.17.91`
- User: `root`
- Credentials ada di `vps_deploy.py`

## Requirements

```bash
pip install paramiko
```
