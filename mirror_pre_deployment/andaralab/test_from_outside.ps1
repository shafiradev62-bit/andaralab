Write-Host "Testing health endpoint..."
try {
    $health = Invoke-WebRequest -Uri "http://76.13.17.91/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Health: $($health.StatusCode) - $($health.Content)"
} catch {
    Write-Host "✗ Health failed: $_"
}

Write-Host "`nTesting upload endpoint (should return 400 for empty body)..."
try {
    $upload = Invoke-WebRequest -Uri "http://76.13.17.91/api/upload/image" -Method POST -ContentType "application/json" -Body "{}" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Upload: $($upload.StatusCode) - $($upload.Content)"
} catch {
    $err = $_.Exception
    if ($err.Response) {
        $reader = New-Object System.IO.StreamReader($err.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "✓ Upload returned error (expected): $($err.Response.StatusCode) - $responseBody"
    } else {
        Write-Host "✗ Upload failed: $err"
    }
}

Write-Host "`nTesting datasets endpoint..."
try {
    $datasets = Invoke-WebRequest -Uri "http://76.13.17.91/api/datasets" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Datasets: $($datasets.StatusCode)"
} catch {
    Write-Host "✗ Datasets failed: $_"
}
