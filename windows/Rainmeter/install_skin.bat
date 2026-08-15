@echo off
echo =========================================================
echo       Installing EffStreak Skin for Rainmeter
echo =========================================================

set TARGET_DIR=%USERPROFILE%\Documents\Rainmeter\Skins\EffStreak
echo Target Directory: %TARGET_DIR%

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
xcopy /E /I /Y "%~dp0Skins\EffStreak" "%TARGET_DIR%"

echo.
echo [SUCCESS] EffStreak Rainmeter skin installed!
echo Please right-click Rainmeter in your system tray and select 'Refresh all'.
pause
