using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ActiveBranchWorkspace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(name: "BranchId", table: "AuditTrails", type: "int", nullable: true);
            migrationBuilder.CreateIndex(name: "IX_AuditTrails_BranchId", table: "AuditTrails", column: "BranchId");
            migrationBuilder.DropIndex(
                name: "IX_ContactOpeningBalances_BranchId",
                table: "ContactOpeningBalances");

            migrationBuilder.DropIndex(
                name: "IX_ContactOpeningBalances_ContactId",
                table: "ContactOpeningBalances");

            migrationBuilder.CreateTable(
                name: "UserBranches",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBranches", x => new { x.UserId, x.BranchId });
                    table.ForeignKey(
                        name: "FK_UserBranches_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserBranches_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContactOpeningBalances_BranchId_ContactId",
                table: "ContactOpeningBalances",
                columns: new[] { "BranchId", "ContactId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_ContactOpeningBalances_ContactId",
                table: "ContactOpeningBalances",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBranches_BranchId",
                table: "UserBranches",
                column: "BranchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_AuditTrails_BranchId", table: "AuditTrails");
            migrationBuilder.DropColumn(name: "BranchId", table: "AuditTrails");
            migrationBuilder.DropTable(
                name: "UserBranches");

            migrationBuilder.DropIndex(
                name: "IX_ContactOpeningBalances_BranchId_ContactId",
                table: "ContactOpeningBalances");

            migrationBuilder.DropIndex(
                name: "IX_ContactOpeningBalances_ContactId",
                table: "ContactOpeningBalances");

            migrationBuilder.CreateIndex(
                name: "IX_ContactOpeningBalances_BranchId",
                table: "ContactOpeningBalances",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactOpeningBalances_ContactId",
                table: "ContactOpeningBalances",
                column: "ContactId",
                unique: true,
                filter: "[IsDeleted] = 0");
        }
    }
}
