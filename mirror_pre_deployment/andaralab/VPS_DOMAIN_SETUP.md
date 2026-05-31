# Setup Domain andaralab.id di VPS

Sistem sudah didesain untuk full-stack di VPS tanpa Vercel. Berikut langkah setup:

## Current Architecture (VPS)

```
VPS (76.13.17.91)
├── Frontend (Nginx) → Port 80
├── Backend (Express) → Port 3001
└── Data Persistence → /opt/andaralab-data
```

## Langkah 1: Setup DNS

### Di Provider Domain (misal: Niagahoster, Namecheap, dll)

Tambahkan DNS record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.13.17.91 | 3600 |
| A | www | 76.13.17.91 | 3600 |

Tunggu propagasi DNS (5-30 menit). Cek dengan:
```bash
nslookup andaralab.id
ping andaralab.id
```

## Langkah 2: Update Nginx Config untuk Domain

Edit `Dockerfile.frontend`, update server_name:

```dockerfile
server {
    listen 80;
    server_name andaralab.id www.andaralab.id localhost;
    root /usr/share/nginx/html;
    index index.html;
    # ... rest of config
}
```

## Langkah 3: Setup SSL dengan Let's Encrypt

### Install Certbot di VPS

```bash
# SSH ke VPS
ssh root@76.13.17.91

# Install certbot
apt update
apt install certbot python3-certbot-nginx -y
```

### Generate SSL Certificate

```bash
# Stop nginx container temporarily
cd /opt/andara-lab
docker compose stop frontend

# Generate certificate
certbot certonly --standalone -d andaralab.id -d www.andaralab.id

# Certificate akan disimpan di:
# /etc/letsencrypt/live/andaralab.id/fullchain.pem
# /etc/letsencrypt/live/andaralab.id/privkey.pem
```

### Update Docker Compose untuk Mount SSL

Edit `docker-compose.yml`:

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    networks:
      - andaralab-network
    restart: unless-stopped
```

### Update Nginx Config untuk HTTPS

Edit `Dockerfile.frontend`, tambahkan SSL config:

```dockerfile
server {
    listen 80;
    server_name andaralab.id www.andaralab.id;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name andaralab.id www.andaralab.id;

    ssl_certificate /etc/letsencrypt/live/andaralab.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/andaralab.id/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /usr/share/nginx/html;
    index index.html;

    # ... rest of config (SPA routing, API proxy, etc)
}
```

## Langkah 4: Deploy ke VPS

```bash
# Dari local machine
cd UI-Mirror-Clone
python vps_deploy.py
```

Script ini akan:
1. Build Docker image dengan config baru
2. Deploy ke VPS
3. Restart containers
4. Verifikasi deployment

## Langkah 5: Setup Auto-Renewal SSL

```bash
# Di VPS
crontab -e

# Tambahkan:
0 3 * * * certbot renew --quiet && docker -f /opt/andara-lab/docker-compose.yml restart frontend
```

## Langkah 6: Verifikasi

```bash
# Cek HTTP
curl http://andaralab.id

# Cek HTTPS
curl https://andaralab.id

# Cek API
curl https://andaralab.id/api/datasets

# Cek SSL
curl -I https://andaralab.id
```

## Alternative: Tanpa SSL (HTTP Only)

Jika tidak ingin setup SSL dulu, cukup:

1. Setup DNS (Langkah 1)
2. Update `server_name` di `Dockerfile.frontend` (Langkah 2)
3. Deploy (Langkah 4)

Site akan accessible di http://andaralab.id

## Summary

- Sistem sudah siap untuk full-stack di VPS
- Frontend dan backend sudah dalam satu Docker Compose
- Nginx sudah di-config untuk SPA routing dan API proxy
- Hanya perlu setup DNS dan optional SSL
- Deploy dengan `python vps_deploy.py`

Keuntungan tanpa Vercel:
- Full control di VPS
- Tidak ada limit deployment Vercel
- Backend dan frontend di satu tempat
- Lebih simple untuk maintenance
