# Deploy patch to VPS via SSH
# Uploads only the changed files (s3-sync, store, index, routes/s3, routes/index, docker-compose)

param(
    [string]$VPS_HOST = "76.13.17.91",
    [string]$VPS_USER = "root",
    [string]$VPS_PASS = "iglzlyy2Cs4',V0i",
    [string]$REMOTE   = "/root/andaralab"
)

$ErrorActionPreference = "Stop"

# Files to upload: [local_path, remote_path]
$FILES = @(
    @("artifacts\api-server\src\lib\s3-sync.ts",           "$REMOTE/artifacts/api-server/src/lib/s3-sync.ts"),
    @("artifacts\api-server\src\lib\store.ts",             "$REMOTE/artifacts/api-server/src/lib/store.ts"),
    @("artifacts\api-server\src\index.ts",                 "$REMOTE/artifacts/api-server/src/index.ts"),
    @("artifacts\api-server\src\middlewares\activity-logger.ts", "$REMOTE/artifacts/api-server/src/middlewares/activity-logger.ts"),
    @("artifacts\api-server\src\routes\s3.ts",             "$REMOTE/artifacts/api-server/src/routes/s3.ts"),
    @("artifacts\api-server\src\routes\index.ts",          "$REMOTE/artifacts/api-server/src/routes/index.ts"),
    @("artifacts\api-server\src\routes\activity.ts",       "$REMOTE/artifacts/api-server/src/routes/activity.ts"),
    @("docker-compose.yml",                                "$REMOTE/docker-compose.yml")
)

$BASE = "UI-Mirror-Clone\UI-Mirror-Clone"

Write-Host "=== AndaraLab Patch Deploy ===" -ForegroundColor Cyan
Write-Host "Target: $VPS_USER@$VPS_HOST:$REMOTE" -ForegroundColor Cyan
Write-Host ""

# Build SSH command string to create all dirs and write all files
$cmds = @()
$cmds += "mkdir -p $REMOTE/artifacts/api-server/src/lib"
$cmds += "mkdir -p $REMOTE/artifacts/api-server/src/middlewares"
$cmds += "mkdir -p $REMOTE/artifacts/api-server/src/routes"

foreach ($pair in $FILES) {
    $localRel  = $pair[0]
    $remotePath = $pair[1]
    $localFull = Join-Path $BASE $localRel

    if (-not (Test-Path $localFull)) {
        Write-Host "  SKIP (not found): $localRel" -ForegroundColor Yellow
        continue
    }

    # Read file and base64 encode
    $bytes   = [System.IO.File]::ReadAllBytes((Resolve-Path $localFull))
    $b64     = [Convert]::ToBase64String($bytes)

    # Write via: echo <b64> | base64 -d > <remote_path>
    $cmds += "echo '$b64' | base64 -d > $remotePath"
    Write-Host "  Queued: $localRel" -ForegroundColor Green
}

# Rebuild backend
$cmds += "echo '--- REBUILDING BACKEND ---'"
$cmds += "cd $REMOTE && docker compose build --no-cache backend 2>&1 | tail -20"
$cmds += "docker compose up -d --force-recreate backend 2>&1"
$cmds += "sleep 5"
$cmds += "docker ps --format '{{.Names}} {{.Status}}'"
$cmds += "curl -s -o /dev/null -w 'API HTTP: %{http_code}' http://localhost:3001/api/datasets"

$fullCmd = $cmds -join " && "

Write-Host ""
Write-Host "Connecting to VPS..." -ForegroundColor Yellow

# Use ssh with sshpass-style via stdin password
# Since we can't use sshpass on Windows, use ssh with -o options and pipe
$sshArgs = @(
    "-o", "StrictHostKeyChecking=no",
    "-o", "UserKnownHostsFile=/dev/null",
    "-o", "ConnectTimeout=30",
    "$VPS_USER@$VPS_HOST",
    $fullCmd
)

Write-Host "Running SSH deploy..." -ForegroundColor Yellow
$env:SSH_ASKPASS = ""

# Write password to temp file for SSH_ASKPASS workaround
# Actually use plink if available, otherwise try native ssh with expect
$result = & ssh @sshArgs 2>&1
Write-Host $result

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Cyan
