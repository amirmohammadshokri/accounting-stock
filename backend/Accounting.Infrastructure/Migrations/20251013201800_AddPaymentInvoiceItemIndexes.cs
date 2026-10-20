using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentInvoiceItemIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_Direction_DateUtc",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_Type_DateUtc",
                table: "Invoices");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_AccountId",
                table: "Payments",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ContactId",
                table: "Payments",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Currency",
                table: "Payments",
                column: "Currency");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ContactId",
                table: "Invoices",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_Currency",
                table: "Invoices",
                column: "Currency");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_AccountId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_ContactId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_Currency",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ContactId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_Currency",
                table: "Invoices");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Direction_DateUtc",
                table: "Payments",
                columns: new[] { "Direction", "DateUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_Type_DateUtc",
                table: "Invoices",
                columns: new[] { "Type", "DateUtc" });
        }
    }
}
