# CARA RESTORE DATA CMS

## Data yang ada di backup ini (13 Mei 2026, 10:59 WIB)

| File | Jumlah | Keterangan |
|------|--------|------------|
| datasets.json | 72 datasets | Semua chart + deskripsi yang sudah diedit client |
| pages.json | 32 halaman | About, Research, semua page |
| posts.json | 18 artikel | Semua blog post |
| ui-texts.json | - | Teks UI |
| analisis.json | - | Data analisis |
| + file lainnya | - | Calendar, exchange rates, dll |

## Cara Restore (kalau ada data hilang)

```bash
# 1. SSH ke VPS
ssh root@177.7.55.182

# 2. Backup dulu yang ada (jaga-jaga)
cp -r /opt/andaralab-data /opt/andaralab-data-before-restore

# 3. Upload file dari folder ini ke VPS
# (jalankan dari local, bukan dari VPS)
# Contoh untuk restore datasets:
scp datasets.json root@177.7.55.182:/opt/andaralab-data/datasets.json

# Atau restore semua sekaligus:
scp *.json root@177.7.55.182:/opt/andaralab-data/

# 4. Restart backend
ssh root@177.7.55.182 "cd /root/andaralab && docker-compose restart backend"
```

## Backup Otomatis di VPS

Selain backup local ini, ada backup otomatis di VPS setiap 6 jam:
- Lokasi: /opt/andaralab-backups/backup-YYYYMMDD-HHMMSS/
- Cek dengan: ssh root@177.7.55.182 "ls /opt/andaralab-backups/"
