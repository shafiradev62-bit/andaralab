# Deploy Fix Apr 21 — Nginx + Admin UI error handling
$VPS_HOST = "76.13.17.91"
$VPS_USER = "root"
$REMOTE   = "/root/andaralab"
$BASE = Split-Path -Parent $MyInvocation.MyCommand.Path
$SSH_OPTS = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=30"

Write-Host "=== AndaraLab Fix Deploy ===" -ForegroundColor Cyan
Write-Host "Target: $VPS_USER@$VPS_HOST" -ForegroundColor Cyan

# Step 1: Create dirs
Write-Host "`nStep 1: Preparing remote dirs..." -ForegroundColor Cyan
$cmd = "mkdir -p $REMOTE/artifacts/andaralab/src/pages"
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST '$cmd'"

# Step 2: Upload Dockerfile.frontend
Write-Host "`nStep 2: Uploading Dockerfile.frontend..." -ForegroundColor Cyan
$localFile = Join-Path $BASE "Dockerfile.frontend"
$bytes = [System.IO.File]::ReadAllBytes($localFile)
$b64 = [Convert]::ToBase64String($bytes)
$uploadCmd = "echo $b64 | base64 -d > $REMOTE/Dockerfile.frontend"
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST `"$uploadCmd`""
Write-Host "  [OK] Dockerfile.frontend uploaded" -ForegroundColor Green

# Step 3: Upload AdminPage.tsx
Write-Host "`nStep 3: Uploading AdminPage.tsx..." -ForegroundColor Cyan
$localFile2 = Join-Path $BASE "artifacts\andaralab\src\pages\AdminPage.tsx"
$bytes2 = [System.IO.File]::ReadAllBytes($localFile2)
$b642 = [Convert]::ToBase64String($bytes2)
$uploadCmd2 = "echo $b642 | base64 -d > $REMOTE/artifacts/andaralab/src/pages/AdminPage.tsx"
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST `"$uploadCmd2`""
Write-Host "  [OK] AdminPage.tsx uploaded" -ForegroundColor Green

# Step 4: Rebuild frontend
Write-Host "`nStep 4: Rebuilding frontend (2-3 min)..." -ForegroundColor Cyan
$buildCmd = "cd $REMOTE && docker build --no-cache -f Dockerfile.frontend -t andaralab-frontend . 2>&1 | tail -20"
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST `"$buildCmd`""

# Step 5: Restart frontend
Write-Host "`nStep 5: Restarting frontend container..." -ForegroundColor Cyan
$restartCmd = "cd $REMOTE && docker compose up -d --force-recreate frontend 2>&1"
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST `"$restartCmd`""
Start-Sleep -Seconds 5

# Step 6: Verify
Write-Host "`nStep 6: Verification..." -ForegroundColor Cyan
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST `"docker ps --format '{{.Names}} | {{.Status}}'`""
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST `"curl -s -o /dev/null -w 'Frontend: %{http_code}' http://localhost/`""
Invoke-Expression "ssh $SSH_OPTS $VPS_USER@$VPS_HOST `"curl -s -o /dev/null -w 'API proxy: %{http_code}' http://localhost/api/healthz`""

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "http://76.13.17.91/admin" -ForegroundColor Cyan
