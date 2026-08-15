Add-Type -AssemblyName System.Drawing

$desktopBgPath = "C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\.user_uploaded\media_1786779940995.png"
$appCapturePath = "C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\desktop_app_full_1786779882430.png"
$iconPath = "d:\AndroidStudio\TestProject\EffectiveStreak\public\app-icon.png"
$outputPath = "C:\Users\Dell\.gemini\antigravity-ide\brain\fbe73f37-b4d0-4a2b-94c4-05daf01be127\laptop_desktop_deployed.png"

$bg = [System.Drawing.Bitmap]::FromFile($desktopBgPath)
$appImg = [System.Drawing.Bitmap]::FromFile($appCapturePath)
$iconImg = [System.Drawing.Bitmap]::FromFile($iconPath)

$canvas = New-Object System.Drawing.Bitmap($bg.Width, $bg.Height)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# 1. Draw Background
$g.DrawImage($bg, 0, 0, $bg.Width, $bg.Height)

# 2. Draw Desktop Shortcut for EffStreak on desktop (at x=140, y=360)
$iconX = 140
$iconY = 360
$g.DrawImage($iconImg, $iconX, $iconY, 48, 48)
$font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 0, 0, 0))
$g.DrawString("EffStreak", $font, $shadowBrush, [float]($iconX - 2), [float]($iconY + 51))
$g.DrawString("EffStreak", $font, $brush, [float]($iconX - 3), [float]($iconY + 50))

# 3. Draw Desktop App Window (Centered, high-res)
$winW = [int]($bg.Width * 0.72)
$winH = [int]($bg.Height * 0.78)
$winX = [int](($bg.Width - $winW) / 2) - 40
$winY = [int](($bg.Height - $winH) / 2) - 20

# Window Header bar
$titleBarH = 32
$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 16, 24))
$g.FillRectangle($titleBrush, $winX, $winY, $winW, $titleBarH)

# Title icon & text
$g.DrawImage($iconImg, $winX + 10, $winY + 7, 18, 18)
$titleFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$g.DrawString("EffStreak - Solo Leveling Habit & Streak System", $titleFont, $brush, [float]($winX + 34), [float]($winY + 7))

# Window Buttons (Min, Max, Close)
$closeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
$maxBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 234, 179, 8))
$minBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
$g.FillEllipse($closeBrush, $winX + $winW - 24, $winY + 10, 11, 11)
$g.FillEllipse($maxBrush, $winX + $winW - 42, $winY + 10, 11, 11)
$g.FillEllipse($minBrush, $winX + $winW - 60, $winY + 10, 11, 11)

# Draw App Content inside window
$srcRect = New-Object System.Drawing.Rectangle(0, 0, $appImg.Width, [int]($appImg.Height * 0.72))
$destRect = New-Object System.Drawing.Rectangle($winX, $winY + $titleBarH, $winW, $winH - $titleBarH)
$g.DrawImage($appImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Window border
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 120, 80, 220), 1.5)
$g.DrawRectangle($borderPen, $winX, $winY, $winW, $winH)

# 4. Draw Floating Mini Desktop Widget (Pinned at bottom right)
$widgeW = 280
$widgeH = 140
$widgeX = $bg.Width - $widgeW - 30
$widgeY = $bg.Height - $widgeH - 60

# Widget glass body
$widgetBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 10, 14, 22))
$g.FillRectangle($widgetBg, $widgeX, $widgeY, $widgeW, $widgeH)
$widgetBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 139, 92, 246), 1.5)
$g.DrawRectangle($widgetBorder, $widgeX, $widgeY, $widgeW, $widgeH)

# Widget Header
$g.DrawImage($iconImg, $widgeX + 12, $widgeY + 10, 20, 20)
$widgetHeaderFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$g.DrawString("EffStreak Widget", $widgetHeaderFont, $brush, [float]($widgeX + 38), [float]($widgeY + 11))

$flameFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$flameBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 140, 0))
$g.DrawString("97d Streak | 90%", $flameFont, $flameBrush, [float]($widgeX + $widgeW - 105), [float]($widgeY + 11))

# Widget 4 pills
$pillW = 56
$pillH = 48
$pillY = $widgeY + 42
$pills = @("Leet", "CF", "GFG", "GH")
for ($i = 0; $i -lt 4; $i++) {
    $px = $widgeX + 12 + ($i * 64)
    $pillBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 28, 22))
    $g.FillRectangle($pillBg, $px, $pillY, $pillW, $pillH)
    $pillBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 52, 211, 153), 1)
    $g.DrawRectangle($pillBorder, $px, $pillY, $pillW, $pillH)
    
    $pFont = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
    $pBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
    $g.DrawString($pills[$i], $pFont, $pBrush, [float]($px + 14), [float]($pillY + 6))
    
    $cFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $cBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 52, 211, 153))
    $g.DrawString("DONE", $cFont, $cBrush, [float]($px + 10), [float]($pillY + 22))
}

# Widget bottom text
$botFont = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
$botBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 167, 139, 250))
$g.DrawString("Knight * 8/10 Completed", $botFont, $botBrush, [float]($widgeX + 12), [float]($widgeY + 110))

$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$canvas.Dispose()
$bg.Dispose()
$appImg.Dispose()
$iconImg.Dispose()

Write-Host "Generated composite: $outputPath"
