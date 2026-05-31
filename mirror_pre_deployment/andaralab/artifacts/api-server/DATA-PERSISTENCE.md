# Data Persistence & Audit Trail

## Known Root Causes of Data Loss (Fixed)

### 1. ❌ Calendar seed used `new Date()` → ✅ Fixed with static dates
Previously, every server restart would re-seed calendar events with today's date.
If `calendar-events.json` was missing or empty, all user-entered events were replaced.
**Fix:** Seed data now uses fixed ISO dates (`2026-05-01`, etc.).

### 2. ❌ `normalizeDataset()` silently stripped `yAxisMin`/`yAxisMax` → ✅ Fixed
The normalization function deleted axis range values if they were "outside a sane range".
This caused admin-configured chart axis settings to disappear after save.
**Fix:** `normalizeDataset()` no longer touches `yAxisMin`/`yAxisMax`.

### 3. ❌ Non-atomic file writes → ✅ Fixed with temp-file + rename
If the server crashed mid-write, the JSON file could be left corrupt (empty or partial).
**Fix:** All writes now go to `<file>.tmp` first, then atomically renamed to the real file.

### 4. ❌ Activity log had no before/after snapshots → ✅ Fixed
Updates were logged but there was no way to know what changed.
**Fix:** Every `update` and `delete` now captures a `before` snapshot and a `diff` string.

### 5. ❌ Activity log capped at 500 entries → ✅ Increased to 2000
**Fix:** Max entries raised to 2000. Export endpoint added for full log download.

---

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

## Data Files

All data is stored in `/data/*.json`:
- `datasets.json` — Chart datasets
- `pages.json` — CMS pages
- `posts.json` — Blog posts
- `exchange-rates.json` — Exchange rates (auto-synced)
- `analisis.json` — Analysis records
- `featured-insights.json` — Featured insights config
- `calendar-events.json` — Calendar events
- `activity-log.json` — Full audit trail (up to 2000 entries)

## Audit Trail API

```
GET  /api/activity                    — list recent entries (default 200)
GET  /api/activity?limit=500          — list up to 500 entries
GET  /api/activity?resource=dataset   — filter by resource type
GET  /api/activity?action=update      — filter by action type
GET  /api/activity/export             — download full log as JSON file
DELETE /api/activity                  — clear all entries
```

Each log entry includes:
- `timestamp` — ISO timestamp
- `action` — create | update | delete | reset | bulk_create
- `resource` — dataset | page | post | calendar_event | etc.
- `resourceId` / `resourceTitle` — what was affected
- `ip` — client IP address
- `detail` — human-readable summary
- `before` — snapshot of record BEFORE mutation (update/delete)
- `after` — snapshot of record AFTER mutation (create/update)
- `diff` — field-level diff string (e.g. `title: "Old" → "New" | date: "2026-04-01" → "2026-05-01"`)

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
docker stop api-server
docker run --rm -v api-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data
docker start api-server
```

## Monitoring

```bash
# Watch store operations
docker logs api-server | grep "\[store\]"

# Watch audit trail
docker logs api-server | grep "\[audit\]"
```

Log patterns:
- `[store] ✓ Loaded <file>` — data loaded from disk
- `[store] ✓ Saved <file>` — data saved successfully
- `[store] ⚠ <file> not found` — first run or file missing, using seed
- `[store] ✗ Failed to write` — write error (check disk space/permissions)
- `[store] ⚠ Recovered from backup` — primary file was corrupt, restored from backup
- `[audit] <timestamp> | UPDATE dataset | id=ds-xxx | "Title"` — mutation logged

## Troubleshooting

### Data Lost After Restart?
1. Check volume is mounted: `docker inspect api-server | grep -A 10 Mounts`
2. Check data files exist: `docker exec api-server ls -la /data`
3. Check store logs: `docker logs api-server | grep "\[store\]"`
4. Check audit log: `GET /api/activity` to see what mutations happened

### Calendar Events Not Showing?
- Events are filtered by `enabled: true` and sorted by date
- The `GET /api/calendar/events` endpoint does NOT filter by date by default
- Add `?days=30` to only show events in the next 30 days
- Check if events exist: `GET /api/calendar/events` (no date filter)

### yAxisMin/yAxisMax Disappearing?
- This was a bug that has been fixed. The normalization function no longer strips these values.
- If you're on an older version, upgrade to the latest build.

### Permission Issues
```bash
docker exec api-server chown -R node:node /data
```
