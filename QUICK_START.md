# 🚀 Quick Start - Deploy Update Sekarang!

## Step 1: Setup SSH Key (Sekali Aja)

### Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File setup_ssh_key.ps1
```

### Linux/Mac (Bash):
```bash
bash setup_ssh_key.sh
```

### Manual (Kalau Script Gagal):
```bash
# 1. Generate key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_andaralab

# 2. Copy ke VPS (pakai password: 072398?Aarahmi)
ssh-copy-id -i ~/.ssh/id_rsa_andaralab.pub root@177.7.55.182

# 3. Test
ssh -i ~/.ssh/id_rsa_andaralab root@177.7.55.182
```

## Step 2: Deploy Update

```bash
python safe_update_deployment.py
```

**That's it!** Script akan:
- ✅ Backup data dulu
- ✅ Build image baru
- ✅ Test dulu sebelum switch
- ✅ Switch ke version baru (downtime 5-10 detik)
- ✅ Verify production
- ✅ Rollback otomatis kalau gagal

## Timeline

```
00:00 - Connect SSH ✅
00:05 - Check production (55 datasets) ✅
00:10 - Backup data ✅
00:15 - Upload code ✅
00:20 - Build images (5-7 menit) ⏳
07:20 - Test containers ✅
07:45 - Switch (DOWNTIME: 5-10 detik) ⚡
07:55 - Verify (55 datasets masih ada) ✅
08:00 - Cleanup ✅
08:05 - DONE! 🎉
```

**Total:** ~8 menit  
**Downtime:** ~5-10 detik  
**Data Loss Risk:** Zero

## What Gets Updated?

### ✅ Code (Safe):
- Frontend (React/TypeScript)
- Backend (Node.js/Express)
- Docker images
- Dependencies

### ❌ Data (Never Touched):
- 55 datasets
- Activity logs
- CMS content
- Images
- All user input

## Monitoring (Optional)

### Terminal 1: Deploy
```bash
python safe_update_deployment.py
```

### Terminal 2: Watch Website
```bash
# Windows
while ($true) { curl -UseBasicParsing http://andaralab.id/ | Select-Object StatusCode; Start-Sleep 2 }

# Linux/Mac
watch -n 2 'curl -s -o /dev/null -w "Status: %{http_code}\n" http://andaralab.id/'
```

## Rollback (Kalau Perlu)

Script akan **otomatis rollback** kalau gagal. Tapi kalau mau manual:

```bash
# 1. SSH ke VPS
ssh -i ~/.ssh/id_rsa_andaralab root@177.7.55.182

# 2. Restore code lama
cd /root
rm -rf andaralab
mv andaralab_old andaralab

# 3. Restart
cd andaralab
docker compose down
docker compose up -d
```

## Success Indicators

Deployment berhasil kalau:
- ✅ `http://andaralab.id/` → HTTP 200
- ✅ `http://andaralab.id/api/datasets` → HTTP 200
- ✅ Datasets: 55 (atau jumlah yang sama)
- ✅ CMS bisa login
- ✅ Activity log masih ada

## Troubleshooting

### "SSH key not found"
→ Run `setup_ssh_key.ps1` atau `setup_ssh_key.sh`

### "Build failed"
→ Script abort, production tetap jalan, coba lagi

### "Test failed"
→ Script abort, production tetap jalan, check code

### "Production verification failed"
→ Script auto rollback, production tetap jalan

## Ready?

```bash
python safe_update_deployment.py
```

## Need Help?

- Full guide: `SAFE_DEPLOYMENT_GUIDE.md`
- Deployment docs: `DEPLOYMENT.md`
- DNS setup: `hostinger_nameserver_setup.md`
