using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseInvoiceSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceLines_Items_ItemId",
                table: "InvoiceLines");

            migrationBuilder.AlterColumn<int>(
                name: "ItemId",
                table: "InvoiceLines",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "ExpenseDefinitionId",
                table: "InvoiceLines",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLines_ExpenseDefinitionId",
                table: "InvoiceLines",
                column: "ExpenseDefinitionId");

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceLines_ExpenseDefinitions_ExpenseDefinitionId",
                table: "InvoiceLines",
                column: "ExpenseDefinitionId",
                principalTable: "ExpenseDefinitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceLines_Items_ItemId",
                table: "InvoiceLines",
                column: "ItemId",
                principalTable: "Items",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceLines_ExpenseDefinitions_ExpenseDefinitionId",
                table: "InvoiceLines");

            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceLines_Items_ItemId",
                table: "InvoiceLines");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceLines_ExpenseDefinitionId",
                table: "InvoiceLines");

            migrationBuilder.DropColumn(
                name: "ExpenseDefinitionId",
                table: "InvoiceLines");

            migrationBuilder.AlterColumn<int>(
                name: "ItemId",
                table: "InvoiceLines",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceLines_Items_ItemId",
                table: "InvoiceLines",
                column: "ItemId",
                principalTable: "Items",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
