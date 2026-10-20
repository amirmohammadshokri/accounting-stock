using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchToAllEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "Payments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "Items",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "FixedAssets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "Contacts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "CashBankAccounts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BranchId",
                table: "Payments",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Items_BranchId",
                table: "Items",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_FixedAssets_BranchId",
                table: "FixedAssets",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_BranchId",
                table: "Contacts",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_CashBankAccounts_BranchId",
                table: "CashBankAccounts",
                column: "BranchId");

            migrationBuilder.AddForeignKey(
                name: "FK_CashBankAccounts_Branches_BranchId",
                table: "CashBankAccounts",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Contacts_Branches_BranchId",
                table: "Contacts",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FixedAssets_Branches_BranchId",
                table: "FixedAssets",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Items_Branches_BranchId",
                table: "Items",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Branches_BranchId",
                table: "Payments",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CashBankAccounts_Branches_BranchId",
                table: "CashBankAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_Contacts_Branches_BranchId",
                table: "Contacts");

            migrationBuilder.DropForeignKey(
                name: "FK_FixedAssets_Branches_BranchId",
                table: "FixedAssets");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Branches_BranchId",
                table: "Items");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Branches_BranchId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_BranchId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Items_BranchId",
                table: "Items");

            migrationBuilder.DropIndex(
                name: "IX_FixedAssets_BranchId",
                table: "FixedAssets");

            migrationBuilder.DropIndex(
                name: "IX_Contacts_BranchId",
                table: "Contacts");

            migrationBuilder.DropIndex(
                name: "IX_CashBankAccounts_BranchId",
                table: "CashBankAccounts");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "FixedAssets");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "CashBankAccounts");
        }
    }
}
