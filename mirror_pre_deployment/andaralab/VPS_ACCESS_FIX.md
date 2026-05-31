# VPS Access Fix - Dokumentasi

## Masalah yang Ditemukan

VPS **BISA DIAKSES** dengan baik. Masalah yang terjadi adalah:

1. **PowerShell Environment Issue**: Ada interferensi dari PowerShell environment yang menyebabkan output tidak muncul dengan benar
2. **SSH Command Confusion**: Ada command SSH yang ter-trigger secara tidak sengaja di environment
3. **Output Buffering**: Python output tidak muncul real-time karena buffering

## Status VPS

✅ **VPS Status: ONLINE dan ACCESSIBLE**

- Host: `76.13.17.91`
- Port: `22` (SSH)
- User: `root`
- SSH Service: `OpenSSH_9.6p1 Ubuntu-3ubuntu13.15`
- Connection: **BERHASIL**
- Authentication: **BERHASIL**

## Test yang Dilakukan

### 1. Network Test
```bash
ping 76.13.17.91
```
**Result**: ✅ SUCCESS (14-18ms latency)

### 2. Port Test
```python
socket.connect_ex(("76.13.17.91", 22))
```
**Result**: ✅ Port 22 OPEN

### 3. SSH Banner Test
```
SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.15
```
**Result**: ✅ SSH service responding

### 4. Authentication Test
```python
paramiko.connect(host, user, password)
```
**Result**: ✅ Authentication SUCCESSFUL

### 5. Command Execution Test
```bash
echo 'Hello from VPS'
```
**Result**: ✅ Command executed successfully

## Solusi

### File yang Dibuat

1. **`vps_deploy_fixed.py`** - Versi deployment dengan error handling yang lebih baik
   - Tambahan: Network connectivity test
   - Tambahan: Better timeout handling
   - Tambahan: More detailed error messages
   - Tambahan: Robust exception handling

2. **`diagnose_vps.py`** - Tool diagnostik untuk troubleshooting
   - Test network connectivity
   - Test SSH banner
   - Test SSH configuration
   - Test authentication

3. **`test_simple.py`** - Simple connection test
   - Basic socket test
   - Paramiko connection test
   - Quick verification tool

4. **`deploy.bat`** - Windows batch wrapper
   - Proper output handling
   - Unbuffered Python execution
   - Exit code checking

## Cara Menggunakan

### Opsi 1: Menggunakan Batch File (Recommended untuk Windows)
```cmd
deploy.bat
```

### Opsi 2: Langsung dengan Python
```cmd
python vps_deploy_fixed.py
```

### Opsi 3: Test Koneksi Dulu
```cmd
python test_simple.py
```

### Opsi 4: Diagnostik Lengkap
```cmd
python diagnose_vps.py
```

## Troubleshooting

### Jika Masih Gagal

1. **Cek Koneksi Internet**
   ```cmd
   ping 76.13.17.91
   ```

2. **Test SSH Manual**
   ```cmd
   ssh root@76.13.17.91
   ```

3. **Cek Firewall**
   - Windows Firewall
   - Antivirus
   - Network firewall

4. **Cek Python Dependencies**
   ```cmd
   pip install paramiko
   ```

5. **Run Diagnostic Tool**
   ```cmd
   python diagnose_vps.py
   ```

### Error Messages dan Solusi

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Connection timeout` | Firewall blocking | Cek firewall settings |
| `Authentication failed` | Password salah | Verifikasi password di script |
| `Port closed` | SSH service down | Hubungi VPS provider |
| `Network unreachable` | Internet issue | Cek koneksi internet |

## Deployment Process

Script `vps_deploy_fixed.py` melakukan:

1. ✅ Verify deploy contract
2. ✅ Test network connectivity
3. ✅ Create tarball (exclude node_modules)
4. ✅ Connect via SSH
5. ✅ Check Docker installation
6. ✅ Ensure data directory exists
7. ✅ Setup backup automation
8. ✅ Upload code via SFTP
9. ✅ Extract on VPS
10. ✅ Stop old containers
11. ✅ Build Docker images (frontend & backend)
12. ✅ Start containers with docker-compose
13. ✅ Verify deployment

## Data Safety

- Data directory: `/opt/andaralab-data` (permanent, never wiped)
- Backup directory: `/opt/andaralab-backups`
- Backup schedule: Daily at 02:17 AM (server time)
- Retention: 14 days

## Verification

Setelah deployment, cek:

1. **Frontend**: http://76.13.17.91
2. **Admin**: http://76.13.17.91/admin
3. **API**: http://76.13.17.91:3001/api/datasets

## Kesimpulan

**VPS TIDAK BERMASALAH**. Issue yang terjadi adalah masalah environment lokal (PowerShell) yang menyebabkan output deployment tidak terlihat dengan benar. Dengan menggunakan script yang sudah diperbaiki (`vps_deploy_fixed.py` atau `deploy.bat`), deployment akan berjalan dengan normal.

## Contact

Jika masih ada masalah, cek:
- VPS provider dashboard
- Server logs: `ssh root@76.13.17.91 "docker logs backend"`
- Network status
