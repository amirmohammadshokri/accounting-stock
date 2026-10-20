using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentChequeId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChequeId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ChequeId",
                table: "Payments",
                column: "ChequeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Cheques_ChequeId",
                table: "Payments",
                column: "ChequeId",
                principalTable: "Cheques",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Cheques_ChequeId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_ChequeId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ChequeId",
                table: "Payments");
        }
    }
}
