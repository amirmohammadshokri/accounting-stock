using System.Text;
using System.Text.RegularExpressions;
using Accounting.Application.Common.Interfaces;
using Accounting.Infrastructure;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Seed;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

Console.InputEncoding = Encoding.UTF8;
Console.OutputEncoding = new UTF8Encoding(false);
try
{
    if (args.Length == 0 || args[0] is "help" or "--help")
    {
        Console.WriteLine("ابزار ساخت دیتابیس خام حسابداری و انبار");
        Console.WriteLine("export-schema <مسیر فایل SQL>: تولید ساختار کامل از migrationها؛ بدون اتصال به دیتابیس");
        Console.WriteLine("initialize: انتخاب SQL مقصد، ساخت ساختار و داده‌های اولیه فارسی با رمز مدیر دلخواه");
        Console.WriteLine("initialize --allow-existing-schema: استفاده مجدد از ساختار موجودِ فاقد اطلاعات عملیاتی؛ بدون تغییر رمز کاربران موجود");
        Console.WriteLine("این ابزار تنظیمات SQL برنامه را نمی‌خواند و تغییر نمی‌دهد؛ اتصال مقصد را هنگام اجرا وارد می‌کنید.");
        return 0;
    }

    if (args[0] == "export-schema")
    {
        if (args.Length != 2) throw new ArgumentException("مسیر فایل خروجی SQL را مشخص کنید.");
        using var provider = BuildServices("Server=unused;Database=unused;");
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var script = db.GetService<IMigrator>().GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        var header = "-- ساختار خام دیتابیس حسابداری و انبار؛ تولیدشده از migrationهای پروژه\n"
            + "-- ابتدا در SQL Server یک دیتابیس خالی بسازید و آن را در SSMS انتخاب کنید.\n"
            + "-- این فایل هیچ کاربر، رمز، اطلاعات عملیاتی یا تنظیم اتصال خصوصی ندارد.\n"
            + "-- برای داده‌های پایه و ساخت مدیر، ابزار راه‌اندازی را اجرا کنید.\n";
        const string guard = "IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')\n"
            + "    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;\n";
        // Guard every batch: SSMS can continue after an error in an earlier GO batch.
        script = string.Join("\n", Regex.Split(script, @"(?im)^[ \t]*GO[ \t]*\r?$")
            .Where(batch => !string.IsNullOrWhiteSpace(batch)).Select(batch => guard + batch.Trim() + "\nGO\n"));
        var output = Path.GetFullPath(args[1]);
        Directory.CreateDirectory(Path.GetDirectoryName(output)!);
        await File.WriteAllTextAsync(output, header + script, new UTF8Encoding(true));
        Console.WriteLine($"اسکریپت ساختار خام ذخیره شد: {output}");
        return 0;
    }

    if (args[0] != "initialize" || args.Skip(1).Any(a => a != "--allow-existing-schema"))
        throw new ArgumentException("فرمان نامعتبر است؛ برای راهنما help را اجرا کنید.");

    Console.WriteLine("راه‌اندازی دیتابیس خام؛ فاکتور، مشتری، کالا، مانده و تراکنش نمونه ساخته نمی‌شود.");
    var connectionString = Environment.GetEnvironmentVariable("ACCOUNTING_SETUP_CONNECTION");
    if (string.IsNullOrWhiteSpace(connectionString)) connectionString = ReadConnection();
    var connection = new SqlConnectionStringBuilder(connectionString);
    if (string.IsNullOrWhiteSpace(connection.InitialCatalog)
        || new[] { "master", "model", "msdb", "tempdb" }.Contains(connection.InitialCatalog, StringComparer.OrdinalIgnoreCase))
        throw new InvalidOperationException("نام یک دیتابیس مخصوص برنامه را وارد کنید؛ دیتابیس سیستمی مجاز نیست.");
    using var services = BuildServices(connection.ConnectionString);
    using var serviceScope = services.CreateScope();
    var database = serviceScope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Inspect before applying migrations: do not change an existing customer database accidentally.
    if (await database.Database.CanConnectAsync())
    {
        var hasTables = await InspectExistingDatabaseAsync(connection.ConnectionString);
        if (hasTables && !args.Contains("--allow-existing-schema"))
            throw new InvalidOperationException("دیتابیس انتخاب‌شده از قبل جدول دارد. برای دیتابیس تازه، نام جدید انتخاب کنید. فقط برای ساختار خام موجود، پس از بررسی از --allow-existing-schema استفاده کنید.");
    }
    var password = Environment.GetEnvironmentVariable("ACCOUNTING_INITIAL_ADMIN_PASSWORD");
    var hasUsers = await database.Database.CanConnectAsync() && await HasUsersTableAndRowsAsync(connection.ConnectionString);
    if (!hasUsers)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            password = ReadSecret("رمز اولیه admin@demo.local را وارد کنید: ");
            if (password != ReadSecret("رمز را دوباره وارد کنید: ")) throw new InvalidOperationException("دو رمز یکسان نیستند.");
        }
        if (password.Length < 12 || !Regex.IsMatch(password, "[A-Z]") || !Regex.IsMatch(password, "[a-z]") || !Regex.IsMatch(password, "[0-9]"))
            throw new InvalidOperationException("رمز اولیه باید حداقل ۱۲ نویسه و شامل حرف بزرگ و کوچک انگلیسی و رقم باشد.");
    }
    Console.WriteLine($"مقصد: {connection.DataSource} / {connection.InitialCatalog}");
    Console.WriteLine("اگر نام دیتابیس و سرور درست است، واژه YES را وارد کنید:");
    if (Console.ReadLine()?.Trim() != "YES") { Console.WriteLine("راه‌اندازی لغو شد؛ تغییری اعمال نشد."); return 0; }
    await database.Database.MigrateAsync();
    await using var transaction = await database.Database.BeginTransactionAsync();
    await StartupDataSeeder.SeedEssentialAsync(database,
        serviceScope.ServiceProvider.GetRequiredService<IPasswordHasher>(), password ?? string.Empty);
    await transaction.CommitAsync();
    Console.WriteLine("دیتابیس خام و داده‌های پایه فارسی آماده شد.");
    Console.WriteLine(hasUsers ? "حساب‌ها و رمزهای موجود حفظ شدند." : "کاربر اولیه: admin@demo.local — رمز همان مقداری است که وارد کردید.");
    Console.WriteLine("برای اتصال برنامه، تنظیمات مقصد را جداگانه در appsettings.Production.json وارد کنید؛ این ابزار آن فایل را تغییر نمی‌دهد.");
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine("راه‌اندازی انجام نشد. فایل تنظیمات SQL برنامه تغییر نکرده است.");
    if (ex is SqlException sql)
        Console.Error.WriteLine($"خطای SQL با شماره {sql.Number}: اتصال، مجوزها، دسترسی شبکه و نسخه SQL Server را بررسی کنید.");
    else Console.Error.WriteLine(ex.Message);
    return 1;
}

static ServiceProvider BuildServices(string connectionString)
{
    var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
    { ["ConnectionStrings:Default"] = connectionString }).Build();
    var services = new ServiceCollection();
    services.AddLogging();
    services.AddSingleton(TimeProvider.System);
    services.AddInfrastructure(config);
    return services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
}

static string ReadConnection()
{
    Console.Write("آدرس SQL مقصد، مثلاً localhost\\SQLEXPRESS یا 192.168.1.50,1433: ");
    var server = Console.ReadLine()?.Trim();
    if (string.IsNullOrWhiteSpace(server)) throw new ArgumentException("آدرس SQL الزامی است.");
    Console.Write("نام دیتابیس جدید (Enter = AccountingDb): ");
    var database = Console.ReadLine()?.Trim();
    var connection = new SqlConnectionStringBuilder
    {
        DataSource = server, InitialCatalog = string.IsNullOrWhiteSpace(database) ? "AccountingDb" : database,
        Encrypt = true, TrustServerCertificate = true, MultipleActiveResultSets = true
    };
    Console.Write("احراز هویت ویندوزی باشد؟ Y/N: ");
    connection.IntegratedSecurity = string.Equals(Console.ReadLine()?.Trim(), "Y", StringComparison.OrdinalIgnoreCase);
    if (!connection.IntegratedSecurity)
    {
        Console.Write("نام حساب SQL: ");
        connection.UserID = Console.ReadLine()?.Trim() ?? "";
        connection.Password = ReadSecret("رمز حساب SQL: ");
    }
    return connection.ConnectionString;
}

static string ReadSecret(string prompt)
{
    Console.Write(prompt);
    if (Console.IsInputRedirected) return Console.ReadLine() ?? "";
    var value = new StringBuilder();
    while (true)
    {
        var key = Console.ReadKey(intercept: true);
        if (key.Key == ConsoleKey.Enter) { Console.WriteLine(); return value.ToString(); }
        if (key.Key == ConsoleKey.Backspace) { if (value.Length > 0) value.Length--; continue; }
        if (!char.IsControl(key.KeyChar)) value.Append(key.KeyChar);
    }
}

static async Task<bool> InspectExistingDatabaseAsync(string connectionString)
{
    var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    { "__EFMigrationsHistory", "CompanySettings", "Branches", "Warehouses", "Units", "Roles", "RolePermissions", "Users", "UserRoles", "AuditTrails" };
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync();
    await using var list = new SqlCommand("SELECT SCHEMA_NAME(schema_id), name FROM sys.tables WHERE is_ms_shipped = 0", connection);
    var tables = new List<(string Schema, string Name)>();
    await using (var reader = await list.ExecuteReaderAsync())
        while (await reader.ReadAsync()) tables.Add((reader.GetString(0), reader.GetString(1)));
    foreach (var (schema, name) in tables.Where(t => t.Schema != "dbo" || !allowed.Contains(t.Name)))
    {
        var qualified = "[" + schema.Replace("]", "]]") + "].[" + name.Replace("]", "]]") + "]";
        await using var check = new SqlCommand($"SELECT CASE WHEN EXISTS (SELECT 1 FROM {qualified}) THEN 1 ELSE 0 END", connection);
        if (Convert.ToInt32(await check.ExecuteScalarAsync()) == 1)
            throw new InvalidOperationException("دیتابیس دارای اطلاعات عملیاتی یا جدول ناشناخته است؛ ابزار خام‌سازی روی این دیتابیس اجرا نمی‌شود. یک دیتابیس جدید انتخاب کنید.");
    }
    return tables.Count > 0;
}

static async Task<bool> HasUsersTableAndRowsAsync(string connectionString)
{
    await using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync();
    await using var check = new SqlCommand("IF OBJECT_ID(N'dbo.Users', N'U') IS NULL SELECT 0; ELSE EXEC(N'SELECT CASE WHEN EXISTS(SELECT 1 FROM dbo.Users) THEN 1 ELSE 0 END');", connection);
    return Convert.ToInt32(await check.ExecuteScalarAsync()) == 1;
}
