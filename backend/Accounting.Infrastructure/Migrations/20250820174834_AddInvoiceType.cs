using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Direction",
                table: "Invoices",
                newName: "Type");

            migrationBuilder.RenameIndex(
                name: "IX_Invoices_Direction_DateUtc",
                table: "Invoices",
                newName: "IX_Invoices_Type_DateUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Invoices",
                newName: "Direction");

            migrationBuilder.RenameIndex(
                name: "IX_Invoices_Type_DateUtc",
                table: "Invoices",
                newName: "IX_Invoices_Direction_DateUtc");
        }
    }
}
