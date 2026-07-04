try {
    $r = Invoke-WebRequest -Uri 'https://andaralab.id/' -UseBasicParsing
    $m = [regex]::Match($r.Content, 'index\.\d+\.js')
    Write-Host ('Live bundle: ' + $m.Value)
} catch {
    Write-Host $_.Exception.Message
}