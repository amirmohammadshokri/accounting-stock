using Accounting.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Accounting.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261014000000_UseIranianRialDefault")]
public class UseIranianRialDefault : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "Currency", table: "Cheques", type: "nvarchar(3)",
            maxLength: 3, nullable: false, defaultValue: "IRR",
            oldClrType: typeof(string), oldType: "nvarchar(3)",
            oldMaxLength: 3, oldDefaultValue: "TRY");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "Currency", table: "Cheques", type: "nvarchar(3)",
            maxLength: 3, nullable: false, defaultValue: "TRY",
            oldClrType: typeof(string), oldType: "nvarchar(3)",
            oldMaxLength: 3, oldDefaultValue: "IRR");
    }
}
