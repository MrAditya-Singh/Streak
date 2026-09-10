Add-Type -AssemblyName System.Drawing

$projectRoot = $PSScriptRoot
$pngPath = Join-Path $projectRoot "public\app-icon.png"
$icoPath = Join-Path $projectRoot "public\app_icon.ico"
$electronExe = Join-Path $projectRoot "node_modules\electron\dist\electron.exe"
$mainCjs = Join-Path $projectRoot "electron\main.cjs"

Write-Host ">>> [1/2] Generating High-Resolution Application Icon (.ico)..." -ForegroundColor Cyan
if ((Test-Path $pngPath) -and (-not (Test-Path $icoPath))) {
    try {
        $bmp = [System.Drawing.Bitmap]::FromFile($pngPath)
        $thumb = New-Object System.Drawing.Bitmap($bmp, 256, 256)
        $hIcon = $thumb.GetHicon()
        $icon = [System.Drawing.Icon]::FromHandle($hIcon)
        $fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
        $icon.Save($fs)
        $fs.Close()
        $bmp.Dispose()
        $thumb.Dispose()
        Write-Host "Icon saved at: $icoPath" -ForegroundColor Green
    } catch {
        Write-Host "Warning creating ICO: $_" -ForegroundColor Yellow
    }
}

Write-Host "`n>>> [2/2] Installing EffStreak Desktop Application..." -ForegroundColor Cyan
$WshShell = New-Object -comObject WScript.Shell

# Desktop Shortcut
try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $desktopShortcutPath = Join-Path $desktopPath "EffStreak.lnk"
    $Shortcut = $WshShell.CreateShortcut($desktopShortcutPath)
    $Shortcut.TargetPath = $electronExe
    $Shortcut.Arguments = "`"$mainCjs`""
    $Shortcut.WorkingDirectory = $projectRoot
    if (Test-Path $icoPath) {
        $Shortcut.IconLocation = "$icoPath,0"
    }
    $Shortcut.Description = "EffStreak - Solo Leveling Habit & Streak System"
    $Shortcut.Save()
    Write-Host "Desktop Shortcut: $desktopShortcutPath" -ForegroundColor Green
} catch {
    Write-Host "Desktop shortcut note: $_" -ForegroundColor Yellow
}

# Start Menu Shortcut
try {
    $programsPath = [Environment]::GetFolderPath("Programs")
    $startMenuShortcutPath = Join-Path $programsPath "EffStreak.lnk"
    $Shortcut = $WshShell.CreateShortcut($startMenuShortcutPath)
    $Shortcut.TargetPath = $electronExe
    $Shortcut.Arguments = "`"$mainCjs`""
    $Shortcut.WorkingDirectory = $projectRoot
    if (Test-Path $icoPath) {
        $Shortcut.IconLocation = "$icoPath,0"
    }
    $Shortcut.Description = "EffStreak - Solo Leveling Habit & Streak System"
    $Shortcut.Save()
    Write-Host "Start Menu Shortcut: $startMenuShortcutPath" -ForegroundColor Green
} catch {
    Write-Host "Start menu shortcut note: $_" -ForegroundColor Yellow
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "   EffStreak Desktop Application Installed Successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
