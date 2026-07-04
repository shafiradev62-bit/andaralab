# AndaraLab — Membership & Login (Next Development)

> **Baca file ini di repo** — bukan di platform deploy. Semua kredensial & alur uji coba ada di sini.

## Login cepat (production: https://andaralab.id)

### CMS Admin (kelola konten + member + harga)
| | |
|---|---|
| **URL** | https://andaralab.id/admin |
| **User** | `admin1` |
| **Password** | `AndaraLab@Secure#2026!` |
| **Alt** | `admin2` / `AndaraLab@Secure#2026@` |

Tab **Members** di CMS: lihat user, subscription, payment, edit harga plan.

### Member (Analysis premium — area berbayar)
| | |
|---|---|
| **Daftar** | https://andaralab.id/member/register |
| **Login** | https://andaralab.id/member/login |
| **Bayar** | https://andaralab.id/member/subscribe (setelah login) |
| **Konten** | https://andaralab.id/analysis (butuh subscription aktif) |

**Member pakai email**, bukan username admin. Flow: Register → Bayar → Analysis aktif.

Data registrasi: Nama, Email, Mobile Phone, RDN (Iya/Tidak).

### Harga default (bisa diubah di CMS → Members → Plans)
- **Analysis Access**: Rp **1.000** / 12 bulan (promo uji payment gateway)
- Edit via Admin atau API `PATCH /api/subscriptions/admin/plans/:id`

---

## Payment gateway (Midtrans — real, bukan mock)

Dana masuk rekening **PT Andara — Bank Mandiri** via settlement Midtrans.

### Konfigurasi (`/opt/andaralab-data/membership-config.json`)

```json
{
  "jwtSecret": "ganti-dengan-random-panjang",
  "midtransServerKey": "SB-Mid-server-XXXX",
  "midtransClientKey": "SB-Mid-client-XXXX",
  "midtransIsProduction": false,
  "payoutBank": "Bank Mandiri",
  "payoutAccountName": "PT Andara Lab",
  "payoutAccountNumber": "",
  "enabledPayments": ["mandiri_va", "bca_va", "bni_va", "bri_va", "permata_va", "gopay", "shopeepay", "qris", "credit_card"]
}
```

- **Sandbox** (`midtransIsProduction: false`): keys dari dashboard.midtrans.com → Sandbox
- **Production** (`true`): keys live + webhook `https://andaralab.id/api/subscriptions/webhook/midtrans`
- Metode bayar & rekening **customizable** lewat file di atas (tanpa rebuild)
- Harga plan **customizable** lewat CMS Admin tab Members

### Kartu uji sandbox Midtrans
- Visa: `4811 1111 1111 1114`, CVV `123`, exp `01/28`
- VA Mandiri/BCA: otomatis settlement di sandbox

---

## Backend jangan mati

- Container Docker harus bernama **`backend`** (nginx resolve hostname ini)
- Watchdog: `scripts/watchdog-backend.sh` → deploy ke `/opt/andara-lab/scripts/`
- Cek: `curl http://localhost:3001/api/healthz` → `{"status":"ok"}`
- Log: `tail -20 /var/log/andaralab-watchdog.log`
- **Jangan** `docker compose down` / rebuild image. Deploy: `scripts/deploy-membership-vps.ps1`

---

## Scope membership (brief Hermanto 18 Jun 2026)

1. Menu **Analysis** = member area (+ submenu placeholder Analysis 1, 2, …)
2. Register: Nama, Email, HP, RDN (Iya/Tidak)
3. Membership 1 tahun, bayar (awal Rp 1.000 trial payment)
4. Engine dulu — konten menyusul
5. Midtrans → rekening PT Andara Mandiri
6. Harga di-setup admin CMS

---

## Deploy ke VPS

```powershell
cd UI-Mirror-Clone
powershell -File scripts/deploy-membership-vps.ps1
```

---

## API ringkas

| Endpoint | Keterangan |
|----------|------------|
| `POST /api/member-auth/register` | Daftar member |
| `POST /api/member-auth/login` | Login (email + password) |
| `GET /api/subscriptions/plans` | Plan aktif |
| `GET /api/subscriptions/payment-config` | Midtrans + info rekening |
| `POST /api/subscriptions/create-payment` | Snap token |
| `POST /api/subscriptions/confirm-payment` | Aktivasi setelah bayar |
| `POST /api/subscriptions/webhook/midtrans` | Webhook Midtrans |
| `PATCH /api/subscriptions/admin/plans/:id` | Edit harga (CMS) |

Data: `/opt/andaralab-data/members.json`, `subscription-plans.json`, dll — terpisah dari CMS.

---

## Local dev

Backend: `cd artifacts/api-server && set DATA_DIR=../../data && pnpm run dev`  
Frontend: `cd artifacts/andaralab && pnpm run dev`  
Dev login (localhost): `demo@andaralab.id` / `demo1234`

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| CMS login gagal | Cek backend healthz, hard refresh |
| Member login gagal | Pakai **email** registrasi, bukan `admin1` |
| Payment tidak muncul | Isi Midtrans keys di `membership-config.json` |
| Analysis locked setelah bayar | Cek Members tab CMS atau confirm-payment |
