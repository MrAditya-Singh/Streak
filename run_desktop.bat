@echo off
set "SCRIPT_DIR=%~dp0"
start "" "%SCRIPT_DIR%node_modules\electron\dist\electron.exe" "%SCRIPT_DIR%electron\main.cjs"
exit
