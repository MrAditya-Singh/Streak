Add-Type -AssemblyName System.Drawing

$projectRoot = "d:\AndroidStudio\TestProject\EffectiveStreak"
$pngPath = "$projectRoot\public\app-icon.png"
$icoPath = "$projectRoot\public\app_icon.ico"
$electronExe = "$projectRoot\node_modules\electron\dist\electron.exe"
$mainCjs = "$projectRoot\electron\main.cjs"

Write-Host ">>> [1/2] Generating High-Resolution Application Icon (.ico)..." -ForegroundColor Cyan
if (Test-Path $pngPath) {
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
    $Shortcut.Description = "EffStreak - Solo Leveling Habit and Streak System (Desktop App)"
    $Shortcut.Save()
    Write-Host "Desktop Shortcut created: $desktopShortcutPath" -ForegroundColor Green
} catch {
    Write-Host "Error creating desktop shortcut: $_" -ForegroundColor Red
}

# Start Menu Shortcut
try {
    $programsPath = [Environment]::GetFolderPath("Programs")
    $startMenuShortcutPath = Join-Path $programsPath "EffStreak.lnk"
    $ShortcutSm = $WshShell.CreateShortcut($startMenuShortcutPath)
    $ShortcutSm.TargetPath = $electronExe
    $ShortcutSm.Arguments = "`"$mainCjs`""
    $ShortcutSm.WorkingDirectory = $projectRoot
    if (Test-Path $icoPath) {
        $ShortcutSm.IconLocation = "$icoPath,0"
    }
    $ShortcutSm.Description = "EffStreak - Solo Leveling Habit and Streak System (Desktop App)"
    $ShortcutSm.Save()
    Write-Host "Start Menu Shortcut created: $startMenuShortcutPath" -ForegroundColor Green
} catch {
    Write-Host "Start Menu shortcut note: $_" -ForegroundColor Yellow
}

Write-Host "`n========================================================" -ForegroundColor Magenta
Write-Host "EffStreak Laptop Desktop App Installed Successfully!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Magenta
