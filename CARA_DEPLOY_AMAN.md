# CARA DEPLOY AMAN (TANPA GANGGU CMS DATA)

## 🎯 MASALAH
Kamu lagi edit dataset di CMS, tapi perlu deploy perubahan frontend. **TAKUT DATA KE-OVERWRITE** seperti kejadian kemarin.

## ✅ SOLUSI: FRONTEND-ONLY DEPLOYMENT

Deploy **HANYA frontend code**, **TIDAK SENTUH data CMS sama sekali**.

---

## 📋 APA YANG DI-DEPLOY?

### ✅ YANG DI-DEPLOY:
- Frontend build (HTML, CSS, JavaScript)
- Static assets (fonts, icons, dll)
- Styling/tampilan baru

### ❌ YANG TIDAK DI-TOUCH:
- **`/opt/andaralab-data/`** - Folder CMS data (datasets, pages, posts, images)
- **Backend API** - Tetap jalan seperti biasa
- **Database/JSON files** - Tidak diubah sama sekali

---

## 🚀 CARA DEPLOY

### Metode 1: Pakai Batch File (PALING MUDAH)
```bash
1. Double-click: DEPLOY_FRONTEND_ONLY.bat
2. Ketik "yes" untuk konfirmasi
3. Tunggu sampai selesai
4. Cek http://andaralab.id
```

### Metode 2: Manual
```bash
# 1. Build frontend
cd UI-Mirror-Clone/artifacts/andaralab
npm run build

# 2. Deploy
python deploy_frontend_only_safe.py
```

---

## 🔒 KENAPA INI AMAN?

### 1. **Backup Otomatis**
Sebelum deploy, frontend lama di-backup dulu:
```
/opt/andaralab/frontend-backup-20260508-143022/
```

### 2. **Tidak Touch Data**
Script **HANYA** update folder frontend:
```
/opt/andaralab/frontend/  ← HANYA INI yang diubah
/opt/andaralab-data/      ← TIDAK DISENTUH
```

### 3. **Atomic Operation**
Deploy pakai rsync + atomic move, jadi tidak ada "half-deployed" state.

### 4. **Verifikasi Otomatis**
Setelah deploy, script cek apakah data CMS masih utuh:
- Cek folder `/opt/andaralab-data/` masih ada
- Hitung jumlah datasets (harus tetap 57)

---

## 📊 STEP-BY-STEP YANG TERJADI

```
1. Build frontend di local
   └─> npm run build
   └─> Output: UI-Mirror-Clone/artifacts/andaralab/dist/public/

2. Backup frontend lama di VPS
   └─> cp /opt/andaralab/frontend → /opt/andaralab/frontend-backup-[timestamp]

3. Upload frontend baru ke VPS
   └─> rsync build/ → VPS:/tmp/frontend-deploy-[timestamp]/

4. Atomic move ke production
   └─> rm -rf /opt/andaralab/frontend/*
   └─> mv /tmp/frontend-deploy-[timestamp]/* → /opt/andaralab/frontend/

5. Verifikasi data CMS
   └─> ls /opt/andaralab-data/
   └─> Count datasets (harus 57)

6. Done! ✅
```

---

## 🔄 ROLLBACK (kalau ada masalah)

Kalau setelah deploy ada masalah, rollback gampang:

```bash
# SSH ke VPS
ssh root@177.7.55.182

# Restore frontend lama
rm -rf /opt/andaralab/frontend/*
cp -r /opt/andaralab/frontend-backup-[timestamp]/* /opt/andaralab/frontend/

# Done!
```

Ganti `[timestamp]` dengan timestamp backup yang dibuat tadi (contoh: `20260508-143022`).

---

## ⚠️ PENTING: KAPAN PAKAI INI?

### ✅ PAKAI FRONTEND-ONLY DEPLOY kalau:
- Kamu ubah tampilan/styling
- Kamu fix bug di frontend code
- Kamu tambah fitur UI baru
- **Client sedang edit di CMS** ← INI PENTING!

### ❌ JANGAN PAKAI kalau:
- Kamu ubah backend API
- Kamu ubah struktur data
- Kamu perlu update Docker containers
- Kamu perlu migrate database

---

## 🔧 BACKEND-ONLY DEPLOY (tanpa ganggu frontend & data)

Kalau yang berubah adalah **backend/API** (bukan tampilan), pakai ini:

```bash
python deploy_backend_only_safe.py
```

### Cara kerjanya:
```
1. Snapshot MD5 data CMS dulu (untuk verifikasi)
2. Tag image backend lama sebagai backup
3. Upload source backend baru ke VPS via rsync
4. Build image baru di VPS (frontend tetap jalan!)
5. Swap container backend → downtime ~3-5 detik
6. Health check API
7. Kalau gagal → rollback otomatis ke image lama
8. Verifikasi MD5 data CMS tidak berubah
```

### Yang TIDAK disentuh:
- `/opt/andaralab-data/` — data CMS aman 100%
- Frontend container — website tetap jalan selama build
- Nginx config — routing tidak berubah

### Rollback manual:
```bash
ssh root@177.7.55.182
cd /root/andaralab
docker tag andaralab-backend-backup-[timestamp] andaralab-backend:latest
docker-compose up -d --no-deps --force-recreate backend
```

---

## 🧪 TEST DULU DI LOCALHOST

**SEBELUM DEPLOY**, test dulu di localhost:

```bash
# 1. Jalankan localhost dengan production API
RUN_LOCALHOST_WITH_PRODUCTION_API.bat

# 2. Buka http://localhost:5173

# 3. Cek apakah perubahan kamu sudah benar

# 4. Kalau sudah OK, baru deploy
DEPLOY_FRONTEND_ONLY.bat
```

---

## 📝 CHECKLIST SEBELUM DEPLOY

- [ ] Sudah test di localhost dengan production API
- [ ] Perubahan hanya di frontend (tidak ada perubahan backend)
- [ ] Client tidak sedang upload image besar (tunggu selesai dulu)
- [ ] Sudah commit changes ke git (optional, tapi recommended)
- [ ] Sudah backup frontend lama (script akan otomatis backup)

---

## 🆘 TROUBLESHOOTING

### "sshpass command not found"
Install sshpass dulu:
```bash
# Windows (pakai Git Bash atau WSL)
# Atau pakai PuTTY/WinSCP untuk manual upload
```

### "Build failed"
```bash
cd UI-Mirror-Clone/artifacts/andaralab
npm install
npm run build
```

### "Cannot connect to VPS"
- Cek internet connection
- Cek VPS masih running: `ping 177.7.55.182`
- Cek SSH port: `telnet 177.7.55.182 22`

### "Datasets count mismatch"
Kalau setelah deploy jumlah datasets berubah, **ROLLBACK IMMEDIATELY**:
```bash
ssh root@177.7.55.182
rm -rf /opt/andaralab/frontend/*
cp -r /opt/andaralab/frontend-backup-[timestamp]/* /opt/andaralab/frontend/
```

---

## 💡 TIPS

1. **Deploy saat traffic rendah** - Malam hari atau pagi hari
2. **Kasih tahu client** - "Bentar ya, lagi update tampilan" (5-10 menit)
3. **Test di localhost dulu** - Jangan langsung deploy ke production
4. **Keep backup** - Jangan hapus backup lama sampai yakin deploy sukses
5. **Monitor setelah deploy** - Cek website 5-10 menit setelah deploy

---

## 🎓 TECHNICAL DETAILS

### Deployment Method
- **Rsync** untuk transfer files (efficient, hanya upload yang berubah)
- **Atomic move** untuk switch ke frontend baru (no downtime)
- **Backup before deploy** untuk safety net

### File Structure on VPS
```
/opt/andaralab/
├── frontend/                    ← Frontend production (yang di-deploy)
├── frontend-backup-[timestamp]/ ← Backup otomatis
├── backend/                     ← Backend API (tidak disentuh)
└── nginx/                       ← Nginx config (tidak disentuh)

/opt/andaralab-data/             ← CMS DATA (TIDAK DISENTUH!)
├── datasets.json
├── pages.json
├── posts.json
├── images/
└── ...
```

### Why This is Safe
1. **Separate directories** - Frontend dan data di folder terpisah
2. **No data migration** - Tidak ada script yang touch data files
3. **Backend keeps running** - API tetap serve data yang sama
4. **Nginx keeps serving** - Tidak perlu restart Nginx (optional reload)

---

## 📞 NEED HELP?

Kalau ada masalah:
1. **Jangan panic** - Ada backup otomatis
2. **Cek error message** - Biasanya jelas apa masalahnya
3. **Rollback dulu** - Restore frontend lama
4. **Debug di localhost** - Fix masalah di local dulu

---

## ✅ SUCCESS INDICATORS

Setelah deploy, cek ini:

1. **Website masih bisa dibuka**: http://andaralab.id ✅
2. **Datasets masih 57**: Buka Data Hub, hitung datasets ✅
3. **Pages masih ada**: About, Research, dll masih bisa dibuka ✅
4. **Images masih muncul**: Foto-foto di datasets masih keliatan ✅
5. **Client bisa edit**: CMS masih bisa dipakai untuk edit ✅

Kalau **SEMUA ✅**, berarti deploy sukses! 🎉

---

## 🚨 EMERGENCY ROLLBACK

Kalau ada masalah SERIUS (website down, data hilang, dll):

```bash
# 1. SSH ke VPS
ssh root@177.7.55.182

# 2. Restore frontend
cd /opt/andaralab
rm -rf frontend/*
cp -r frontend-backup-[timestamp]/* frontend/

# 3. Restart containers (kalau perlu)
docker restart andaralab-frontend andaralab-nginx

# 4. Cek website
curl http://andaralab.id
```

**PENTING**: Jangan hapus backup sampai yakin deploy sukses dan stabil minimal 24 jam!
