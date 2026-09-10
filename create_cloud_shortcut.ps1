$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "EffStreak Cloud App.lnk"
$icoPath = Join-Path $PSScriptRoot "public\app_icon.ico"

$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = "msedge.exe"
$s.Arguments = "--app=https://effectivestreak-app.surge.sh"
if (Test-Path $icoPath) {
    $s.IconLocation = "$icoPath,0"
}
$s.Description = "EffStreak 24/7 Cloud App"
$s.Save()
Write-Host "Created $shortcutPath successfully!"
