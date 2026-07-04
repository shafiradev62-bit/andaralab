# Dokumentasi Sistem Membership & Payment Gateway
## AndaraLab

---

## 1. Ringkasan Sistem

Sistem ini menyediakan fitur keanggotaan berbayar dengan integrasi payment gateway Midtrans. Fitur utama meliputi:
- Area anggota untuk akses konten premium (menu Analysis)
- Registrasi anggota online
- Pembayaran dengan berbagai metode via Midtrans
- Pengelolaan anggota dan harga via CMS Admin

---

## 2. Alur Penggunaan

1. Registrasi anggota dengan mengisi nama, email, nomor telepon, dan status RDN
2. Login ke akun anggota
3. Pilih paket langganan dan lakukan pembayaran
4. Setelah pembayaran berhasil, akses ke area Analysis aktif

---

## 3. Data Registrasi Anggota

| Field          | Keterangan                                      |
|----------------|-------------------------------------------------|
| Nama           | Nama lengkap anggota                            |
| Email          | Alamat email valid (digunakan untuk login)        |
| Mobile Phone   | Nomor telepon anggota                          |
| RDN            | Status kepemilikan RDN (Iya/Tidak)             |

---

## 4. Payment Gateway (Midtrans)

Sistem menggunakan Midtrans sebagai payment gateway dengan fitur:
- Dukungan berbagai metode pembayaran: Virtual Account, QRIS, e-Wallet, Kartu Kredit
- Dana masuk ke rekening PT Andara di Bank Mandiri
- Webhook untuk konfirmasi pembayaran otomatis
- Mode Sandbox untuk pengujian dan Mode Production untuk live

---

## 5. Konfigurasi Midtrans

File konfigurasi terletak di: `/opt/andaralab-data/membership-config.json`

Konfigurasi utama:
- `jwtSecret`: Secret key untuk JWT authentication
- `midtransServerKey`: Server Key Midtrans (Sandbox/Production)
- `midtransClientKey`: Client Key Midtrans (Sandbox/Production)
- `midtransIsProduction`: Mode (false = Sandbox, true = Production)
- `payoutBank`: Bank tujuan payout
- `payoutAccountName`: Nama rekening
- `payoutAccountNumber`: Nomor rekening
- `enabledPayments`: Daftar metode pembayaran yang diizinkan

---

## 6. Paket Langganan

Paket langganan dapat dikonfigurasi via CMS Admin pada tab Members → Plans.

Konfigurasi default:
- Nama Paket: Analysis Access
- Harga: Rp 1.000
- Durasi: 12 bulan

---

## 7. Endpoint API

| Endpoint                              | Keterangan                                      |
|---------------------------------------|-------------------------------------------------|
| POST /api/member-auth/register        | Registrasi anggota baru                         |
| POST /api/member-auth/login           | Login anggota                                   |
| GET /api/subscriptions/plans           | Daftar paket langganan aktif                   |
| GET /api/subscriptions/payment-config | Konfigurasi payment gateway                   |
| POST /api/subscriptions/create-payment | Membuat transaksi pembayaran (Snap Token)       |
| POST /api/subscriptions/confirm-payment | Konfirmasi pembayaran manual                    |
| POST /api/subscriptions/webhook/midtrans | Webhook untuk notifikasi Midtrans             |
| PATCH /api/subscriptions/admin/plans/:id | Edit harga paket (CMS Admin)                   |

---

## 8. CMS Admin

URL CMS Admin: https://andaralab.id/admin

Fitur CMS Admin:
- Pengelolaan konten website
- Pengelolaan data anggota
- Pengelolaan paket langganan dan harga
- Monitoring transaksi pembayaran

---

## 9. URL Akses

| Halaman              | URL                                              |
|----------------------|--------------------------------------------------|
| Home                 | https://andaralab.id                               |
| Registrasi Anggota    | https://andaralab.id/member/register                |
| Login Anggota        | https://andaralab.id/member/login                   |
| Pembayaran           | https://andaralab.id/member/subscribe               |
| Area Analysis        | https://andaralab.id/analysis                      |
| CMS Admin            | https://andaralab.id/admin                      |

---

## 10. Troubleshooting

| Masalah                              | Solusi                                          |
|--------------------------------------|-------------------------------------------------|
| Login CMS gagal                       | Periksa health backend dan hard refresh browser    |
| Login anggota gagal                   | Gunakan email registrasi, bukan username admin |
| Payment tidak muncul                 | Periksa konfigurasi Midtrans keys di membership-config.json |
| Analysis terkunci setelah bayar         | Periksa tab Members di CMS atau panggil confirm-payment |

