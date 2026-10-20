param([string]$Version = (Get-Date -Format 'yyyyMMdd-HHmmss'))
$ErrorActionPreference = 'Stop'
if ($Version -notmatch '^[A-Za-z0-9_-]+$') { throw 'Version may contain only letters, digits, underscores and hyphens.' }
$backend = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$package = Join-Path $backend ('output\AccountingDb-Raw-fa-' + $Version)
$zipPath = $package + '.zip'
if ((Test-Path -LiteralPath $package) -or (Test-Path -LiteralPath $zipPath)) { throw 'Output already exists. Choose a new version.' }
Push-Location $backend
try {
    & dotnet run --project Accounting.DatabaseSetup\Accounting.DatabaseSetup.csproj -c Release -p:NuGetAudit=false -p:RestoreSources=https://api.nuget.org/v3/index.json -- export-schema (Join-Path $PSScriptRoot 'AccountingDb.Schema.sql')
    if ($LASTEXITCODE -ne 0) { throw 'Schema export failed.' }
    & dotnet publish Accounting.DatabaseSetup\Accounting.DatabaseSetup.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -p:NuGetAudit=false --source https://api.nuget.org/v3/index.json -o (Join-Path $package 'tool')
    if ($LASTEXITCODE -ne 0) { throw 'Database setup publish failed.' }
    $toolRoot = [IO.Path]::GetFullPath((Join-Path $package 'tool')) + [IO.Path]::DirectorySeparatorChar
    $privateFiles = Get-ChildItem -LiteralPath (Join-Path $package 'tool') -Recurse -File | Where-Object {
        $_.Name -like '*.private.json' -or $_.Name -like 'appsettings*.json' -or $_.Extension -in @('.pfx', '.p12', '.pem', '.key')
    }
    foreach ($file in $privateFiles) {
        if (!$file.FullName.StartsWith($toolRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected private file path.' }
        Remove-Item -LiteralPath $file.FullName
    }
    Get-ChildItem -LiteralPath $PSScriptRoot -File | Where-Object { $_.Extension -in @('.sql', '.cmd', '.txt') -or $_.Name -eq 'Initialize-Database.ps1' } |
        ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $package }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'database-settings.example.json') -Destination $package
    # Always use the public blank/local template, never a developer's private connection file.
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'database-settings.example.json') -Destination (Join-Path $package 'database-settings.local.json')
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::CreateFromDirectory($package, $zipPath, [IO.Compression.CompressionLevel]::Optimal, $true)
    $hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
    ($hash + '  ' + [IO.Path]::GetFileName($zipPath)) | Set-Content -LiteralPath ($zipPath + '.sha256.txt') -Encoding ASCII
    Write-Host "Raw database package: $zipPath"
} finally { Pop-Location }
