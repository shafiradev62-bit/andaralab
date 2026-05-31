# 🏠 Localhost Setup Guide - Pre-Deploy Backup

## 📋 Overview

Setup ini akan menjalankan **versi backup pre-deploy** (5 Mei 7:52 PM) di localhost Anda untuk comparison dengan production sekarang.

**Data yang akan di-run:**
- ✅ 55 datasets (sebelum deploy)
- ✅ 32 pages
- ✅ 18 posts
- ✅ 24 images

**Tujuan:**
- 🔍 Compare dengan production sekarang
- 🔍 Lihat dataset yang hilang
- 🔍 Lihat content yang berubah
- 🔍 Verify sebelum restore ke production

---

## 🚀 QUICK START

### Windows (Recommended)

```bash
cd localhost_pre_deploy
quick_start.bat
```

### Linux/Mac

```bash
cd localhost_pre_deploy
chmod +x quick_start.sh
./quick_start.sh
```

Script akan:
1. ✅ Check Docker installed
2. ✅ Check Docker images available
3. ✅ Start containers
4. ✅ Wait for ready
5. ✅ Show access URLs

---

## 📦 Prerequisites

### 1. Docker Desktop
- **Windows:** Download dari https://www.docker.com/products/docker-desktop
- **Mac:** Download dari https://www.docker.com/products/docker-desktop
- **Linux:** Install docker & docker-compose

### 2. Docker Images

Anda perlu Docker images `andaralab-backend` dan `andaralab-frontend`.

**Option A: Pull dari VPS (Recommended - Cepat)**
```bash
python setup_localhost_images.py
# Pilih option 1
```

Script akan:
- Connect ke VPS
- Save images dari VPS
- Download ke local (~900MB total)
- Load ke Docker local
- Cleanup

**Option B: Build dari Source Code (Lambat)**
```bash
python setup_localhost_images.py
# Pilih option 2
```

Requires source code di `UI-Mirror-Clone/UI-Mirror-Clone/`

---

## 🎯 STEP BY STEP

### Step 1: Setup Docker Images

```bash
# Check if images already exist
docker images | grep andaralab

# If not exist, pull from VPS
python setup_localhost_images.py
```

### Step 2: Start Localhost

```bash
cd localhost_pre_deploy

# Windows
quick_start.bat

# Linux/Mac
./quick_start.sh
```

### Step 3: Access Localhost

Open browser:
- **Frontend:** http://localhost:8081
- **Backend API:** http://localhost:3002/api/datasets
- **Admin Panel:** http://localhost:8081/admin

### Step 4: Compare dengan Production

Open 2 tabs:
- **Tab 1:** http://localhost:8081 (pre-deploy backup)
- **Tab 2:** http://andaralab.id (production sekarang)

**Check:**
- [ ] Dataset count: localhost (55) vs production (57)
- [ ] Missing dataset: "Number of Saving Accounts by Balance Tier"
- [ ] Modified datasets: check timestamps
- [ ] Pages & posts: should be same

---

## 🔍 COMPARISON CHECKLIST

### Datasets
```bash
# Localhost (pre-deploy)
curl http://localhost:3002/api/datasets | python -c "import sys,json; d=json.load(sys.stdin); print(f'Total: {len(d.get(\"data\",d))}')"

# Production (current)
curl http://andaralab.id/api/datasets | python -c "import sys,json; d=json.load(sys.stdin); print(f'Total: {len(d.get(\"data\",d))}')"
```

Expected:
- Localhost: 55 datasets
- Production: 57 datasets
- Difference: 2 datasets (1 missing, 3 new, net +2)

### Missing Dataset
Search di localhost: "Number of Saving Accounts by Balance Tier"
- ✅ Should exist in localhost
- ❌ Should NOT exist in production

### Modified Datasets
Check timestamps di localhost vs production:
- Export/Import data
- Oil & Gas production
- External Debt data

---

## 🛠️ MANUAL SETUP (Alternative)

Kalau quick start tidak work, manual setup:

```bash
cd localhost_pre_deploy

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## 📊 CONTAINER DETAILS

### Backend Container
- **Name:** andaralab-localhost-backend
- **Port:** 3002 (host) → 3001 (container)
- **Data:** `./data` mounted to `/data`
- **Image:** andaralab-backend:latest

### Frontend Container
- **Name:** andaralab-localhost-frontend
- **Port:** 8081 (host) → 80 (container)
- **Image:** andaralab-frontend:latest

---

## 🐛 TROUBLESHOOTING

### Problem: Docker images not found

**Solution:**
```bash
python setup_localhost_images.py
# Choose option 1 (pull from VPS)
```

### Problem: Port already in use

**Solution:**
```bash
# Check what's using the port
netstat -ano | findstr :8081
netstat -ano | findstr :3002

# Stop conflicting service or change port in docker-compose.yml
```

### Problem: Containers won't start

**Solution:**
```bash
# Check logs
docker-compose logs

# Check Docker Desktop is running
docker ps

# Restart Docker Desktop
```

### Problem: Backend returns 502/504

**Solution:**
```bash
# Check backend logs
docker logs andaralab-localhost-backend

# Restart backend
docker restart andaralab-localhost-backend

# Wait 10 seconds
timeout /t 10
```

### Problem: Data not loading

**Solution:**
```bash
# Check data files exist
ls -la data/

# Check backend can read data
docker exec andaralab-localhost-backend ls -la /data/

# Check file permissions
```

---

## 🧹 CLEANUP

### Stop containers
```bash
cd localhost_pre_deploy
docker-compose down
```

### Remove containers & volumes
```bash
docker-compose down -v
```

### Remove images (to free space)
```bash
docker rmi andaralab-backend:latest
docker rmi andaralab-frontend:latest
```

---

## 📝 NOTES

### Data Location
All data files are in `localhost_pre_deploy/data/`:
- `datasets.json` - 55 datasets
- `pages.json` - 32 pages
- `posts.json` - 18 posts
- `images/` - 24 images

### Timestamps
All data is from **5 Mei 2026, 7:52 PM** (before deploy).

### Read-Only
This is for comparison only. Changes in localhost will NOT affect production.

### Network
Containers are isolated. No connection to production VPS.

---

## ✅ SUCCESS CHECKLIST

After setup, verify:
- [ ] Docker Desktop running
- [ ] Images loaded: `docker images | grep andaralab`
- [ ] Containers running: `docker ps | grep andaralab`
- [ ] Frontend accessible: http://localhost:8081
- [ ] Backend API working: http://localhost:3002/api/datasets
- [ ] Data loading correctly (55 datasets)

---

## 🎓 NEXT STEPS

After comparing localhost vs production:

1. **Identify differences**
   - Missing datasets
   - Modified content
   - Changed layouts

2. **Decide restore strategy**
   - Full restore (risky - will lose client updates)
   - Safe restore (recommended - preserve client updates)
   - Selective restore (manual)

3. **Run safe restore**
   ```bash
   python create_safe_restore.py
   ```

---

## 📞 SUPPORT

If you encounter issues:
1. Check Docker Desktop is running
2. Check logs: `docker-compose logs`
3. Check data files exist: `ls -la data/`
4. Restart containers: `docker-compose restart`
5. Check this guide again

---

**Status:** ✅ Ready to run  
**Risk:** 🟢 None (localhost only, no production impact)  
**Time:** ~5-10 minutes (depending on image download)
