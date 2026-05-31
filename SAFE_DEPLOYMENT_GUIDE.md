# 🛡️ Safe Update Deployment - Zero Downtime

## ⚡ Quick Start

### 1. Setup SSH Key (Sekali Aja)

```bash
# Generate SSH key baru
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_andaralab

# Copy ke VPS
ssh-copy-id -i ~/.ssh/id_rsa_andaralab.pub root@177.7.55.182
```

### 2. Deploy Update

```bash
python safe_update_deployment.py
```

## 🎯 Apa yang Script Ini Lakukan?

### ✅ AMAN - Zero Downtime Strategy

1. **Backup Data Dulu** 
   - Backup semua data di `/opt/andaralab-data`
   - Simpan di `/opt/andaralab-backups/pre-update-TIMESTAMP.tar.gz`

2. **Check Production State**
   - Cek container yang lagi jalan
   - Cek frontend (HTTP 200?)
   - Cek backend (HTTP 200?)
   - Cek jumlah datasets (55 datasets masih ada?)

3. **Build Image Baru (Tanpa Stop Production)**
   - Upload code baru ke `/root/andaralab_new`
   - Build image baru: `andaralab-frontend:new` dan `andaralab-backend:new`
   - Production tetap jalan di port 80 & 3001

4. **Test Image Baru (Port Berbeda)**
   - Start test containers di port 8080 & 3002
   - Test frontend: `curl http://localhost:8080/`
   - Test backend: `curl http://localhost:3002/api/datasets`
   - Verify data: cek jumlah datasets sama
   - Stop test containers

5. **Switch ke Version Baru (Cepat)**
   - Tag image baru jadi `latest`
   - Move code: `/root/andaralab` → `/root/andaralab_old`
   - Move code: `/root/andaralab_new` → `/root/andaralab`
   - Restart containers (downtime ~5-10 detik)

6. **Verify Production**
   - Cek frontend OK
   - Cek backend OK
   - Cek data integrity (55 datasets masih ada?)

7. **Rollback Otomatis (Kalau Gagal)**
   - Restore code lama
   - Restart dengan image lama
   - Data tetap aman

8. **Cleanup**
   - Hapus code lama
   - Hapus test containers
   - Hapus unused images

## 🔒 Data Safety Guarantees

### ✅ Data TIDAK AKAN HILANG karena:

1. **Bind Mount Strategy**
   ```yaml
   volumes:
     - /opt/andaralab-data:/data
   ```
   Data ada di VPS host, bukan di container!

2. **Backup Sebelum Deploy**
   - Otomatis backup sebelum mulai
   - Bisa restore manual kalau perlu

3. **Test Sebelum Switch**
   - Test container baru dulu
   - Verify data masih ada
   - Baru switch kalau OK

4. **Rollback Otomatis**
   - Kalau gagal, langsung rollback
   - Data tetap di `/opt/andaralab-data`

## 📊 Deployment Timeline

```
00:00 - Connect SSH
00:05 - Check production (frontend OK, backend OK, 55 datasets)
00:10 - Backup data (create pre-update-20260505-120000.tar.gz)
00:15 - Upload code (5-10 MB)
00:20 - Build frontend image (3-5 menit)
05:20 - Build backend image (2-3 menit)
07:20 - Test containers on port 8080 & 3002
07:40 - Verify test (frontend OK, backend OK, 55 datasets)
07:45 - Switch to new version (DOWNTIME: 5-10 detik)
07:55 - Verify production (frontend OK, backend OK, 55 datasets)
08:00 - Cleanup
08:05 - DONE! ✅
```

**Total Time:** ~8 menit  
**Downtime:** ~5-10 detik (saat restart containers)

## 🚨 Rollback Manual (Kalau Perlu)

### Jika Deployment Gagal:

```bash
# 1. Connect ke VPS
ssh -i ~/.ssh/id_rsa_andaralab root@177.7.55.182

# 2. Restore code lama
cd /root
rm -rf andaralab
mv andaralab_old andaralab

# 3. Restart containers
cd andaralab
docker compose down
docker compose up -d

# 4. Verify
curl http://localhost/
curl http://localhost:3001/api/datasets
```

### Jika Data Corrupt:

```bash
# 1. Stop containers
cd /root/andaralab
docker compose down

# 2. List backups
ls -lh /opt/andaralab-backups/

# 3. Restore data
cd /opt/andaralab-data
rm -rf *
tar -xzf /opt/andaralab-backups/pre-update-TIMESTAMP.tar.gz

# 4. Restart containers
cd /root/andaralab
docker compose up -d
```

## 🔍 Monitoring During Deployment

### Terminal 1: Run Deployment
```bash
python safe_update_deployment.py
```

### Terminal 2: Monitor Logs (Optional)
```bash
# Connect ke VPS
ssh -i ~/.ssh/id_rsa_andaralab root@177.7.55.182

# Watch containers
watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

# Watch logs
docker logs -f andaralab-backend-1
```

### Terminal 3: Monitor Website (Optional)
```bash
# Watch frontend
watch -n 2 'curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://andaralab.id/'

# Watch backend
watch -n 2 'curl -s -o /dev/null -w "Backend: %{http_code}\n" http://andaralab.id/api/datasets'
```

## ⚙️ What Gets Updated?

### ✅ Code Changes (Safe to Update):
- Frontend components (React/TypeScript)
- Backend API (Node.js/Express)
- Docker images
- Dependencies (package.json)
- Configuration files

### ❌ Data (NEVER Touched):
- `/opt/andaralab-data/datasets.json` (55 datasets)
- `/opt/andaralab-data/pages.json`
- `/opt/andaralab-data/posts.json`
- `/opt/andaralab-data/activity-log.json`
- `/opt/andaralab-data/images/`
- All CMS content

## 🎨 Your Recent Changes

Berdasarkan request Anda, perubahan yang akan di-deploy:

1. **Customizable Table Colors**
   - Palette di CMS untuk warna tabel
   - User bisa pilih warna sendiri

2. **Security Improvements**
   - HTTPS/SSL ready
   - Security headers
   - Input validation

3. **Performance Optimizations**
   - Faster loading
   - Better caching
   - Optimized images

## 📝 Pre-Deployment Checklist

- [ ] SSH key sudah di-setup
- [ ] Bisa connect ke VPS: `ssh -i ~/.ssh/id_rsa_andaralab root@177.7.55.182`
- [ ] Production masih jalan: `http://andaralab.id`
- [ ] Code changes sudah di-commit
- [ ] Backup manual (optional): `ssh root@177.7.55.182 "/usr/local/bin/andaralab-backup.sh"`

## 🚀 Deploy Now!

```bash
python safe_update_deployment.py
```

## 📞 Troubleshooting

### Error: "SSH key not found"
```bash
# Generate key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_andaralab

# Copy to VPS
ssh-copy-id -i ~/.ssh/id_rsa_andaralab.pub root@177.7.55.182
```

### Error: "SSH key authentication failed"
```bash
# Manual copy
cat ~/.ssh/id_rsa_andaralab.pub

# SSH ke VPS (pakai password)
ssh root@177.7.55.182

# Paste key
mkdir -p ~/.ssh
echo "PASTE_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Error: "Build failed"
- Script akan otomatis abort
- Production tetap jalan
- Tidak ada perubahan

### Error: "Test failed"
- Script akan otomatis abort
- Test containers di-stop
- Production tetap jalan

### Error: "Production verification failed"
- Script akan otomatis rollback
- Restore code lama
- Restart containers

## 🎯 Success Indicators

Deployment berhasil kalau:
- ✅ Frontend: HTTP 200
- ✅ Backend: HTTP 200
- ✅ Datasets: 55 (atau jumlah yang sama)
- ✅ Activity log: masih ada
- ✅ CMS: bisa login
- ✅ Images: masih bisa diakses

## 📊 Post-Deployment Verification

```bash
# Check website
curl -I http://andaralab.id/

# Check API
curl http://andaralab.id/api/datasets | jq '.data | length'

# Check admin
curl -I http://andaralab.id/admin

# Check activity log
curl http://andaralab.id/api/activity | jq '. | length'
```

## 🔐 Security Notes

### SSH Key vs Password

**Before (Insecure):**
```python
VPS_PASS = "072398?Aarahmi"  # ❌ Password in code
```

**After (Secure):**
```python
SSH_KEY_PATH = "~/.ssh/id_rsa_andaralab"  # ✅ SSH key
```

### Benefits:
- ✅ No password in code
- ✅ More secure
- ✅ Can revoke key without changing password
- ✅ Can use different keys for different purposes

## 📚 Related Files

- `safe_update_deployment.py` - Main deployment script
- `deploy_to_new_vps.py` - Initial deployment (first time)
- `DEPLOYMENT.md` - Full deployment documentation
- `hostinger_nameserver_setup.md` - DNS setup guide

## 💡 Tips

1. **Deploy saat traffic rendah** (malam/dini hari)
2. **Inform client** sebelum deploy (meskipun downtime cuma 5-10 detik)
3. **Monitor logs** selama deployment
4. **Keep backup** minimal 7 hari
5. **Test di staging** dulu kalau ada perubahan besar

## ✅ Ready to Deploy?

```bash
python safe_update_deployment.py
```

**Estimated Time:** 8 menit  
**Downtime:** 5-10 detik  
**Risk:** Very Low (auto rollback)  
**Data Loss Risk:** Zero (bind mount + backup)
