# Deploy aman - andaralab-rules.md
# SSH key: id_ed25519_andaralab_new | fallback: HTTPS via Cloudflare (webhook)

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

if (-not $SSH_KEY) { Write-Error "SSH key tidak ada di ~/.ssh" }

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Andaralab = Join-Path $RepoRoot "artifacts\andaralab"
$ApiSrc = Join-Path $RepoRoot "artifacts\api-server\src"

$DefaultFrontend = @(
    "src\components\AboutSection.tsx", "src\components\DataHub.tsx",
    "src\components\FeaturedInsights.tsx", "src\components\HomeAboutSection.tsx",
    "src\components\LatestInsights.tsx", "src\components\Navbar.tsx",
    "src\components\NewsletterSection.tsx", "src\lib\cms-store.ts", "src\lib\locale.tsx",
    "src\pages\AboutPage.tsx", "src\pages\AdminPage.tsx",
    "src\pages\ContactPage.tsx", "src\pages\SectionPage.tsx"
)
$DefaultBackend = @("routes\pages.ts")

if (-not $FrontendOnly -and -not $BackendOnly) { $FrontendOnly = $true; $BackendOnly = $true }

function Invoke-Ssh([string]$Command) {
    & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $Command 2>$null
    if ($LASTEXITCODE -ne 0) { throw "ssh_failed" }
    return $true
}

function Invoke-ScpFile([string]$Local, [string]$Remote) {
    $parent = ($Remote -replace '/[^/]+$','')
    if ($parent) { Invoke-Ssh "mkdir -p $parent" | Out-Null }
    & scp -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY $Local "${VPS_USER}@${VPS_HOST}:${Remote}"
    if ($LASTEXITCODE -ne 0) { throw "scp_failed" }
}

function Get-DataCounts {
    $py = "python3 -c ""import json,os;b='$DATA_DIR';
for n in 'datasets','posts','pages':
 p=os.path.join(b,n+'.json');
 print(n+'='+str(len(json.load(open(p)))))"""
    $raw = & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $py
    $counts = @{}
    foreach ($line in ($raw -split "`n")) {
        if ($line -match '^(\w+)=(\d+)$') { $counts[$Matches[1]] = [int]$Matches[2] }
    }
    return $counts
}

Write-Host "=== Deploy aman (andaralab-rules) ===" -ForegroundColor Cyan
Write-Host "SSH key: $SSH_KEY"

$useHttps = $false
Write-Host "[preflight] SSH..." -ForegroundColor Yellow
try { Invoke-Ssh "echo OK" | Out-Null } catch { $useHttps = $true }

if ($useHttps) {
    Write-Host "SSH gagal - deploy via Cloudflare HTTPS (sama seperti Zed/CMS webhook)..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "deploy-via-cloudflare.ps1")
    exit $LASTEXITCODE
}

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$DATA_DIR-backup-$ts"

$before = Get-DataCounts
Write-Host "BEFORE: datasets=$($before.datasets) posts=$($before.posts) pages=$($before.pages)"

Invoke-Ssh "cp -r $DATA_DIR $backupPath" | Out-Null
Write-Host "Backup: $backupPath" -ForegroundColor Green

$feFiles = $DefaultFrontend + $ExtraFrontendFiles
if ($FrontendOnly) {
    foreach ($rel in $feFiles) {
        $local = Join-Path $Andaralab $rel
        if (Test-Path $local) {
            $remote = "$REMOTE_ROOT/artifacts/andaralab/$($rel -replace '\\','/')"
            Invoke-ScpFile $local $remote
        }
    }
    Invoke-Ssh "cd $REMOTE_ROOT/artifacts/andaralab; pnpm run build" | Out-Null
    $cmd = "docker cp $REMOTE_ROOT/artifacts/andaralab/dist/public/. ${FRONTEND_CONTAINER}:/usr/share/nginx/html/; docker exec ${FRONTEND_CONTAINER} nginx -s reload"
    Invoke-Ssh $cmd | Out-Null
}

if ($BackendOnly) {
    foreach ($rel in ($DefaultBackend + $ExtraBackendFiles)) {
        $local = Join-Path $ApiSrc $rel
        if (Test-Path $local) {
            Invoke-ScpFile $local "$REMOTE_ROOT/artifacts/api-server/src/$($rel -replace '\\','/')"
        }
    }
    $pm2 = "if pm2 describe api-server >/dev/null 2>&1; then pm2 restart api-server; else cd $REMOTE_ROOT/artifacts/api-server; PORT=3001 NODE_ENV=production DATA_DIR=$DATA_DIR CORS_ALLOW_ALL=true pm2 start --interpreter ./node_modules/.bin/tsx src/index.ts --name api-server; fi"
    Invoke-Ssh $pm2 | Out-Null
}

$after = Get-DataCounts
Write-Host "AFTER: datasets=$($after.datasets) posts=$($after.posts) pages=$($after.pages)"
foreach ($k in @("datasets","posts","pages")) {
    if ($before[$k] -and $after[$k] -lt $before[$k]) {
        Write-Error "ABORT: $k turun. Restore $backupPath"
    }
}
Write-Host "=== Deploy selesai ===" -ForegroundColor Green
