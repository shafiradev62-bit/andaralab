# Install Docker Desktop - Quick Guide

## 🚀 QUICK INSTALL (5 MENIT)

### Step 1: Download Docker Desktop
**Link:** https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

Atau buka: https://www.docker.com/products/docker-desktop

### Step 2: Install
1. Double-click installer
2. Ikuti wizard (Next, Next, Install)
3. **PENTING:** Centang "Use WSL 2 instead of Hyper-V" (kalau ada)
4. Restart komputer kalau diminta

### Step 3: Start Docker Desktop
1. Buka Docker Desktop dari Start Menu
2. Tunggu sampai status "Docker Desktop is running"
3. Lihat icon Docker di system tray (kanan bawah)

### Step 4: Verify
Buka PowerShell baru:
```powershell
docker --version
```

Kalau muncul versi Docker, berarti sukses!

---

## 🎯 SETELAH DOCKER INSTALLED

Jalankan script ini untuk load images dan run website:

```powershell
# Load Docker images (yang sudah di-download)
docker load -i andaralab-backend.tar.gz
docker load -i andaralab-frontend.tar.gz

# Run localhost
cd localhost_pre_deploy
docker-compose up -d

# Buka browser
start http://localhost:8081
```

**BOOM! Full website dengan data pre-deploy!** 🎉

---

## 🔧 TROUBLESHOOTING

### "WSL 2 installation is incomplete"
1. Buka PowerShell as Administrator
2. Run: `wsl --install`
3. Restart komputer
4. Start Docker Desktop lagi

### "Docker Desktop requires Windows 10/11"
- Minimum: Windows 10 version 1903 (build 18362) atau lebih baru
- Kalau Windows lama, upgrade dulu

### "Virtualization not enabled"
1. Restart komputer
2. Masuk BIOS (tekan F2/Del saat booting)
3. Enable "Intel VT-x" atau "AMD-V"
4. Save & Exit

---

## ⏱️ ESTIMASI WAKTU

- Download Docker Desktop: 2-3 menit
- Install: 2 menit
- Restart (kalau perlu): 1 menit
- Load images: 2 menit
- Start website: 1 menit

**Total: ~10 menit**

---

## 🎯 HASIL AKHIR

Setelah selesai, Anda bisa:
1. **Buka http://localhost:8081** - Full website dengan data pre-deploy
2. **Buka http://andaralab.id** - Production website (current)
3. **Compare side-by-side** - Lihat perbedaan visual!

---

## 💡 ALTERNATIF (KALAU GA MAU INSTALL DOCKER)

Kalau ga mau install Docker, kita bisa:
1. **Deploy ke VPS temporary** - Buat VPS baru, deploy pre-deploy backup
2. **Use production directly** - Langsung restore ke production (ada backup!)

Tapi Docker Desktop paling gampang dan aman untuk testing! 😊
