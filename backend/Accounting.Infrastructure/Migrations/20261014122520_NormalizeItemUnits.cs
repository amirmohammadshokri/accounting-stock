using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeItemUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                });

            migrationBuilder.AddColumn<int>(
                name: "UnitId", table: "Items", type: "int", nullable: true);

            // Include soft-deleted items and preserve all existing unit names.
            migrationBuilder.Sql("EXEC(N'" + """
                INSERT INTO [Units] ([Name], [IsDeleted])
                SELECT DISTINCT COALESCE(NULLIF(LTRIM(RTRIM([Unit])), N''), N'عدد'), 0
                FROM [Items];

                UPDATE i SET [UnitId] = u.[Id]
                FROM [Items] AS i
                INNER JOIN [Units] AS u
                  ON u.[Name] = COALESCE(NULLIF(LTRIM(RTRIM(i.[Unit])), N''), N'عدد');

                IF EXISTS (SELECT 1 FROM [Items] WHERE [UnitId] IS NULL)
                    THROW 51000, 'Some item units could not be migrated.', 1;
                """.Replace("'", "''") + "');");

            migrationBuilder.AlterColumn<int>(
                name: "UnitId", table: "Items", type: "int", nullable: false,
                oldClrType: typeof(int), oldType: "int", oldNullable: true);

            migrationBuilder.DropColumn(name: "Unit", table: "Items");

            migrationBuilder.CreateIndex(
                name: "IX_Items_UnitId",
                table: "Items",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_Name",
                table: "Units",
                column: "Name",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Units_UnitId",
                table: "Items",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
            migrationBuilder.Sql("EXEC(N'" + """
                INSERT INTO [RolePermissions] ([RoleId], [Permission], [CreatedAtUtc])
                SELECT p.[RoleId], REPLACE(p.[Permission], N'Item.', N'Unit.'), GETUTCDATE()
                FROM [RolePermissions] AS p
                WHERE p.[Permission] IN (N'Item.Read', N'Item.Create', N'Item.Update', N'Item.Delete')
                  AND NOT EXISTS (
                    SELECT 1 FROM [RolePermissions] AS existing
                    WHERE existing.[RoleId] = p.[RoleId]
                      AND existing.[Permission] = REPLACE(p.[Permission], N'Item.', N'Unit.'));
                """.Replace("'", "''") + "');");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unit", table: "Items", type: "nvarchar(16)",
                maxLength: 16, nullable: true);
            migrationBuilder.Sql("EXEC(N'" + """
                UPDATE i SET [Unit] = u.[Name]
                FROM [Items] AS i INNER JOIN [Units] AS u ON u.[Id] = i.[UnitId];
                """.Replace("'", "''") + "');");
            migrationBuilder.AlterColumn<string>(
                name: "Unit", table: "Items", type: "nvarchar(16)",
                maxLength: 16, nullable: false, oldClrType: typeof(string),
                oldType: "nvarchar(16)", oldMaxLength: 16, oldNullable: true);
            migrationBuilder.DropForeignKey(name: "FK_Items_Units_UnitId", table: "Items");
            migrationBuilder.DropIndex(name: "IX_Items_UnitId", table: "Items");
            migrationBuilder.DropColumn(name: "UnitId", table: "Items");
            migrationBuilder.DropTable(name: "Units");
            migrationBuilder.Sql("DELETE FROM [RolePermissions] WHERE [Permission] IN (N'Unit.Read', N'Unit.Create', N'Unit.Update', N'Unit.Delete');");
        }
    }
}
