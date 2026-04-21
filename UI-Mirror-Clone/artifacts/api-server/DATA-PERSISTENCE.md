# Data Persistence - IMPORTANT!

## Problem Solved ✓

Data was being lost on VPS restarts because the `/data` directory wasn't persisted.

## What Was Fixed

1. **Dockerfile**: Added `VOLUME ["/data"]` to persist data across container restarts
2. **Store**: Added backup mechanism and detailed logging
3. **Deployment**: You MUST mount a volume when running the container

## Deployment Instructions

### Docker Run (with volume mount)
```bash
docker run -d \
  --name api-server \
  -p 8080:8080 \
  -v api-data:/data \
  your-image-name
```

### Docker Compose
```yaml
version: '3.8'
services:
  api-server:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - api-data:/data
    environment:
      - NODE_ENV=production
      - PORT=8080

volumes:
  api-data:
    driver: local
```

### Direct Host Mount (Alternative)
```bash
docker run -d \
  --name api-server \
  -p 8080:8080 \
  -v /path/on/host/data:/data \
  your-image-name
```

## Data Files

All data is stored in `/data/*.json`:
- `datasets.json` - Chart datasets
- `pages.json` - CMS pages
- `posts.json` - Blog posts
- `exchange-rates.json` - Exchange rates (auto-synced)
- `analisis.json` - Analysis records
- `featured-insights.json` - Featured insights config
- `calendar-events.json` - Calendar events

## Backup & Recovery

### Manual Backup
```bash
# Copy data directory from container
docker cp api-server:/data ./backup

# Or from named volume
docker run --rm -v api-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .
```

### Restore from Backup
```bash
# Stop container
docker stop api-server

# Restore data
docker run --rm -v api-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data

# Start container
docker start api-server
```

## Environment Variables

- `DATA_DIR` - Override data directory (default: `/data`)
- `EXCHANGE_SYNC_ENABLED` - Enable/disable exchange rate sync (default: `true`)
- `EXCHANGE_SYNC_INTERVAL_MS` - Sync interval in milliseconds (default: `30000`)

## Monitoring

Check logs for data operations:
```bash
docker logs api-server | grep "\[store\]"
```

You should see:
- `✓ Loaded <filename> from disk` - Data loaded successfully
- `✓ Saved <filename> to disk` - Data saved successfully
- `⚠ <filepath> not found, using seed data` - First run or data missing

## Troubleshooting

### Data Lost After Restart?
1. Check if volume is mounted: `docker inspect api-server | grep -A 10 Mounts`
2. Check data directory: `docker exec api-server ls -la /data`
3. Check logs: `docker logs api-server | grep "\[store\]"`

### Permission Issues
```bash
# Fix permissions
docker exec api-server chown -R node:node /data
```

### Backup Failed to Primary Location?
The system automatically tries to save backups to `/app/data-backup/` inside the container.
Check there if `/data` has issues.
