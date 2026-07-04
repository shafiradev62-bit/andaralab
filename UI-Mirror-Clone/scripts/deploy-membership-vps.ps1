# Deploy membership engine only — minimal file set, data-safe
$ErrorActionPreference = "Stop"
$VPS = "root@177.7.55.182"
$KEY = "$env:USERPROFILE\.ssh\id_ed25519_andaralab_new"
$ROOT = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$FE = Join-Path $ROOT "artifacts\andaralab"
$BE = Join-Path $ROOT "artifacts\api-server\src"
$RemoteRoot = "/opt/andara-lab"
$DataDir = "/opt/andaralab-data"

function Invoke-VpsSsh([string]$cmd) {
    & ssh -o ConnectTimeout=60 -o BatchMode=yes -o StrictHostKeyChecking=no -i $KEY $VPS $cmd
    if ($LASTEXITCODE -ne 0) { throw "ssh failed: $cmd" }
}
function Invoke-VpsScp([string]$local, [string]$destPath) {
    $parent = ($destPath -replace '/[^/]+$','')
    if ($parent) { Invoke-VpsSsh "mkdir -p $parent" | Out-Null }
    & scp -o ConnectTimeout=60 -o BatchMode=yes -o StrictHostKeyChecking=no -i $KEY $local "${VPS}:${destPath}"
    if ($LASTEXITCODE -ne 0) { throw "scp failed: $local -> $destPath" }
}

function Get-VpsDataCounts {
    $py = @'
import json, os
b = "/opt/andaralab-data"
d = len(json.load(open(os.path.join(b, "datasets.json"))))
p = len(json.load(open(os.path.join(b, "posts.json"))))
g = len(json.load(open(os.path.join(b, "pages.json"))))
print(f"{d} {p} {g}")
'@
    $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($py))
    return (Invoke-VpsSsh "echo $b64 | base64 -d | python3").Trim()
}

Write-Host "=== Membership deploy (minimal, data-safe) ===" -ForegroundColor Cyan

$countsBefore = Get-VpsDataCounts
$actBefore = (Invoke-VpsSsh "wc -c < $DataDir/activity-log.json").Trim()
Write-Host "BEFORE counts (datasets posts pages): $countsBefore | activity bytes: $actBefore"

$feFiles = @(
    "src\App.tsx", "src\components\Navbar.tsx", "src\components\Hero.tsx",
    "src\components\ProtectedRoute.tsx", "src\components\MemberAnalysisShell.tsx",
    "src\contexts\MemberAuthContext.tsx",
    "src\lib\member-storage.ts", "src\lib\dev-auth.ts",
    "src\pages\AnalysisPage.tsx", "src\pages\AdminPage.tsx",
    "src\pages\MemberRegisterPage.tsx", "src\pages\MemberLoginPage.tsx",
    "src\pages\MemberSubscribePage.tsx", "src\pages\MemberAnalysisPage.tsx"
)
foreach ($f in $feFiles) {
    $local = Join-Path $FE $f
    $dest = "$RemoteRoot/artifacts/andaralab/$($f -replace '\\','/')"
    Write-Host "  FE: $f"
    Invoke-VpsScp $local $dest
}

$beFiles = @(
    "routes\index.ts", "routes\member-auth.ts", "routes\subscriptions.ts",
    "lib\membership-store.ts", "lib\membership-config.ts"
)
foreach ($f in $beFiles) {
    $local = Join-Path $BE $f
    $dest = "$RemoteRoot/artifacts/api-server/src/$($f -replace '\\','/')"
    Write-Host "  BE: $f"
    Invoke-VpsScp $local $dest
}

Write-Host "Building frontend on VPS..." -ForegroundColor Yellow
Invoke-VpsSsh "cd $RemoteRoot/artifacts/andaralab && rm -rf dist && pnpm run build"
Invoke-VpsSsh "docker cp $RemoteRoot/artifacts/andaralab/dist/public/. andaralab-frontend-1:/usr/share/nginx/html/ && docker exec andaralab-frontend-1 chmod 755 /usr/share/nginx/html/assets && docker exec andaralab-frontend-1 nginx -s reload"

Write-Host "Building + restarting backend..." -ForegroundColor Yellow
$distLocal = Join-Path $ROOT "artifacts\api-server\dist\index.mjs"
if (-not (Test-Path $distLocal)) {
    Push-Location (Join-Path $ROOT "artifacts\api-server")
    node build.mjs
    Pop-Location
}
$cp = ($beFiles | ForEach-Object {
    $r = "$RemoteRoot/artifacts/api-server/src/$($_ -replace '\\','/')"
    "docker cp $r backend:/app/artifacts/api-server/src/$($_ -replace '\\','/')"
}) -join "; "
Invoke-VpsScp $distLocal "/tmp/index.mjs"
Invoke-VpsSsh "$cp; docker cp /tmp/index.mjs backend:/app/artifacts/api-server/dist/index.mjs; docker restart backend"
Invoke-VpsScp (Join-Path $ROOT "scripts\watchdog-backend.sh") "$RemoteRoot/scripts/watchdog-backend.sh"
Invoke-VpsSsh "chmod +x $RemoteRoot/scripts/watchdog-backend.sh; cp $RemoteRoot/scripts/watchdog-backend.sh /opt/andara-lab/scripts/watchdog-backend.sh 2>/dev/null || mkdir -p /opt/andara-lab/scripts && cp $RemoteRoot/scripts/watchdog-backend.sh /opt/andara-lab/scripts/watchdog-backend.sh; docker network connect andaralab_andaralab-network andaralab-frontend-1 2>/dev/null || true; docker exec andaralab-frontend-1 nginx -s reload 2>/dev/null || true"
Start-Sleep -Seconds 12

Invoke-VpsSsh "test -f $DataDir/membership-config.json || printf '%s\n' '{`"jwtSecret`":`"andaralab-member-jwt-2026`",`"midtransServerKey`":`"SB-Mid-server-REPLACE`",`"midtransClientKey`":`"SB-Mid-client-REPLACE`",`"midtransIsProduction`":false,`"payoutBank`":`"Bank Mandiri`",`"payoutAccountName`":`"PT Andara Lab`"}' > $DataDir/membership-config.json"

$countsAfter = Get-VpsDataCounts
$actAfter = (Invoke-VpsSsh "wc -c < $DataDir/activity-log.json").Trim()
Write-Host "AFTER counts: $countsAfter | activity bytes: $actAfter" -ForegroundColor Green
if ($countsBefore -ne $countsAfter) { throw "DATA COUNT MISMATCH - check backup" }
if ([int]$actAfter -lt [int]$actBefore) { throw "ACTIVITY LOG SHRANK - check backup" }

$verify = Invoke-VpsSsh "curl -s http://localhost:3001/api/healthz; echo; curl -s http://localhost:3001/api/subscriptions/plans | head -c 200; echo; docker exec andaralab-frontend-1 sh -c 'grep -c member/login /usr/share/nginx/html/assets/index.*.js | grep -v :0 | head -1'"
Write-Host "VERIFY:`n$verify"
Write-Host "=== Membership deploy selesai ===" -ForegroundColor Green
