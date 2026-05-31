# Manual Docker Desktop Installation

## 🚨 INSTALASI MANUAL (PALING GAMPANG)

### Step 1: Buka Installer
1. Buka File Explorer
2. Go to: `C:\Users\shafira\Downloads`
3. **Klik kanan** pada `Docker Desktop Installer.exe`
4. Pilih **"Run as administrator"**

### Step 2: Install
1. Klik **"Yes"** pada UAC prompt
2. Di installer, pastikan **"Use WSL 2 instead of Hyper-V"** DICENTANG
3. Klik **"Ok"** atau **"Install"**
4. Tunggu sampai selesai (~2-3 menit)

### Step 3: Setelah Install
1. Installer akan bilang "Installation succeeded"
2. Klik **"Close and restart"** atau **"Close"**
3. **RESTART KOMPUTER** (penting!)

### Step 4: Setelah Restart
1. Docker Desktop akan start otomatis
2. Tunggu sampai muncul notifikasi: **"Docker Desktop is running"**
3. Lihat icon Docker di system tray (kanan bawah)

### Step 5: Verify
Buka PowerShell dan ketik:
```powershell
docker --version
```

Kalau muncul versi, berarti SUKSES! 🎉

---

## 🎯 SETELAH DOCKER READY

Jalankan:
```powershell
cd C:\Users\shafira\Downloads\UI-Mirror-Clone
.\START_LOCALHOST_WEBSITE.bat
```

Browser akan terbuka dengan **FULL WEBSITE** menggunakan data pre-deploy!

---

## 🐛 TROUBLESHOOTING

### "WSL 2 installation is incomplete"
1. Buka PowerShell **as Administrator**
2. Run: `wsl --install`
3. Restart komputer
4. Buka Docker Desktop lagi

### "Hyper-V is not available"
- Windows 10 Home tidak support Hyper-V
- Harus pakai WSL 2 (pastikan dicentang saat install)

### Docker Desktop tidak start
1. Buka Start Menu
2. Cari "Docker Desktop"
3. Klik kanan → Run as administrator

---

## ⏱️ TOTAL WAKTU

- Install: 3 menit
- Restart: 2 menit
- Docker start: 1 menit
- Load images & run: 2 menit

**Total: ~8 menit** untuk full website running di localhost!

---

Silakan install manual sekarang, saya tunggu! 😊
