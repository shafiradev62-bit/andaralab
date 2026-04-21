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
