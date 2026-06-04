# Deploy aman — HARUS mengikuti .kiro/steering/andaralab-rules.md
# Tidak overwrite CMS: tidak sentuh /opt/andaralab-data kecuali backup salinan.
# Tidak: docker compose build/up, docker compose down -v, rsync --delete, git reset --hard,
#        rebuild image frontend, restart container backend.

param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [string[]]$ExtraFrontendFiles = @(),
    [string[]]$ExtraBackendFiles = @()
)

$ErrorActionPreference = "Stop"

$VPS_HOST = "177.7.55.182"
$VPS_USER = "root"
$REMOTE_ROOT = "/opt/andara-lab"
$DATA_DIR = "/opt/andaralab-data"
$FRONTEND_CONTAINER = "andaralab-frontend-1"

$SSH_KEY = @(
    "$env:USERPROFILE\.ssh\id_ed25519_andaralab_new",
    "$env:USERPROFILE\.ssh\id_ed25519_andaralab",
    "$env:USERPROFILE\.ssh\id_rsa_andaralab"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $SSH_KEY) {
    Write-Error "SSH key tidak ada. Buat id_ed25519_andaralab atau id_rsa_andaralab di ~/.ssh"
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Andaralab = Join-Path $RepoRoot "artifacts\andaralab"
$ApiSrc = Join-Path $RepoRoot "artifacts\api-server\src"

# File yang berubah hari ini (partial — bukan seluruh repo)
$DefaultFrontend = @(
    "src\components\AboutSection.tsx",
    "src\components\DataHub.tsx",
    "src\components\FeaturedInsights.tsx",
    "src\components\HomeAboutSection.tsx",
    "src\components\LatestInsights.tsx",
    "src\components\Navbar.tsx",
    "src\components\NewsletterSection.tsx",
    "src\lib\cms-store.ts",
    "src\lib\locale.tsx",
    "src\pages\AboutPage.tsx",
    "src\pages\AdminPage.tsx",
    "src\pages\ContactPage.tsx",
    "src\pages\SectionPage.tsx"
)
# JANGAN deploy seed-data.ts — hanya dipakai saat reset; bukan untuk update live CMS
$DefaultBackend = @(
    "routes\pages.ts"
)

if (-not $FrontendOnly -and -not $BackendOnly) {
    $FrontendOnly = $true
    $BackendOnly = $true
}

function Invoke-Ssh([string]$Command) {
    & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $Command
    if ($LASTEXITCODE -ne 0) { throw "SSH gagal (exit $LASTEXITCODE): $Command" }
}

function Invoke-ScpFile([string]$Local, [string]$Remote) {
    $parent = ($Remote -replace '/[^/]+$','')
    if ($parent) { Invoke-Ssh "mkdir -p $parent" }
    & scp -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY $Local "${VPS_USER}@${VPS_HOST}:${Remote}"
    if ($LASTEXITCODE -ne 0) { throw "SCP gagal: $Local" }
}

function Get-DataCounts {
    $raw = Invoke-Ssh @"
python3 - <<'PY'
import json, os
base='$DATA_DIR'
for name in ('datasets','posts','pages'):
    p=os.path.join(base, f'{name}.json')
    n=len(json.load(open(p))) if os.path.isfile(p) else -1
    print(f'{name}={n}')
PY
"@
    $counts = @{}
    foreach ($line in ($raw -split "`n")) {
        if ($line -match '^(\w+)=(\d+)$') { $counts[$Matches[1]] = [int]$Matches[2] }
    }
    return $counts
}

Write-Host "=== Deploy aman (andaralab-rules) ===" -ForegroundColor Cyan
Write-Host "SSH key : $SSH_KEY"
Write-Host "Target  : ${VPS_USER}@${VPS_HOST}"
Write-Host "Mode    : Frontend=$FrontendOnly Backend=$BackendOnly"
Write-Host ""
Write-Host "TIDAK akan dijalankan: docker compose, rebuild image, sentuh isi $DATA_DIR" -ForegroundColor DarkGray

# Preflight
Write-Host "[preflight] SSH..." -ForegroundColor Yellow
$useHttps = $false
try { Invoke-Ssh "echo OK" | Out-Null } catch {
    Write-Host "SSH timeout — fallback deploy via Cloudflare HTTPS (webhook)..." -ForegroundColor Yellow
    $useHttps = $true
}

if ($useHttps) {
    & (Join-Path $PSScriptRoot "deploy-via-cloudflare.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "Webhook triggered. Tunggu ~2-5 menit lalu cek https://andaralab.id" -ForegroundColor Green
    exit 0
}

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "${DATA_DIR}-backup-${ts}"

Write-Host "[1] Hitung data SEBELUM deploy..." -ForegroundColor Yellow
$before = Get-DataCounts
$before.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" }

Write-Host "[2] Backup data (salinan saja, bukan overwrite)..." -ForegroundColor Yellow
Invoke-Ssh "cp -r $DATA_DIR $backupPath"
Write-Host "  -> $backupPath" -ForegroundColor Green

# Upload source partial
$feFiles = $DefaultFrontend + $ExtraFrontendFiles
$beFiles = @()
if ($BackendOnly) { $beFiles = $DefaultBackend + $ExtraBackendFiles }

if ($FrontendOnly -and $feFiles.Count -gt 0) {
    Write-Host "[3a] Upload file frontend (partial)..." -ForegroundColor Yellow
    foreach ($rel in $feFiles) {
        $local = Join-Path $Andaralab $rel
        if (-not (Test-Path $local)) { Write-Host "  skip: $rel" -ForegroundColor DarkYellow; continue }
        $remote = "$REMOTE_ROOT/artifacts/andaralab/$($rel -replace '\\','/')"
        Invoke-ScpFile $local $remote
        Write-Host "  ok $rel" -ForegroundColor Green
    }
}

if ($BackendOnly -and $beFiles.Count -gt 0) {
    Write-Host "[3b] Upload file backend (partial)..." -ForegroundColor Yellow
    foreach ($rel in $beFiles) {
        $local = Join-Path $ApiSrc $rel
        if (-not (Test-Path $local)) { Write-Host "  skip: $rel" -ForegroundColor DarkYellow; continue }
        $remote = "$REMOTE_ROOT/artifacts/api-server/src/$($rel -replace '\\','/')"
        Invoke-ScpFile $local $remote
        Write-Host "  ok $rel" -ForegroundColor Green
    }
}

if ($FrontendOnly) {
    Write-Host "[4] Build frontend DI VPS (bukan overwrite folder data)..." -ForegroundColor Yellow
    Invoke-Ssh "cd $REMOTE_ROOT/artifacts/andaralab && pnpm run build"

    Write-Host "[5] docker cp + nginx reload (TANPA restart container)..." -ForegroundColor Yellow
    Invoke-Ssh @"
docker cp $REMOTE_ROOT/artifacts/andaralab/dist/public/. ${FRONTEND_CONTAINER}:/usr/share/nginx/html/ &&
docker exec ${FRONTEND_CONTAINER} nginx -s reload &&
echo NGINX_RELOAD_OK
"@
}

if ($BackendOnly) {
    Write-Host "[6] PM2 restart api-server (bukan docker compose)..." -ForegroundColor Yellow
    Invoke-Ssh @"
if pm2 describe api-server >/dev/null 2>&1; then
  pm2 restart api-server
else
  cd $REMOTE_ROOT/artifacts/api-server &&
  PORT=3001 NODE_ENV=production DATA_DIR=$DATA_DIR CORS_ALLOW_ALL=true \
    pm2 start --interpreter ./node_modules/.bin/tsx src/index.ts --name api-server
fi
"@
    Write-Host "  Catatan: container docker 'backend' tidak di-restart (session/hindari compose)." -ForegroundColor DarkGray
}

Write-Host "[7] Verifikasi data SESUDAH deploy..." -ForegroundColor Yellow
$after = Get-DataCounts
$ok = $true
foreach ($key in @("datasets", "posts", "pages")) {
    $b = $before[$key]; $a = $after[$key]
    Write-Host ('  {0}: {1} -> {2}' -f $key, $b, $a)
    if ($null -ne $b -and $a -lt $b) {
        Write-Host "  ABORT: jumlah ${key} TURUN - restore dari $backupPath" -ForegroundColor Red
        $ok = $false
    }
}
if (-not $ok) {
    throw "Deploy dihentikan: data count turun. Jangan lanjutkan. Restore backup di VPS."
}

Write-Host ""
Write-Host "=== Deploy aman selesai ===" -ForegroundColor Green
Write-Host "Cek https://andaralab.id dan /admin"
Write-Host "Backup: $backupPath"
