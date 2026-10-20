param(
    [Parameter(Mandatory = $true)][string]$ConnectionString,
    [string]$DemoPassword = "Demo1405!",
    [string]$JwtSecret = $env:JwtSettings__Secret
)
$ErrorActionPreference = "Stop"
$apiPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\Accounting.Api"))
if ([string]::IsNullOrWhiteSpace($JwtSecret)) {
    $bytes = New-Object byte[] 48
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $JwtSecret = [Convert]::ToBase64String($bytes)
}
if ($JwtSecret.Length -lt 32) { throw "کلید ورود باید حداقل ۳۲ نویسه باشد." }
$env:ConnectionStrings__Default = $ConnectionString
$env:JwtSettings__Secret = $JwtSecret
$env:Seeding__Enabled = "true"
$env:Seeding__DemoPassword = $DemoPassword
Write-Host "راه‌اندازی نسخه نمایشی فارسی و آماده‌سازی پایگاه داده انتخاب‌شده"
& dotnet run --project (Join-Path $apiPath "Accounting.Api.csproj") --launch-profile https
exit $LASTEXITCODE
