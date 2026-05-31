# 🔄 GANTI KE NAMESERVER HOSTINGER

## 📋 LANGKAH LENGKAP:

### 1. Cari Nameserver Hostinger
Login ke **Hostinger hPanel** → **Domain** → cari nameserver, biasanya:
```
ns1.dns-parking.com
ns2.dns-parking.com
```
ATAU
```
ns1.hostinger.com  
ns2.hostinger.com
```

### 2. Update Nameserver di Domain Registrar
- Login ke tempat beli domain (Namecheap/GoDaddy/dll)
- Ganti nameserver dari Cloudflare ke Hostinger
- **WAKTU PROPAGASI: 24-48 JAM** ⚠️

### 3. Setup DNS di Hostinger
Setelah nameserver aktif:
- Login Hostinger hPanel
- **Domain** → **DNS Zone Editor**
- Tambah A record:
```
Type: A
Name: @ 
Value: 177.7.55.182

Type: A
Name: www
Value: 177.7.55.182
```

## ⚠️ KEKURANGAN HOSTINGER:
- 🐌 Propagasi lambat (24-48 jam)
- 🔒 SSL manual setup
- 📊 Analytics terbatas
- 🛡️ Security features basic

## 🤔 REKOMENDASI:
**TETAP PAKAI CLOUDFLARE** karena:
- Lebih cepat (2-5 menit vs 24-48 jam)
- Fitur lebih lengkap
- Gratis dan reliable