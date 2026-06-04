# Deploy lewat HTTPS (Cloudflare) — bypass SSH port 22
# Sama pola CMS deployToVPS / webhook production

param(
    [string]$Secret = $env:DEPLOY_WEBHOOK_SECRET,
    [string]$BaseUrl = "https://andaralab.id/api"
)

$ErrorActionPreference = "Stop"

if (-not $Secret) {
    $Secret = "andara-secret-key"
}

Write-Host "=== Deploy via Cloudflare (HTTPS) ===" -ForegroundColor Cyan
Write-Host "POST $BaseUrl/webhook/deploy"

$uri = "$BaseUrl/webhook/deploy?secret=$([uri]::EscapeDataString($Secret))"
try {
    $res = Invoke-RestMethod -Method POST -Uri $uri -Headers @{ "User-Agent" = "AndaraLab-Deploy/1.0" } -TimeoutSec 120
    $res | ConvertTo-Json -Depth 5
    Write-Host "`nDeploy trigger OK" -ForegroundColor Green
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $code" -ForegroundColor Red
    if ($code -eq 503) {
        Write-Host "Webhook belum dikonfigurasi di server (DEPLOY_WEBHOOK_SECRET kosong)." -ForegroundColor Yellow
        Write-Host "Sekali setup di VPS (Web Console):"
        Write-Host '  export DEPLOY_WEBHOOK_SECRET=andara-secret-key'
        Write-Host '  pm2 restart api-server --update-env'
        Write-Host "Atau di container backend: set env + restart."
    }
    throw
}
