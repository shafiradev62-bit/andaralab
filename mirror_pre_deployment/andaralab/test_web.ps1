$response = Invoke-WebRequest -Uri "http://76.13.17.91/api/health" -UseBasicParsing -TimeoutSec 5
Write-Host "Status: $($response.StatusCode)"
Write-Host "Content: $($response.Content)"
