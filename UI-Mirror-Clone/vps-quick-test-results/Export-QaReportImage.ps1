# Builds a tall JPG listing all datasets from API QA (no Playwright).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$csv = Join-Path $root "DATASET-QA.csv"
if (-not (Test-Path $csv)) {
  throw "Missing DATASET-QA.csv in $root"
}

$rows = Import-Csv $csv
$lines = New-Object System.Collections.Generic.List[string]
[void]$lines.Add("AndaraLab VPS quick QA | site http://76.13.17.91/ | API http://76.13.17.91:3001/api/datasets")
[void]$lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
[void]$lines.Add("")
foreach ($r in $rows) {
  $u = if ([string]::IsNullOrWhiteSpace($r.unit)) { "(empty unit)" } else { $r.unit }
  $clip = if ($r.badYMaxClipsData -eq "True" -or $r.badYMinClipsData -eq "True") { " Y-CLIP" } else { "" }
  $line = '{0} | {1} | unit={2} | type={3} | rows={4} | ymin={5} ymax={6} | data[{7}..{8}]{9}' -f `
    $r.id, $r.title, $u, $r.unitType, $r.rows, $r.yAxisMin, $r.yAxisMax, $r.dataMin, $r.dataMax, $clip
  [void]$lines.Add($line)
}

$font = [System.Drawing.Font]::new("Segoe UI", [single]10.0)
$brush = [System.Drawing.Brushes]::Black
$padX = 16
$lineH = [int][Math]::Ceiling($font.GetHeight()) + 2
$width = 1680
$height = [Math]::Min(20000, 120 + $lines.Count * $lineH + 80)

$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(255, 252, 252, 252))
$y = 24.0
foreach ($line in $lines) {
  $g.DrawString($line, $font, $brush, [float]$padX, $y)
  $y += $lineH
}

$jpg = Join-Path $root "05-all-datasets-api-qa.jpg"
$encoders = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
$jpegEnc = $encoders | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)
$bmp.Save($jpg, $jpegEnc, $ep)
$g.Dispose()
$bmp.Dispose()
Write-Host "Wrote $jpg"
