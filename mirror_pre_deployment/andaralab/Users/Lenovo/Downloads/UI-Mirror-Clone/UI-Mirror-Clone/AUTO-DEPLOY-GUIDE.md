# 🚀 Panduan Deploy VPS Otomatis - AndaraLab

Sistem deployment otomatis untuk AndaraLab ke VPS (76.13.17.91)

## 📋 Pilihan Metode Deployment

### 1️⃣ **GitHub Actions (RECOMMENDED)** - Deploy Otomatis saat Push
Deploy otomatis setiap kali Anda push ke branch `main` atau `master`

**Setup (Sekali Saja):**

1. **Buat GitHub Repository Secrets:**
   - Buka repository Anda di GitHub
   - Go to: **Settings → Secrets and variables → Actions**
   - Tambahkan secrets berikut:

   | Secret Name | Value |
   |-------------|-------|
   | `VPS_HOST` | `76.13.17.91` |
   | `VPS_IP` | `76.13.17.91` |
   | `VPS_USER` | `root` |
   | `VPS_SSH_KEY` | Isi dengan private SSH key Anda |

2. **Cara dapat SSH Private Key:**
   ```bash
   # Di Windows PowerShell
   type $env:USERPROFILE\.ssh\id_ed25519
   # Copy seluruh output dan paste ke secret VPS_SSH_KEY
   ```

3. **File workflow sudah ada di:**
   - `.github/workflows/deploy-vps.yml`

**Cara Pakai:**
```bash
# Cukup push code ke main/master
git add .
git commit -m "Update fitur baru"
git push origin main

# ✅ Otomatis deploy ke VPS!
```

**Keuntungan:**
- ✅ Fully automatic
- ✅ Tidak perlu manual trigger
- ✅ Deployment log tersimpan di GitHub
- ✅ Bisa deploy dari mana saja
- ✅ Support manual trigger dari GitHub Actions tab

---

### 2️⃣ **Script Manual (Windows)** - One-Click Deploy
Deploy manual dengan satu klik untuk Windows

**File:** `auto-deploy-vps.bat`

**Cara Pakai:**
1. Double-click file `auto-deploy-vps.bat`
2. Script akan otomatis:
   - ✅ Push code ke GitHub
   - ✅ Create deployment archive
   - ✅ Upload ke VPS
   - ✅ Build & deploy di VPS
   - ✅ Show status deployment

**Keuntungan:**
- ✅ One-click deployment
- ✅ Interactive & user-friendly
- ✅ Log file otomatis
- ✅ Error handling lengkap

---

### 3️⃣ **Script Manual (Linux/Mac/WSL)** - Bash Deploy
Deploy manual menggunakan bash script

**File:** `auto-deploy-vps.sh`

**Cara Pakai:**
```bash
# Beri permission executable
chmod +x auto-deploy-vps.sh

# Jalankan script
bash auto-deploy-vps.sh
```

**Keuntungan:**
- ✅ Cross-platform (Linux, Mac, WSL)
- ✅ Full control
- ✅ Detailed logging
- ✅ Progress tracking

---

### 4️⃣ **Check Status VPS** - Monitor Deployment
Cek status VPS dan containers

**File:** `check-vps-status.sh`

**Cara Pakai:**
```bash
# Linux/Mac/WSL
chmod +x check-vps-status.sh
bash check-vps-status.sh

# Atau langsung
bash check-vps-status.sh
```

**Akan mengecek:**
- ✅ SSH Connection
- ✅ Docker containers status
- ✅ Service accessibility (Frontend, API, Admin)
- ✅ VPS resources (Disk, Memory, CPU)

---

## 🎯 Workflow Rekomendasi

### Untuk Development Daily:
```bash
# 1. Buat changes
git add .
git commit -m "Fix bug atau tambah fitur"

# 2. Push (otomatis deploy via GitHub Actions)
git push origin main

# 3. Tunggu 10-20 menit
# ✅ Deployed!
```

### Untuk Quick Deploy Manual:
```bash
# Windows
auto-deploy-vps.bat

# Linux/Mac/WSL
bash auto-deploy-vps.sh
```

### Untuk Cek Status:
```bash
bash check-vps-status.sh
```

---

## 📁 Struktur File Deployment

```
UI-Mirror-Clone/
├── .github/
│   └── workflows/
│       └── deploy-vps.yml          # GitHub Actions workflow
├── auto-deploy-vps.sh              # Bash auto deploy script
├── auto-deploy-vps.bat             # Windows auto deploy script
├── check-vps-status.sh             # VPS status monitor
├── deploy-to-vps.sh                # Legacy deploy script
├── deploy-vps-direct.sh            # Direct deploy script
└── scripts/
    ├── vps-deploy.sh               # VPS-side deploy script
    ├── vps-deploy-api.sh           # API deploy script
    └── vps-docker-rebuild.sh       # Docker rebuild script
```

---

## 🔧 Troubleshooting

### Problem: GitHub Actions tidak jalan
**Solusi:**
1. Pastikan file `.github/workflows/deploy-vps.yml` ada
2. Cek Secrets sudah diisi dengan benar
3. Buka tab "Actions" di GitHub, lihat log error

### Problem: SSH Connection Failed
**Solusi:**
```bash
# Test SSH connection
ssh -o StrictHostKeyChecking=no root@76.13.17.91

# Jika gagal, cek:
# 1. SSH key ada di ~/.ssh/
# 2. Public key sudah di VPS
# 3. VPS running dan accessible
```

### Problem: Docker Build Failed di VPS
**Solusi:**
```bash
# SSH ke VPS
ssh root@76.13.17.91

# Cek logs
docker logs andaralab-app-frontend --tail 50
docker logs andaralab-app-backend --tail 50

# Restart manual
cd /root
docker compose restart
```

### Problem: Deploy stuck atau timeout
**Solusi:**
1. Docker build memang butuh 10-20 menit
2. Cek log di GitHub Actions atau log file lokal
3. Jika benar-benar stuck, cancel dan retry

---

## ⚙️ Konfigurasi Advanced

### Custom Branch untuk Auto Deploy
Edit `.github/workflows/deploy-vps.yml`:
```yaml
on:
  push:
    branches: [main, master, production]  # Tambah branch lain
```

### Deploy Manual dari GitHub Actions
1. Buka repository di GitHub
2. Go to **Actions** tab
3. Klik **"Auto Deploy to VPS"**
4. Klik **"Run workflow"**
5. Pilih branch → **Run workflow**

### Exclude Files dari Deployment
Edit bagian `--exclude` di script deploy:
```bash
tar -czf archive.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=YOUR_FOLDER_HERE \
  .
```

---

## 📊 Deployment Time Estimate

| Tahap | Waktu |
|-------|-------|
| Create archive | ~30 detik |
| Upload to VPS | ~1-2 menit |
| Build Frontend | ~5-10 menit |
| Build Backend | ~2-5 menit |
| Start containers | ~30 detik |
| **TOTAL** | **~10-20 menit** |

---

## 🎓 Tips & Best Practices

1. **Commit sering, push ketika siap deploy**
2. **Test lokal dulu sebelum push**
3. **Gunakan GitHub Actions untuk production**
4. **Gunakan manual script untuk development/testing**
5. **Cek status VPS setelah deploy**
6. **Simpan log file untuk troubleshooting**

---

## 📞 Support

Jika ada masalah:
1. Cek log file deployment
2. Lihat GitHub Actions logs
3. Run `check-vps-status.sh`
4. SSH manual ke VPS untuk debug

---

## 🔐 Security Notes

- ✅ SSH keys tidak di-commit ke repository
- ✅ GitHub Secrets encrypted
- ✅ StrictHostKeyChecking disabled untuk automation
- ✅ Archive tidak include sensitive files
- ✅ Deployment logs tersimpan untuk audit

---

**Last Updated:** April 2026  
**VPS IP:** 76.13.17.91  
**Project:** AndaraLab
