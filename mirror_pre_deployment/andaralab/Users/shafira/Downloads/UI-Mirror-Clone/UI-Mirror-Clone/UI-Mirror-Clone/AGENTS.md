# Agent Operating Contract

## AndaraLab — Deployment Rules for AI Assistants

This file is a hard guardrail. The deploy script (`vps_deploy.py`) checks for this file
and its contents before every deployment. **Do NOT modify the deployment method without
explicit approval from the project maintainer.**

---

## Approved Production Deployment Method

- **Script**: `vps_deploy.py` (Python + paramiko SSH)
- **Infrastructure**: Docker Compose on VPS at `76.13.17.91`
- **Frontend**: Built by `Dockerfile.frontend` via Vite, served by Nginx
- **Backend**: Built by `Dockerfile` (Node.js Express), serves JSON file storage
- **Data persistence**: Bind mount `/opt/andaralab-data:/data` on VPS host — **NEVER wiped on deploy**
- **API URL in production**: Relative `/api` proxied via Nginx → `backend:8080`
- **Fallback API**: `http://76.13.17.91:3001/api` (direct VPS backend, for SSR fallback only)
- **`VITE_ALLOW_API_FALLBACK`**: Must be `false` in production — prevents silent fallback to stale seed data

## What Agents MUST NOT Change

1. Do NOT change the data persistence method (bind mount at `/opt/andaralab-data`)
2. Do NOT change `VITE_API_BASE_URL=/api` in `Dockerfile.frontend`
3. Do NOT change `VITE_API_FALLBACK_BASE_URL=http://76.13.17.91:3001/api` in `Dockerfile.frontend`
4. Do NOT set `VITE_ALLOW_API_FALLBACK=true` in any production build
5. Do NOT change `docker-compose.yml` volume mounts for data
6. Do NOT deploy by any method other than `vps_deploy.py`

## Approved Override

If the maintainer explicitly approves a deployment strategy change:

```bash
ALLOW_CONTRACT_DRIFT=1 python vps_deploy.py
```

---

*This contract was established to protect the 99-dataset production database from being
overwritten by seed data on future deploys.*
