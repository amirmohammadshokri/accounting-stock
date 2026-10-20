using Accounting.Infrastructure.Authentication;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

// Read-only by default. The explicit reset flag is restricted to the approved demo account and database.
// Never print password hashes or connection strings.
var root = Path.GetFullPath(args.FirstOrDefault() ?? "Accounting.Api");
var config = new ConfigurationBuilder().SetBasePath(root).AddJsonFile("appsettings.json")
    .AddJsonFile("appsettings.Development.json", optional:true)
    .AddUserSecrets("accounting-api-b3f2a6e1-7c4d-4a9b-9e2f-1d6c8a0f5b3e")
    .AddEnvironmentVariables().Build();
var connectionString = new SqlConnectionStringBuilder(config.GetConnectionString("Default")) { ConnectTimeout = 10 };
await using var connection = new SqlConnection(connectionString.ConnectionString);
await connection.OpenAsync();
if (args.Contains("--reset-approved-demo-password"))
{
    if (connectionString.DataSource != "192.168.100.92" || connectionString.InitialCatalog != "AccountingDb")
        throw new InvalidOperationException("The configured database is not the approved reset target.");
    await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync();
    await using var reset = connection.CreateCommand();
    reset.Transaction = transaction;
    reset.CommandText = "SELECT COUNT(*) FROM Users WITH (UPDLOCK, HOLDLOCK) WHERE Email = @email AND IsActive = 1 AND IsDeleted = 0";
    reset.Parameters.AddWithValue("@email", "admin@demo.local");
    if (Convert.ToInt32(await reset.ExecuteScalarAsync()) != 1)
        throw new InvalidOperationException("Expected exactly one active demo admin. No changes committed.");
    var passwordHasher = new PasswordHasher();
    reset.CommandText = "UPDATE Users SET PasswordHash = @hash WHERE Email = @email AND IsActive = 1 AND IsDeleted = 0";
    reset.Parameters.AddWithValue("@hash", passwordHasher.HashPassword("Demo1405!"));
    if (await reset.ExecuteNonQueryAsync() != 1)
        throw new InvalidOperationException("Unexpected affected row count. No changes committed.");
    reset.CommandText = "SELECT PasswordHash FROM Users WHERE Email = @email";
    if (!passwordHasher.VerifyPassword((string)(await reset.ExecuteScalarAsync())!, "Demo1405!"))
        throw new InvalidOperationException("Password verification failed. No changes committed.");
    await transaction.CommitAsync();
    Console.WriteLine("{\"passwordReset\":true,\"affectedAccounts\":1}");
}
await using var command = connection.CreateCommand();
command.CommandText = "SELECT Email, IsActive, IsDeleted, PasswordHash, BranchId FROM Users WHERE Email = @email";
command.Parameters.AddWithValue("@email", "admin@demo.local");
await using var reader = await command.ExecuteReaderAsync();
if (!await reader.ReadAsync()) { Console.WriteLine("{\"exists\":false}"); return; }
var hasher = new PasswordHasher();
Console.WriteLine(JsonSerializer.Serialize(new {
    exists = true, active = reader.GetBoolean(1), deleted = reader.GetBoolean(2),
    submittedPasswordMatches = hasher.VerifyPassword(reader.GetString(3), "Demo1405!"),
    branchAssigned = !reader.IsDBNull(4)
}));
