using Accounting.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Accounting.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261020000000_UserSessionTimeouts")]
public class UserSessionTimeouts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "SessionId", table: "Users", type: "nvarchar(32)", maxLength: 32, nullable: true);
        migrationBuilder.AddColumn<DateTime>(name: "SessionStartedAtUtc", table: "Users", type: "datetime2", nullable: true);
        migrationBuilder.AddColumn<DateTime>(name: "SessionLastActivityAtUtc", table: "Users", type: "datetime2", nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "SessionId", table: "Users");
        migrationBuilder.DropColumn(name: "SessionStartedAtUtc", table: "Users");
        migrationBuilder.DropColumn(name: "SessionLastActivityAtUtc", table: "Users");
    }
}
