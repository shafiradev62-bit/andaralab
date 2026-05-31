# AndaraLab — Integrasi AWS MCP (awslabs/mcp)
## Dokumentasi Presentasi

---

## 1. Apa itu AWS MCP?

- **MCP = Model Context Protocol** — protokol open source dari Anthropic untuk menghubungkan AI dengan tools eksternal
- **awslabs/mcp** = kumpulan MCP server resmi dari AWS Labs (open source, GitHub)
- Memungkinkan AI assistant (Kiro, Cursor, Claude) untuk langsung berinteraksi dengan layanan AWS secara real-time
- Bukan library biasa — ini adalah **jembatan antara AI dan infrastruktur AWS**

---

## 2. Kenapa AndaraLab Butuh Ini?

- AndaraLab sudah berjalan di VPS (76.13.17.91) dengan Docker
- Backend Express + Frontend React sudah live di andaralab.id
- Butuh monitoring Lambda/Cloudflare logs langsung dari admin panel
- Butuh kemampuan query CloudWatch, manage infrastruktur, dan audit trail — semua dari satu tempat

---

## 3. MCP Server yang Diintegrasikan

### Prioritas Utama (sudah diimplementasi):

**Amazon CloudWatch MCP Server**
- Query metrics, alarms, dan logs secara real-time
- Troubleshooting operasional langsung dari admin panel
- Tab "AWS Lambda" di CMS admin sudah terhubung ke endpoint `/api/lambda/logs`

**AWS Lambda Tool MCP Server**
- Execute Lambda functions sebagai AI tools
- Akses ke private resources tanpa expose credentials
- Log ingestion via `POST /api/lambda/ingest`

### Siap Dikonfigurasi:

**AWS Documentation MCP Server**
- Akses dokumentasi AWS terbaru langsung dari IDE
- Tidak perlu buka browser untuk cek API reference

**AWS IAM MCP Server**
- Manage user, role, group, dan policy
- Security best practices otomatis

---

## 4. Arsitektur Integrasi

```
Browser (andaralab.id/admin)
        |
        | HTTP
        v
Nginx (port 80) — Docker Container
        |
        | proxy_pass /api/
        v
Express Backend (port 8080) — Docker Container
        |
        |-- GET  /api/lambda/logs    → Cloudflare API / CloudWatch
        |-- POST /api/lambda/ingest  ← Cloudflare Worker push logs
        |-- DELETE /api/lambda/logs  → Clear log buffer
        |
        v
/opt/andaralab-data (bind mount — data permanent)
```

---

## 5. Cara Kerja Log Pipeline

**Opsi A — Pull (Cloudflare API):**
1. Admin buka tab "AWS Lambda" di CMS
2. Frontend fetch `GET /api/lambda/logs`
3. Backend call Cloudflare API dengan credentials `CF_ACCOUNT_ID` + `CF_API_TOKEN`
4. Return status + logs ke admin panel
5. Auto-refresh setiap 10 detik

**Opsi B — Push (Worker → Backend):**
1. Cloudflare Worker kirim log ke `POST /api/lambda/ingest`
2. Backend simpan di in-memory buffer (max 500 entries)
3. Admin panel baca dari buffer
4. Zero latency, real-time

---

## 6. Environment Variables yang Dibutuhkan

| Variable | Keterangan | Contoh |
|---|---|---|
| `CF_ACCOUNT_ID` | Cloudflare Account ID | `abc123def456` |
| `CF_API_TOKEN` | Cloudflare API Token (read logs) | `Bearer xxx` |
| `CF_WORKER_NAME` | Nama Cloudflare Worker | `andaralab-worker` |
| `CF_LOG_SECRET` | Secret untuk push endpoint | `random-secret-key` |
| `AWS_REGION` | AWS Region | `ap-southeast-1` |
| `AWS_ACCESS_KEY_ID` | AWS credentials | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | `xxx` |

---

## 7. Setup MCP di Kiro IDE (untuk developer)

Tambah ke `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "awslabs.cloudwatch-mcp-server": {
      "command": "uvx",
      "args": ["awslabs.cloudwatch-mcp-server@latest"],
      "env": {
        "AWS_REGION": "ap-southeast-1",
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    },
    "awslabs.lambda-tool-mcp-server": {
      "command": "uvx",
      "args": ["awslabs.lambda-tool-mcp-server@latest"],
      "env": {
        "AWS_REGION": "ap-southeast-1",
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    },
    "awslabs.aws-documentation-mcp-server": {
      "command": "uvx",
      "args": ["awslabs.aws-documentation-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      }
    }
  }
}
```

---

## 8. Fitur Admin Panel — Tab AWS Lambda

Yang sudah live di andaralab.id/admin:

- **4 Status Cards**: Connection, Function Name, Total Invocations, Avg Duration
- **Log Table**: Time, Level (INFO/WARN/ERROR/DEBUG), Message, Duration, Request ID
- **Filter by Level**: All / INFO / WARN / ERROR / DEBUG
- **Auto-refresh**: Toggle ON/OFF, interval 10 detik
- **Manual Refresh**: Tombol refresh manual
- **Setup Guide**: Instruksi konfigurasi environment variables

---

## 9. Langkah Aktivasi (Next Steps)

1. Set environment variables di docker-compose.yml VPS:
   ```
   CF_ACCOUNT_ID=xxx
   CF_API_TOKEN=xxx
   CF_WORKER_NAME=andaralab-worker
   CF_LOG_SECRET=random-secret
   ```

2. Rebuild backend container:
   ```
   docker compose up -d --build backend
   ```

3. (Opsional) Tambah log push ke Cloudflare Worker:
   ```javascript
   // Di Cloudflare Worker
   await fetch('https://andaralab.id/api/lambda/ingest', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-Log-Secret': 'random-secret'
     },
     body: JSON.stringify({
       timestamp: new Date().toISOString(),
       level: 'INFO',
       message: 'Worker invoked',
       requestId: request.headers.get('cf-ray'),
       duration: Date.now() - startTime
     })
   });
   ```

4. Install MCP servers di Kiro IDE (lihat section 7)

---

## 10. Keunggulan Arsitektur Ini

- **Zero downtime** — log buffer in-memory, tidak butuh database tambahan
- **Data permanent** — semua CMS data di bind mount `/opt/andaralab-data`, tidak hilang saat rebuild
- **Dual mode** — bisa pull dari Cloudflare API atau push dari Worker
- **Secure** — push endpoint dilindungi `X-Log-Secret` header
- **Scalable** — buffer max 500 entries, FIFO (oldest dropped)
- **Real-time** — auto-refresh 10 detik, atau push langsung dari Worker

---

*Source: https://github.com/awslabs/mcp | AndaraLab VPS: 76.13.17.91 | Domain: andaralab.id*
