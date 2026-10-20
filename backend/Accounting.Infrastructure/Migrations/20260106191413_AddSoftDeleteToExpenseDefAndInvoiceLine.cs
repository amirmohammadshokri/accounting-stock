using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteToExpenseDefAndInvoiceLine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExpenseDefinitions_Code",
                table: "ExpenseDefinitions");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "InvoiceLines",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "InvoiceLines",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "ExpenseDefinitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "ExpenseDefinitions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ExpenseDefinitions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseDefinitions_BranchId_Code",
                table: "ExpenseDefinitions",
                columns: new[] { "BranchId", "Code" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.AddForeignKey(
                name: "FK_ExpenseDefinitions_Branches_BranchId",
                table: "ExpenseDefinitions",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExpenseDefinitions_Branches_BranchId",
                table: "ExpenseDefinitions");

            migrationBuilder.DropIndex(
                name: "IX_ExpenseDefinitions_BranchId_Code",
                table: "ExpenseDefinitions");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "InvoiceLines");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "InvoiceLines");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "ExpenseDefinitions");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "ExpenseDefinitions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ExpenseDefinitions");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseDefinitions_Code",
                table: "ExpenseDefinitions",
                column: "Code",
                unique: true);
        }
    }
}
