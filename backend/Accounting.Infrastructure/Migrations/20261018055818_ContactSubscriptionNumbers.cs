using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ContactSubscriptionNumbers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubscriptionNumber",
                table: "Contacts",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_SubscriptionNumber",
                table: "Contacts",
                column: "SubscriptionNumber",
                unique: true,
                filter: "[SubscriptionNumber] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Contacts_SubscriptionNumber",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "SubscriptionNumber",
                table: "Contacts");
        }
    }
}
