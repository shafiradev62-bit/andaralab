param([Parameter(Mandatory)][string]$PngPath, [Parameter(Mandatory)][string]$JpgPath, [int]$Quality = 92)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Resolve-Path $PngPath))
$encoders = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
$jpegEnc = $encoders | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
$img.Save($JpgPath, $jpegEnc, $ep)
$img.Dispose()
