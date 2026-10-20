param([switch]$AllowExistingSchema, [switch]$ValidateOnly)
$ErrorActionPreference = 'Stop'
$previousConnection = $env:ACCOUNTING_SETUP_CONNECTION
try {
    $settingsPath = Join-Path $PSScriptRoot 'database-settings.local.json'
    if (!(Test-Path -LiteralPath $settingsPath -PathType Leaf)) {
        throw 'فایل database-settings.local.json پیدا نشد؛ از فایل نمونه کپی بگیرید و کانکشن مقصد را در آن تنظیم کنید.'
    }
    try {
        $settings = Get-Content -LiteralPath $settingsPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $connectionString = [string]$settings.ConnectionStrings.Default
        if ([string]::IsNullOrWhiteSpace($connectionString)) { throw 'Empty connection' }
        Add-Type -AssemblyName System.Data
        $parsed = [System.Data.SqlClient.SqlConnectionStringBuilder]::new($connectionString)
    } catch {
        throw 'فایل تنظیمات یا رشته اتصال معتبر نیست؛ مقدار ConnectionStrings.Default و قواعد JSON را بررسی کنید.'
    }
    if ([string]::IsNullOrWhiteSpace($parsed.DataSource) -or [string]::IsNullOrWhiteSpace($parsed.InitialCatalog)) {
        throw 'آدرس Server و نام Database باید در کانکشن مشخص باشند.'
    }
    if (@('master', 'model', 'msdb', 'tempdb') -contains $parsed.InitialCatalog) {
        throw 'دیتابیس سیستمی مجاز نیست؛ نام یک دیتابیس مخصوص برنامه را وارد کنید.'
    }
    Write-Host ('سرور مقصد: ' + $parsed.DataSource)
    Write-Host ('نام دیتابیس: ' + $parsed.InitialCatalog)
    if ($ValidateOnly) {
        Write-Host 'فایل تنظیمات معتبر است؛ هیچ اتصالی به SQL انجام نشد.'
        return
    }
    $tool = Join-Path $PSScriptRoot 'tool\Accounting.DatabaseSetup.exe'
    if (!(Test-Path -LiteralPath $tool -PathType Leaf)) { throw 'ابزار آماده پیدا نشد؛ ZIP را کامل استخراج کنید.' }
    # The setup executable already supports this process-only setting. Never change appsettings.
    $env:ACCOUNTING_SETUP_CONNECTION = $connectionString
    if ($AllowExistingSchema) { & $tool initialize --allow-existing-schema }
    else { & $tool initialize }
    $result = $LASTEXITCODE
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    $result = 1
} finally {
    $env:ACCOUNTING_SETUP_CONNECTION = $previousConnection
}
exit $result
