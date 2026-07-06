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
    "src\components\DatasetPreviewTable.tsx",
    "src\components\FeaturedInsights.tsx", "src\components\HomeAboutSection.tsx",
    "src\components\BlogDocEditor.tsx",
    "src\components\LatestInsights.tsx", "src\components\MarkdownRenderer.tsx",
    "src\components\Navbar.tsx",
    "src\components\NewsletterSection.tsx",
    "src\components\ProtectedRoute.tsx",
    "src\components\MemberAnalysisShell.tsx",
    "src\components\Hero.tsx",
    "src\contexts\MemberAuthContext.tsx",
    "src\lib\admin-auth-gate.tsx", "src\lib\blog-doc-editor.ts", "src\lib\cms-store.ts",
    "src\lib\dataset-search.ts", "src\lib\dev-auth.ts", "src\lib\locale.tsx", "src\lib\nav-order.ts",
    "src\lib\member-storage.ts", "src\lib\post-matching.ts", "src\lib\research-tag-styles.ts",
    "src\pages\AboutPage.tsx", "src\pages\AdminPage.tsx", "src\pages\ArticlePage.tsx",
    "src\pages\ContactPage.tsx", "src\pages\DataHubPage.tsx", "src\pages\DynamicPage.tsx",
    "src\pages\SectionPage.tsx", "src\pages\AnalysisPage.tsx",
    "src\pages\MemberRegisterPage.tsx", "src\pages\MemberLoginPage.tsx",
    "src\pages\MemberSubscribePage.tsx", "src\pages\MemberAnalysisPage.tsx",
    "src\App.tsx"
)
$DefaultBackend = @(
    "routes\pages.ts",
    "routes\blog-posts.ts",
    "routes\index.ts",
    "routes\member-auth.ts",
    "routes\subscriptions.ts",
    "lib\membership-store.ts",
    "lib\membership-config.ts"
)

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

function Get-ActivityLogBytes {
    $raw = & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" "wc -c < $DATA_DIR/activity-log.json 2>/dev/null || echo 0"
    return [int]($raw -replace '\D','')
}

function Ensure-MembershipConfigTemplate {
    $cmd = @"
if [ ! -f $DATA_DIR/membership-config.json ]; then
  printf '%s\n' '{' '  "jwtSecret": "andaralab-member-jwt-2026",' '  "midtransServerKey": "SB-Mid-server-REPLACE_WITH_YOUR_SANDBOX_KEY",' '  "midtransClientKey": "SB-Mid-client-REPLACE_WITH_YOUR_SANDBOX_KEY",' '  "midtransIsProduction": false' '}' > $DATA_DIR/membership-config.json
  echo CREATED_TEMPLATE
else
  echo CONFIG_EXISTS
fi
"@
    $out = & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $cmd
    Write-Host "membership-config.json: $out" -ForegroundColor $(if ($out -match 'CREATED') { 'Yellow' } else { 'Green' })
}

function Get-DataCounts {
    $cmd = "python3 -c 'import json,os; b=`"/opt/andaralab-data`"; print(`"datasets=`"+str(len(json.load(open(os.path.join(b,`"datasets.json`")))))); print(`"posts=`"+str(len(json.load(open(os.path.join(b,`"posts.json`")))))); print(`"pages=`"+str(len(json.load(open(os.path.join(b,`"pages.json`"))))))'"
    $raw = & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $cmd
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
$activityBefore = Get-ActivityLogBytes
Write-Host "BEFORE: datasets=$($before.datasets) posts=$($before.posts) pages=$($before.pages) activity_log_bytes=$activityBefore"

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
    # Clean dist so index.html always references the fresh hashed bundle (stale refs hid Commodity menu)
    Invoke-Ssh "cd $REMOTE_ROOT/artifacts/andaralab; rm -rf dist; pnpm run build" | Out-Null
    $cmd = "docker cp $REMOTE_ROOT/artifacts/andaralab/dist/public/. ${FRONTEND_CONTAINER}:/usr/share/nginx/html/; docker exec ${FRONTEND_CONTAINER} chmod 755 /usr/share/nginx/html/assets; docker exec ${FRONTEND_CONTAINER} nginx -s reload"
    Invoke-Ssh $cmd | Out-Null
    # Verify frontend bundle includes membership routes
    $verify = "docker exec ${FRONTEND_CONTAINER} sh -c 'grep -l member/login /usr/share/nginx/html/assets/index.*.js 2>/dev/null | head -1'"
    try {
        $bundle = & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $verify 2>$null
        if ($bundle) { Write-Host "Frontend bundle OK: membership routes found" -ForegroundColor Green }
        else { Write-Host "WARN: membership routes not found in bundle - hard refresh may be needed" -ForegroundColor Yellow }
    } catch { }
}

if ($BackendOnly) {
    $beFiles = $DefaultBackend + $ExtraBackendFiles
    foreach ($rel in $beFiles) {
        $local = Join-Path $ApiSrc $rel
        if (Test-Path $local) {
            Invoke-ScpFile $local "$REMOTE_ROOT/artifacts/api-server/src/$($rel -replace '\\','/')"
        }
    }
    # Copy all backend source into container /app (host mount is read-only reference; running app uses /app)
    $dockerCp = @()
    foreach ($rel in $beFiles) {
        $hostPath = "$REMOTE_ROOT/artifacts/api-server/src/$($rel -replace '\\','/')"
        $containerPath = "/app/artifacts/api-server/src/$($rel -replace '\\','/')"
        $dockerCp += "docker cp $hostPath backend:$containerPath"
    }
    $beDeploy = ($dockerCp -join "; ") + "; docker exec backend sh -c `"cd /app/artifacts/api-server && node build.mjs`"; docker restart backend"
    Invoke-Ssh $beDeploy | Out-Null
    Start-Sleep -Seconds 10
    Ensure-MembershipConfigTemplate
    $healthCmd = 'curl -s http://localhost:3001/api/healthz; echo; curl -s http://localhost:3001/api/subscriptions/plans | head -c 120'
    $health = & ssh -o ConnectTimeout=45 -o BatchMode=yes -o StrictHostKeyChecking=no -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $healthCmd
    Write-Host "Backend health: $health"
}

$after = Get-DataCounts
$activityAfter = Get-ActivityLogBytes
Write-Host "AFTER: datasets=$($after.datasets) posts=$($after.posts) pages=$($after.pages) activity_log_bytes=$activityAfter"
foreach ($k in @("datasets","posts","pages")) {
    if ($before[$k] -and $after[$k] -lt $before[$k]) {
        Write-Error "ABORT: $k turun. Restore $backupPath"
    }
}
if ($activityBefore -gt 0 -and $activityAfter -lt $activityBefore) {
    Write-Error "ABORT: activity-log.json mengecil ($activityBefore to $activityAfter). Restore $backupPath"
}
Write-Host "=== Deploy selesai ===" -ForegroundColor Green
