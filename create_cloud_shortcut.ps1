$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "EffStreak Cloud App.lnk"
$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = "msedge.exe"
$s.Arguments = "--app=https://effstreak-tracker.surge.sh"
$s.IconLocation = "d:\AndroidStudio\TestProject\EffectiveStreak\public\app_icon.ico,0"
$s.Description = "EffStreak 24/7 Cloud App"
$s.Save()
Write-Host "Created $shortcutPath successfully!"
