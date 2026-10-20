Stimulsoft .NET 8 desktop runtime assemblies â€” version 2024.3.2.0

These vendor-signed assemblies were copied from the user-provided installation.
They are referenced through relative HintPath values in Accounting.Infrastructure.csproj.
No executable, patcher, key generator, WinForms designer, or WPF designer is included.

Framework-dependent deployment requirements:
- Windows x64
- ASP.NET Core Runtime 8
- Windows Desktop Runtime 8
- The complete dotnet publish output, including Reporting/Invoice.mrt, Fonts, and the private license configuration

The application targets net8.0-windows because these desktop assemblies require Windows Forms.
Application and Domain remain on net8.0.

All Stimulsoft assemblies copied to build/publish output must be version 2024.3.2.0.
Do not combine them with newer Stimulsoft assemblies in an existing deployment directory.
Use a clean publish folder when replacing a previous release.

The license is read from configuration Stimulsoft:LicenseKey first, then from
Reporting/stimulsoft-license.private.json. The private file is excluded from Git
and intentionally included in build/publish output for deployment portability.
Keep it on the backend only; never include it in a frontend/template handoff.

Alternatively, dotnet publish -r win-x64 --self-contained true bundles the .NET runtimes.
A verified portable publish is available at Accounting.Api/bin/Stimul2024Portable.
