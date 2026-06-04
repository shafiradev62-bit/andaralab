#!/usr/bin/env bash
# Jalankan di VPS (Web Console) — mengikuti andaralab-rules.md
# AMAN: backup data, partial deploy, docker cp + nginx reload, PM2 backend
# TIDAK: docker compose build/up, down -v, git reset --hard, sentuh isi /opt/andaralab-data

set -euo pipefail

REMOTE_ROOT="/opt/andara-lab"
DATA_DIR="/opt/andaralab-data"
FRONTEND_CONTAINER="andaralab-frontend-1"
TS="$(date +%Y%m%d-%H%M%S)"

FRONTEND_ONLY="${FRONTEND_ONLY:-0}"
BACKEND_ONLY="${BACKEND_ONLY:-0}"
if [ "$FRONTEND_ONLY" = "0" ] && [ "$BACKEND_ONLY" = "0" ]; then
  FRONTEND_ONLY=1
  BACKEND_ONLY=1
fi

count_data() {
  python3 - <<PY
import json, os
base = "$DATA_DIR"
for name in ("datasets", "posts", "pages"):
    p = os.path.join(base, f"{name}.json")
    print(f"{name}={len(json.load(open(p))) if os.path.isfile(p) else -1}")
PY
}

echo "=== AndaraLab safe on-server deploy ==="
echo "BEFORE:"
count_data | tee /tmp/andaralab-counts-before.txt

echo "Backup -> ${DATA_DIR}-backup-${TS}"
cp -r "$DATA_DIR" "${DATA_DIR}-backup-${TS}"

if [ "$FRONTEND_ONLY" = "1" ]; then
  echo "Build frontend on VPS..."
  cd "$REMOTE_ROOT/artifacts/andaralab"
  pnpm run build
  echo "docker cp + nginx reload (no container restart)..."
  docker cp dist/public/. "${FRONTEND_CONTAINER}:/usr/share/nginx/html/"
  docker exec "${FRONTEND_CONTAINER}" nginx -s reload
fi

if [ "$BACKEND_ONLY" = "1" ]; then
  echo "PM2 restart api-server (not docker compose)..."
  cd "$REMOTE_ROOT/artifacts/api-server"
  if pm2 describe api-server >/dev/null 2>&1; then
    pm2 restart api-server
  else
    PORT=3001 NODE_ENV=production DATA_DIR="$DATA_DIR" CORS_ALLOW_ALL=true \
      pm2 start --interpreter ./node_modules/.bin/tsx src/index.ts --name api-server
  fi
fi

echo "AFTER:"
count_data | tee /tmp/andaralab-counts-after.txt

while IFS= read -r line; do
  key="${line%%=*}"; after="${line##*=}"
  before="$(grep "^${key}=" /tmp/andaralab-counts-before.txt | cut -d= -f2)"
  if [ -n "$before" ] && [ "$after" -lt "$before" ]; then
    echo "ERROR: ${key} turun (${before} -> ${after}). Restore: ${DATA_DIR}-backup-${TS}"
    exit 1
  fi
done < /tmp/andaralab-counts-after.txt

echo "=== OK. Cek https://andaralab.id ==="
