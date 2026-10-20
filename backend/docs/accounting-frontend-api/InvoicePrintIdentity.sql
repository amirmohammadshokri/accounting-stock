-- SQL Server: additional identity fields for printable invoices.
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [Contacts] ADD [NationalId] nvarchar(11) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [Contacts] ADD [PostalCode] nvarchar(10) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [CompanySettings] ADD [NationalId] nvarchar(11) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [CompanySettings] ADD [PostalCode] nvarchar(10) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CompanyDetails]') AND [c].[name] = N'TaxNumber');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [CompanyDetails] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [CompanyDetails] ALTER COLUMN [TaxNumber] nvarchar(20) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261014133224_AddInvoicePrintIdentity', N'8.0.20');
END;

COMMIT;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
