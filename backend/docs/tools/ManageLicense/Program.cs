using Accounting.Infrastructure;
using Accounting.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Globalization;
using System.Text.Json;

// Server-owner CLI only. Not exposed through HTTP or a customer/admin permission.
// Credentials come from private server configuration, never command-line arguments or logs.
var root=Path.GetFullPath(args.FirstOrDefault() ?? "Accounting.Api");
var config=new ConfigurationBuilder().SetBasePath(root).AddJsonFile("appsettings.json")
    .AddJsonFile("appsettings.Development.json",optional:true)
    .AddUserSecrets("accounting-api-b3f2a6e1-7c4d-4a9b-9e2f-1d6c8a0f5b3e")
    .AddEnvironmentVariables().Build();
var target=new SqlConnectionStringBuilder(config.GetConnectionString("Default"));
if (target.DataSource!="192.168.100.92" || target.InitialCatalog!="AccountingDb")
    throw new InvalidOperationException("The configured database is not the approved shared target.");
var services=new ServiceCollection();services.AddLogging();services.AddInfrastructure(config);
await using var provider=services.BuildServiceProvider();
await using var scope=provider.CreateAsyncScope();
var db=scope.ServiceProvider.GetRequiredService<AppDbContext>();
var pending=(await db.Database.GetPendingMigrationsAsync()).ToArray();
Console.WriteLine(JsonSerializer.Serialize(new{pendingMigrations=pending}));
if(args.Contains("--migrate"))
{
    await db.Database.MigrateAsync();
    Console.WriteLine("Migrations applied.");
}
else if(pending.Length>0)
{
    Console.WriteLine("Schema upgrade required. Use --migrate only with database-owner approval.");
    return;
}
var expiryIndex=Array.IndexOf(args,"--expires-utc");
var daysIndex=Array.IndexOf(args,"--days");
var unlimited=args.Contains("--unlimited");
var edit=(expiryIndex>=0?1:0)+(daysIndex>=0?1:0)+(unlimited?1:0);
if(edit>1)throw new ArgumentException("Choose exactly one expiry option.");
if(edit==1)
{
    DateTime? expiry=null;
    if(expiryIndex>=0)
    {
        if(expiryIndex+1>=args.Length || !args[expiryIndex+1].EndsWith("Z",StringComparison.Ordinal) ||
           !DateTime.TryParse(args[expiryIndex+1],CultureInfo.InvariantCulture,DateTimeStyles.AdjustToUniversal|DateTimeStyles.AssumeUniversal,out var parsed))
            throw new ArgumentException("Use --expires-utc YYYY-MM-DDTHH:mm:ssZ.");
        expiry=DateTime.SpecifyKind(parsed,DateTimeKind.Utc);
    }
    if(daysIndex>=0)
    {
        if(daysIndex+1>=args.Length || !int.TryParse(args[daysIndex+1],out var days) || days<1 || days>36500)
            throw new ArgumentException("Days must be between 1 and 36500.");
        expiry=DateTime.UtcNow.AddDays(days);
    }
    await using var transaction=await db.Database.BeginTransactionAsync();
    var records=await db.CompanySettings.ToListAsync();
    if(records.Count!=1)throw new InvalidOperationException("Expected exactly one company settings row; no expiry changed.");
    var settings=records[0];var previous=settings.LicenseExpiresAtUtc;
    // Direct parameterized update: no dependency on an HTTP user's branch or permissions.
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE CompanySettings SET LicenseExpiresAtUtc={expiry}, UpdatedAtUtc={DateTime.UtcNow} WHERE Id={settings.Id}");
    await transaction.CommitAsync();
    Console.WriteLine(JsonSerializer.Serialize(new{previousExpiresAtUtc=previous,newExpiresAtUtc=expiry}));
}
var result=await db.CompanySettings.AsNoTracking().Select(x=>new{x.Id,x.LicenseExpiresAtUtc}).ToArrayAsync();
Console.WriteLine(JsonSerializer.Serialize(new{settings=result,pendingMigrations=(await db.Database.GetPendingMigrationsAsync()).ToArray()}));
