Add-Type -AssemblyName System.Drawing

$projectRoot = $PSScriptRoot
$srcPath = Join-Path $projectRoot "public\app-icon.png"

if (-not (Test-Path $srcPath)) {
    Write-Host "Source icon not found at: $srcPath"
    exit
}

$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)

function Resize-Image($img, [int]$width, [int]$height, [string]$destPath) {
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($img, 0, 0, $width, $height)
    $destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destBitmap.Dispose()
    Write-Host "Generated: $destPath ($width x $height)"
}

# 1. Android Mipmaps
$resRoot = Join-Path $projectRoot "android_wrapper\app\src\main\res"
if (Test-Path $resRoot) {
    Resize-Image $srcImg 48 48 "$resRoot\mipmap-mdpi\ic_launcher.png"
    Resize-Image $srcImg 48 48 "$resRoot\mipmap-mdpi\ic_launcher_round.png"
    Resize-Image $srcImg 72 72 "$resRoot\mipmap-hdpi\ic_launcher.png"
    Resize-Image $srcImg 72 72 "$resRoot\mipmap-hdpi\ic_launcher_round.png"
    Resize-Image $srcImg 96 96 "$resRoot\mipmap-xhdpi\ic_launcher.png"
    Resize-Image $srcImg 96 96 "$resRoot\mipmap-xhdpi\ic_launcher_round.png"
    Resize-Image $srcImg 144 144 "$resRoot\mipmap-xxhdpi\ic_launcher.png"
    Resize-Image $srcImg 144 144 "$resRoot\mipmap-xxhdpi\ic_launcher_round.png"
    Resize-Image $srcImg 192 192 "$resRoot\mipmap-xxxhdpi\ic_launcher.png"
    Resize-Image $srcImg 192 192 "$resRoot\mipmap-xxxhdpi\ic_launcher_round.png"
    Resize-Image $srcImg 432 432 "$resRoot\drawable\ic_launcher_foreground.png"
}

# 2. Web App / Laptop icons
$webPublic = Join-Path $projectRoot "public"
Resize-Image $srcImg 512 512 "$webPublic\app-icon.png"
Resize-Image $srcImg 192 192 "$webPublic\icon-192.png"
Resize-Image $srcImg 64 64 "$webPublic\favicon.png"
Resize-Image $srcImg 32 32 "$webPublic\favicon-32x32.png"

$srcImg.Dispose()
Write-Host "All icons successfully generated!"
