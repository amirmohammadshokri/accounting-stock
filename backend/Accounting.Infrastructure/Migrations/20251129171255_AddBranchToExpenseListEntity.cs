using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchToExpenseListEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "ExpenseLists",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseLists_BranchId",
                table: "ExpenseLists",
                column: "BranchId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExpenseLists_Branches_BranchId",
                table: "ExpenseLists",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExpenseLists_Branches_BranchId",
                table: "ExpenseLists");

            migrationBuilder.DropIndex(
                name: "IX_ExpenseLists_BranchId",
                table: "ExpenseLists");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "ExpenseLists");
        }
    }
}
