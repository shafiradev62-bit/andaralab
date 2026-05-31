# Setup SMTP untuk OTP Email

OTP sekarang dikirim dari backend via Nodemailer. Kalau SMTP tidak dikonfigurasi, OTP dikembalikan di response JSON (dev mode).

## Konfigurasi Gmail SMTP

1. Buat **App Password** di Google Account:
   - Buka https://myaccount.google.com/apppasswords
   - Pilih "Mail" dan "Other (Custom name)"
   - Copy password yang dihasilkan

2. Tambahkan env variables di `docker-compose.yml`:

```yaml
backend:
  environment:
    - SMTP_USER=your-email@gmail.com
    - SMTP_PASS=your-app-password-here
    - SMTP_HOST=smtp.gmail.com
    - SMTP_PORT=587
```

3. Rebuild backend:

```bash
docker compose up -d --build backend
```

## Test

```bash
curl -X POST http://76.13.17.91/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Kalau SMTP dikonfigurasi, response:
```json
{"ok":true,"message":"OTP dikirim ke email."}
```

Kalau SMTP tidak dikonfigurasi (dev mode), response:
```json
{"ok":true,"message":"SMTP tidak dikonfigurasi. OTP tersedia di field dev_otp.","dev_otp":"123456"}
```

## Alternatif SMTP Provider

- **SendGrid**: `smtp.sendgrid.net:587` (API key sebagai password)
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.us-east-1.amazonaws.com:587`

Semua butuh credentials yang sama: `SMTP_USER` dan `SMTP_PASS`.
