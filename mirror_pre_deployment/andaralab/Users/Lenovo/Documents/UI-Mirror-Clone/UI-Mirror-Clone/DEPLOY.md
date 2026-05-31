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

## VPS Credentials

- Host: `76.13.17.91`
- User: `root`
- Credentials ada di `vps_deploy.py`

## Requirements

```bash
pip install paramiko
```
