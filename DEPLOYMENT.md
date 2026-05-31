# Production Deployment Guide

## Quick Reference

### Deploy to Existing VPS
```bash
cd andaralab.id/UI-Mirror-Clone/deployment
python vps_deploy.py
```

### Migrate to New VPS
```bash
cd andaralab.id/UI-Mirror-Clone/deployment
python deploy_new_vps.py
```

### Resume Interrupted Deployment
```bash
python continue_deployment.py
```

## Data Safety Architecture

### Bind Mount Strategy

All production data is stored on the VPS host filesystem at `/opt/andaralab-data`. Docker containers mount this directory, ensuring:

- Data persists across container rebuilds
- No risk of data loss from `docker-compose down` or `docker system prune`
- Easy backup using standard filesystem tools
- Direct access for inspection and manual recovery

### Directory Structure on VPS

```
/opt/andaralab-data/          # Application data (bind mounted)
├── datasets.json             # Dataset records
├── pages.json                # CMS pages
├── posts.json                # Blog posts
├── exchange-rates.json       # Financial data
├── calendar-events.json      # Event data
├── featured-insights.json    # Featured content
├── analisis.json             # Analysis data
├── activity-log.json         # Audit log
└── images/                   # Uploaded images

/opt/andaralab-backups/       # Automated backups
├── andaralab-data-20260504-021700.tar.gz
├── andaralab-data-20260503-021700.tar.gz
└── ...

/root/andaralab/              # Application code
├── artifacts/
├── docker-compose.yml
├── Dockerfile
└── ...
```

## Deployment Process

### Initial Deployment

1. **Preparation**
   - Ensure VPS meets requirements (2GB RAM, 20GB disk, Ubuntu 20.04+)
   - Configure SSH access (key-based authentication recommended)
   - Open required ports (80, 443, 22)

2. **Execute Deployment**
   ```bash
   cd andaralab.id/UI-Mirror-Clone/deployment
   python vps_deploy.py
   ```

3. **Verification**
   - Frontend: `http://YOUR_VPS_IP`
   - Admin: `http://YOUR_VPS_IP/admin`
   - API: `http://YOUR_VPS_IP/api/datasets`

### Subsequent Deployments

Code updates do not affect data:

```bash
cd andaralab.id/UI-Mirror-Clone/deployment
python vps_deploy.py
```

The script will:
- Upload new code
- Rebuild Docker images
- Restart containers
- Preserve all data in `/opt/andaralab-data`

### VPS Migration

To migrate to a new VPS server:

1. **Add SSH Key to New VPS**
   ```bash
   ssh-copy-id root@NEW_VPS_IP
   ```

2. **Run Migration Script**
   ```bash
   cd andaralab.id/UI-Mirror-Clone/deployment
   python deploy_new_vps.py
   ```

3. **Update DNS**
   - Point domain A records to new VPS IP
   - Wait for DNS propagation (up to 48 hours)

## Backup and Recovery

### Automated Backups

Backups run daily at 02:17 server time via cron:

```bash
17 2 * * * /usr/local/bin/andaralab-backup.sh
```

**Retention:** 14 days (configurable via `KEEP_DAYS` environment variable)

### Manual Backup

```bash
ssh root@YOUR_VPS_IP
/usr/local/bin/andaralab-backup.sh
```

### Restore from Backup

1. **List Available Backups**
   ```bash
   ssh root@YOUR_VPS_IP
   ls -lh /opt/andaralab-backups/
   ```

2. **Stop Containers**
   ```bash
   cd /root/andaralab
   docker-compose down
   ```

3. **Restore Data**
   ```bash
   cd /opt/andaralab-backups
   tar -xzf andaralab-data-YYYYMMDD-HHMMSS.tar.gz -C /opt/andaralab-data
   ```

4. **Restart Containers**
   ```bash
   cd /root/andaralab
   docker-compose up -d
   ```

### Backup to Local Machine

```bash
scp root@YOUR_VPS_IP:/opt/andaralab-backups/andaralab-data-*.tar.gz ./backups/
```

## Domain Configuration

### DNS Setup (Hostinger)

1. Log in to Hostinger control panel
2. Navigate to DNS management
3. Add A records:
   ```
   Type    Name    Value           TTL
   A       @       YOUR_VPS_IP     3600
   A       www     YOUR_VPS_IP     3600
   ```

4. Wait for propagation (typically 1-4 hours)

### Verify DNS

```bash
nslookup andaralab.id
dig andaralab.id +short
```

### SSL Certificate (Optional)

Using Let's Encrypt with Certbot:

```bash
ssh root@YOUR_VPS_IP
apt-get update
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d andaralab.id -d www.andaralab.id
```

## Monitoring

### Container Status

```bash
ssh root@YOUR_VPS_IP
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                    STATUS
abc123def456   andaralab-frontend       Up 2 hours
def456ghi789   andaralab-backend        Up 2 hours
```

### Application Logs

```bash
# Frontend logs
docker logs andaralab-frontend-1 --tail 100 -f

# Backend logs
docker logs andaralab-backend-1 --tail 100 -f
```

### Health Checks

```bash
# Frontend
curl -I http://YOUR_VPS_IP/

# Backend API
curl http://YOUR_VPS_IP/api/health

# Dataset count
curl -s http://YOUR_VPS_IP/api/datasets | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',d)))"
```

### Disk Usage

```bash
ssh root@YOUR_VPS_IP
df -h /opt/andaralab-data
du -sh /opt/andaralab-backups/*
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs andaralab-backend-1
docker logs andaralab-frontend-1

# Verify data directory
ls -lah /opt/andaralab-data/

# Check permissions
stat /opt/andaralab-data/
```

### API Returns 502/504

```bash
# Check backend container
docker ps | grep backend

# Restart backend
docker restart andaralab-backend-1

# Check backend logs
docker logs andaralab-backend-1 --tail 50
```

### Data Not Persisting

```bash
# Verify bind mount
docker inspect andaralab-backend-1 | grep -A 10 Mounts

# Expected output should show:
# "Source": "/opt/andaralab-data"
# "Destination": "/data"
```

### Port Already in Use

```bash
# Find process using port 80
lsof -i :80

# Stop conflicting service
systemctl stop apache2  # or nginx, etc.
```

### Full Disk

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a

# Remove old backups manually
rm /opt/andaralab-backups/andaralab-data-2026*.tar.gz
```

## Security Considerations

### SSH Access

- Use SSH keys instead of passwords
- Disable root password login in `/etc/ssh/sshd_config`
- Use non-standard SSH port if desired
- Implement fail2ban for brute force protection

### Firewall Configuration

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Data Directory Permissions

```bash
chmod 700 /opt/andaralab-data
chown root:root /opt/andaralab-data
```

### Backup Encryption (Optional)

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.tar.gz

# Decrypt backup
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz
```

## Performance Optimization

### Docker Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          memory: 512M
```

### Database Optimization

For large datasets, consider:
- Indexing frequently queried fields
- Implementing pagination
- Using database connection pooling
- Caching frequently accessed data

### CDN Integration

For static assets and images:
- Configure Cloudflare or similar CDN
- Update `VITE_API_BASE_URL` for API routing
- Serve images from `/opt/andaralab-data/images` via CDN

## Maintenance

### Regular Tasks

**Weekly:**
- Review application logs
- Check disk usage
- Verify backup integrity

**Monthly:**
- Update Docker images
- Review security updates
- Test backup restoration
- Audit user activity logs

**Quarterly:**
- Full system backup
- Security audit
- Performance review
- Dependency updates

### Update Procedure

1. **Backup Current State**
   ```bash
   /usr/local/bin/andaralab-backup.sh
   ```

2. **Pull Latest Code**
   ```bash
   cd andaralab.id/UI-Mirror-Clone/deployment
   git pull origin main
   ```

3. **Deploy Update**
   ```bash
   python vps_deploy.py
   ```

4. **Verify Deployment**
   ```bash
   curl http://YOUR_VPS_IP/api/health
   ```

## Support and Documentation

- Deployment scripts: `andaralab.id/UI-Mirror-Clone/deployment/`
- Technical documentation: `andaralab.id/UI-Mirror-Clone/docs/`
- Agent contract: `andaralab.id/UI-Mirror-Clone/AGENTS.md`
- DNS setup: `hostinger_nameserver_setup.md`

For deployment issues, check container logs and verify data directory integrity before attempting recovery procedures.
