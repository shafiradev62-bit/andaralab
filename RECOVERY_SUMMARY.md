# Recovery Summary - AndaraLab Production State

**Tanggal Recovery:** 6 Mei 2026  
**Masalah:** Content production hilang/revert setelah deploy tadi malam (5 Mei jam 8-9 malam)

---

## 🔍 TEMUAN

### Timeline
1. **5 Mei, jam 7:52 PM** - Backup terakhir sebelum deploy (`pre-update-20260505-195232.tar.gz`)
2. **5 Mei, jam 8:56 PM** - Deploy dilakukan, Docker containers di-recreate
3. **6 Mei, pagi** - Client melaporkan content hilang/revert

### State Production Sebelum Deploy (5 Mei 7:52 PM)
- **Datasets:** 55 datasets
- **Pages:** 32 pages
- **Posts:** 18 posts
- **Status:** Client masih aktif melakukan edit

### State Production Sekarang (6 Mei)
- **Datasets:** 57 datasets
- **Pages:** 32 pages (tidak berubah)
- **Posts:** 18 posts (tidak berubah)
- **Status:** Beberapa content hilang/revert ke versi lama

### Perubahan yang Terdeteksi

#### 1. Missing Dataset (1 dataset hilang)
- **ID:** `ds-1777376999823-yzmu`
- **Title:** "Number of Saving Accounts by Balance Tier"
- **Created:** 28 April 2026
- **Last Updated:** 5 Mei 2026, 03:42 AM
- **Status:** ❌ HILANG setelah deploy

#### 2. Modified Datasets (28 datasets berubah)
Dataset yang di-edit client sebelum deploy ter-overwrite ke versi lama:
- `ds-1777811895099-d0fj` - Indonesia's Export vs Import Value for Asia & Middle East
- `ds-1777811944341-5nfq` - Indonesia's Export vs Import Value for Europe
- `ds-1777627715257-94ui` - Annual Crude Oil Production in Indonesia
- `ds-1777811856661-sswv` - Indonesia's Export vs Import Value for America
- `ds-1777379326445-k8n3` - Indonesia's External Debt Position by Creditor Group (title berubah)
- ... dan 23 lainnya

**Perubahan utama:**
- Timestamp `updatedAt` berubah (revert ke versi lama)
- Beberapa title/description berubah
- Beberapa data points berubah

#### 3. New Datasets (3 datasets baru - UNEXPECTED)
Dataset yang muncul SETELAH deploy (tidak ada di pre-deploy backup):
- **ID:** `ds-1777989833570-gdpq` - "Annual Crude Oil Daily Production in Indonesia"
  - Created: 5 Mei 2026, 14:03 (setelah deploy)
- **ID:** `ds-1777989852586-k910` - "Annual Natural Gas Daily Production in Indonesia"
  - Created: 5 Mei 2026, 14:04 (setelah deploy)
- **ID:** `ds-1777994708624-2rhx` - "Number of Saving Accounts by Balance Tier"
  - Created: 5 Mei 2026, 15:25 (setelah deploy)
  - **Note:** Ini kemungkinan replacement untuk dataset yang hilang

---

## 🔧 ROOT CAUSE ANALYSIS

### Penyebab Masalah
1. **Deploy process meng-overwrite data production dengan versi lama**
   - Data di `/opt/andaralab-data` ter-overwrite
   - Kemungkinan: rsync/copy dari backup lama atau seed data

2. **Bind mount tidak preserve data dengan benar**
   - Docker containers di-recreate dengan `--force-recreate`
   - Data di bind mount ter-overwrite dari source yang salah

3. **Tidak ada pre-deploy backup otomatis**
   - Backup terakhir dibuat manual sebelum deploy
   - Tidak ada automated backup sebelum setiap deploy

### File yang Ter-overwrite
Berdasarkan timestamp modifikasi di VPS:
- `datasets.json` - Modified: 6 Mei 02:58 (setelah deploy)
- `pages.json` - Modified: 1 Mei 13:38 (**REVERT KE VERSI LAMA!**)
- `posts.json` - Modified: 1 Mei 08:54 (**REVERT KE VERSI LAMA!**)
- `ui-texts.json` - Modified: 1 Mei 13:49 (**REVERT KE VERSI LAMA!**)
- `analisis.json` - Modified: 1 Mei 08:54 (**REVERT KE VERSI LAMA!**)

**Kesimpulan:** Deploy meng-restore data dari backup tanggal **1 Mei**, bukan data production terbaru!

---

## 💾 BACKUP YANG TERSEDIA

### Pre-Deploy Backups (5 Mei)
1. **pre-update-20260505-195232.tar.gz** (28.4 MB)
   - Timestamp: 5 Mei 2026, 19:52 (7:52 PM)
   - **RECOMMENDED:** Backup terakhir sebelum deploy
   - Status: ✅ Downloaded ke `pre_deploy_backup_may5/`

2. **pre-update-20260505-193529.tar.gz** (28.4 MB)
   - Timestamp: 5 Mei 2026, 19:35 (7:35 PM)
   - Status: ✅ Downloaded ke `pre_deploy_backup_may5/`

3. **pre-update-20260505-192612.tar.gz** (28.4 MB)
   - Timestamp: 5 Mei 2026, 19:26 (7:26 PM)
   - Status: ✅ Downloaded ke `pre_deploy_backup_may5/`

### Current Production Backup (6 Mei)
1. **pre-recovery-backup-20260506-092237.tar.gz** (26 MB)
   - Timestamp: 6 Mei 2026, 02:22 (pagi)
   - Status: ✅ Downloaded ke `current_production_backup/`

---

## 🚀 SOLUSI & RECOVERY PLAN

### Option 1: Restore Pre-Deploy State (RECOMMENDED)
**Tujuan:** Mengembalikan production ke state SEBELUM deploy (5 Mei 7:52 PM)

**Steps:**
```bash
# 1. Run restore script
python restore_pre_deploy_content.py
```

**Script akan:**
1. ✅ Backup current state terlebih dahulu
2. ✅ Merge datasets:
   - Restore 1 missing dataset
   - Restore 28 modified datasets ke versi pre-deploy
   - Keep 3 new datasets (created after deploy)
3. ✅ Upload merged dataset ke VPS
4. ✅ Restart backend container
5. ✅ Verify restore

**Hasil:**
- Missing dataset akan muncul kembali
- Modified datasets akan kembali ke versi sebelum deploy
- New datasets tetap ada (tidak dihapus)
- Total: ~58 datasets

### Option 2: Manual Selective Restore
Jika Anda hanya ingin restore dataset tertentu:

```bash
# 1. Lihat detail dataset yang hilang/berubah
python analyze_missing_content.py

# 2. Edit manual datasets.json
# 3. Upload ke VPS
```

### Option 3: Full Restore (Nuclear Option)
Restore SEMUA data ke state pre-deploy:

```bash
# Connect to VPS
ssh root@177.7.55.182

# Stop containers
cd /root/andaralab
docker-compose down

# Restore from backup
cd /opt/andaralab-backups
tar -xzf pre-update-20260505-195232.tar.gz -C /opt/andaralab-data

# Restart containers
cd /root/andaralab
docker-compose up -d
```

**⚠️ WARNING:** Ini akan menghapus 3 new datasets yang dibuat setelah deploy!

---

## 📊 FILES & SCRIPTS

### Analysis Scripts
1. **find_last_production_state.py** - Mencari backup terakhir di VPS
2. **download_pre_deploy_backup.py** - Download backup pre-deploy
3. **compare_pre_deploy_vs_current.py** - Compare state pre-deploy vs current
4. **analyze_missing_content.py** - Analisis detail content yang hilang

### Recovery Scripts
1. **restore_pre_deploy_content.py** - Restore content ke state pre-deploy (RECOMMENDED)

### Generated Files
1. **pre_deploy_comparison_report.json** - Report comparison detail
2. **datasets_merged_restored.json** - Merged dataset untuk restore
3. **RECOVERY_SUMMARY.md** - Dokumentasi ini

### Backup Directories
1. **pre_deploy_backup_may5/** - Backup pre-deploy (5 Mei 7:52 PM)
2. **current_production_backup/** - Backup current state (6 Mei pagi)

---

## ✅ VERIFICATION CHECKLIST

Setelah restore, verify:

- [ ] Missing dataset muncul kembali: "Number of Saving Accounts by Balance Tier"
- [ ] Modified datasets kembali ke versi pre-deploy (check timestamp)
- [ ] New datasets tetap ada (tidak dihapus)
- [ ] Total datasets: ~58 datasets
- [ ] Frontend dapat diakses: http://andaralab.id
- [ ] Backend API berfungsi: http://andaralab.id/api/datasets
- [ ] Admin panel berfungsi: http://andaralab.id/admin

---

## 🛡️ PREVENTION - FUTURE DEPLOYMENTS

### Recommendations
1. **Automated Pre-Deploy Backup**
   - Tambahkan backup otomatis di awal script deploy
   - Simpan dengan timestamp yang jelas

2. **Verify Bind Mount**
   - Pastikan `/opt/andaralab-data` tidak ter-overwrite
   - Check source data sebelum deploy

3. **Deployment Checklist**
   - [ ] Backup current production state
   - [ ] Verify backup integrity
   - [ ] Deploy code only (tidak touch data)
   - [ ] Verify data after deploy
   - [ ] Rollback plan ready

4. **Monitoring**
   - Monitor file modification timestamps
   - Alert jika data ter-overwrite
   - Regular backup verification

---

## 📞 SUPPORT

Jika ada masalah saat restore:
1. Check backup masih ada di `/opt/andaralab-backups/`
2. Check Docker containers running: `docker ps`
3. Check backend logs: `docker logs andaralab-backend-1`
4. Rollback ke backup sebelumnya jika perlu

---

**Status:** ⏳ READY FOR RESTORE  
**Next Action:** Run `python restore_pre_deploy_content.py`
