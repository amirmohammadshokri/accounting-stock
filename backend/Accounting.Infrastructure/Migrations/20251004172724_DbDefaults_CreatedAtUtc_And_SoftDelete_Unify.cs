using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Accounting.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DbDefaults_CreatedAtUtc_And_SoftDelete_Unify : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExpenseLists_CreatedUtc",
                table: "ExpenseLists");

            migrationBuilder.DropColumn(
                name: "CreatedUtc",
                table: "ExpenseLists");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Payments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Items",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "Items",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Items",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Items",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Items",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Invoices",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "InvoiceLines",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "InvoiceLines",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Expenses",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "Expenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Expenses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Expenses",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Expenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ExpenseLists",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "ExpenseLists",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "ExpenseLists",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "Contacts",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Contacts",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "Contacts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "CashBankAccounts",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "CashBankAccounts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CashBankAccounts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "CashBankAccounts",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "CashBankAccounts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Items_Name",
                table: "Items",
                column: "Name");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Expense_VatRate_Range",
                table: "Expenses",
                sql: "[VatRate] BETWEEN 0 AND 100");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseLists_CreatedAtUtc",
                table: "ExpenseLists",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_CashBankAccounts_Name",
                table: "CashBankAccounts",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Items_Name",
                table: "Items");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Expense_VatRate_Range",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_ExpenseLists_CreatedAtUtc",
                table: "ExpenseLists");

            migrationBuilder.DropIndex(
                name: "IX_CashBankAccounts_Name",
                table: "CashBankAccounts");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Items");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "InvoiceLines");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "InvoiceLines");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "ExpenseLists");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "ExpenseLists");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "ExpenseLists");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "CashBankAccounts");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "CashBankAccounts");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CashBankAccounts");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "CashBankAccounts");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "CashBankAccounts");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedUtc",
                table: "ExpenseLists",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "UpdatedAtUtc",
                table: "Contacts",
                type: "datetimeoffset",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "CreatedAtUtc",
                table: "Contacts",
                type: "datetimeoffset",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseLists_CreatedUtc",
                table: "ExpenseLists",
                column: "CreatedUtc");
        }
    }
}
