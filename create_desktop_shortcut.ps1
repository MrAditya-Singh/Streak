Add-Type -AssemblyName System.Drawing

$projectRoot = $PSScriptRoot
$pngPath = Join-Path $projectRoot "public\app-icon.png"
$icoPath = Join-Path $projectRoot "public\app_icon.ico"
$batPath = Join-Path $projectRoot "run_desktop.bat"

# 1. Create .ICO file if missing
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
        Write-Host "Created $icoPath"
    } catch {
        Write-Host "Icon generation warning: $_"
    }
}

# 2. Create Windows Desktop Shortcut on user's Desktop
try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $WshShell = New-Object -comObject WScript.Shell
    $shortcutPath = "$desktopPath\EffStreak.lnk"
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batPath
    $Shortcut.WorkingDirectory = $projectRoot
    if (Test-Path $icoPath) {
        $Shortcut.IconLocation = "$icoPath,0"
    }
    $Shortcut.Description = "EffStreak - Solo Leveling Habit & Streak System"
    $Shortcut.Save()
    Write-Host "Created Desktop Shortcut: $shortcutPath"
} catch {
    Write-Host "Desktop shortcut note: $_"
}
