@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist tool\Accounting.DatabaseSetup.exe (
  echo ابزار آماده در این پوشه موجود نیست. ZIP دیتابیس خام را کامل استخراج کنید.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Initialize-Database.ps1"
pause
