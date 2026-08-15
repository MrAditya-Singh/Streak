Add-Type -AssemblyName System.Drawing

$pngPath = "d:\AndroidStudio\TestProject\EffectiveStreak\public\app-icon.png"
$icoPath = "d:\AndroidStudio\TestProject\EffectiveStreak\public\app_icon.ico"

# 1. Create .ICO file
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

# 2. Create run_desktop.bat
$batPath = "d:\AndroidStudio\TestProject\EffectiveStreak\run_desktop.bat"
$batContent = @"
@echo off
cd /d d:\AndroidStudio\TestProject\EffectiveStreak
start msedge.exe --app="http://localhost:5173" --window-size=1280,820
start msedge.exe --app="http://localhost:5173/?mode=widget" --window-size=350,190
exit
"@
Set-Content -Path $batPath -Value $batContent
Write-Host "Created $batPath"

# 3. Create Windows Desktop Shortcut on user's Desktop
try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $WshShell = New-Object -comObject WScript.Shell
    $shortcutPath = "$desktopPath\EffStreak.lnk"
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batPath
    $Shortcut.WorkingDirectory = "d:\AndroidStudio\TestProject\EffectiveStreak"
    $Shortcut.IconLocation = $icoPath
    $Shortcut.Description = "EffStreak - Solo Leveling Habit & Streak System"
    $Shortcut.Save()
    Write-Host "Created Desktop Shortcut: $shortcutPath"
} catch {
    Write-Host "Desktop shortcut note: $_"
}
