# Quick deployment script for API Server with data persistence (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Andara API Server - Deploy Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if data volume exists
$volumes = docker volume ls -q
$volumeExists = $volumes -contains "andara-api-data"

if (-not $volumeExists) {
    Write-Host "[WARN] Creating new data volume..." -ForegroundColor Yellow
    docker volume create andara-api-data
    Write-Host "[OK] Volume created: andara-api-data" -ForegroundColor Green
} else {
    Write-Host "[OK] Data volume already exists: andara-api-data" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting API Server..." -ForegroundColor Cyan
Write-Host ""

# Start with docker-compose
docker-compose up -d

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  API Server is running!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the API at: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "View store logs only:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f | Select-String '\[store\]'" -ForegroundColor Gray
Write-Host ""
Write-Host "Backup data:" -ForegroundColor Yellow
Write-Host "  docker cp andara-api-server:/data ./backup" -ForegroundColor Gray
Write-Host ""
Write-Host "Stop server:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Data is persisted in Docker volume 'andara-api-data'" -ForegroundColor Yellow
Write-Host "This volume will survive container restarts and rebuilds." -ForegroundColor Yellow
Write-Host ""

# Show status
Write-Host "Container status:" -ForegroundColor Cyan
docker ps --filter "name=andara-api-server" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
