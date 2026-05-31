# CARA JALANKAN LOCALHOST DENGAN PRODUCTION API

## RINGKASAN
Frontend akan jalan di localhost, tapi data diambil dari **LIVE PRODUCTION** (http://andaralab.id)

Jadi kamu bisa lihat **SEMUA 57 DATASETS** yang ada di production sekarang, tanpa perlu deploy apapun.

---

## CARA JALANKAN

### Metode 1: Pakai Batch File (PALING MUDAH)
1. Double-click file: **`RUN_LOCALHOST_WITH_PRODUCTION_API.bat`**
2. Tunggu sampai muncul "Local: http://localhost:5173"
3. Buka browser: **http://localhost:5173**
4. Selesai! Kamu akan lihat website dengan data production LIVE

### Metode 2: Manual
```bash
cd UI-Mirror-Clone/artifacts/andaralab
npm run dev
```

Lalu buka: **http://localhost:5173**

---

## APA YANG AKAN KAMU LIHAT?

✅ **57 datasets** dari production (termasuk 23 datasets yang client update tanggal 6 Mei jam 1-2 pagi)
✅ **Semua pages** (About, Research, dll)
✅ **Semua posts** (blog/artikel)
✅ **Semua UI texts** (teks-teks di website)
✅ **Semua images** dari production

**PENTING**: Ini adalah data LIVE dari production. Setiap perubahan yang client buat di CMS akan langsung keliatan di localhost kamu (refresh aja browsernya).

---

## KENAPA INI AMAN?

1. **Localhost hanya READ data** - tidak bisa edit/hapus data production
2. **Tidak ada deploy** - tidak ada perubahan ke server production
3. **Hanya untuk VERIFIKASI** - kamu bisa lihat apakah semua data muncul dengan benar

---

## TROUBLESHOOTING

### Port 5173 sudah dipakai?
Vite akan otomatis pakai port lain (5174, 5175, dst). Lihat di terminal port berapa yang dipakai.

### Error "Cannot connect to API"?
- Pastikan internet nyala (karena ambil data dari andaralab.id)
- Cek apakah http://andaralab.id/api/datasets bisa dibuka di browser

### Datasets tidak muncul?
- Buka browser console (F12) dan lihat error apa
- Pastikan production API masih jalan: http://andaralab.id/api/health

---

## SETELAH VERIFIKASI

Kalau kamu sudah lihat di localhost dan **SEMUA DATA MUNCUL DENGAN BENAR**, artinya:

✅ **PRODUCTION SUDAH BENAR** - tidak perlu restore apapun
✅ **57 datasets sudah lengkap** - termasuk update client terbaru
✅ **Tidak ada data yang hilang** - semua aman

**TIDAK PERLU DEPLOY LAGI** - production sudah dalam kondisi yang benar!

---

## TECHNICAL DETAILS

- **Frontend**: Vite dev server (React)
- **API Proxy**: Vite proxy `/api` → `https://andaralab.id`
- **Port**: 5173 (default)
- **Config**: `vite.config.ts` sudah setup proxy otomatis
- **Data Source**: LIVE production API (bukan backup, bukan local)

---

## CATATAN PENTING

⚠️ **JANGAN PAKAI BACKUP LAMA** - Production sekarang sudah benar (57 datasets)
⚠️ **JANGAN RESTORE** - Tidak ada data yang hilang
⚠️ **INI HANYA UNTUK VERIFIKASI** - Lihat dulu, baru putuskan

Client kamu update 23 datasets setelah deploy (May 6, 1-2 AM). Semua update itu **SUDAH ADA** di production sekarang.
