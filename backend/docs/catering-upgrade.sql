BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Stocks] DROP CONSTRAINT [CK_Stocks_Quantity_NonNegative];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Invoices] ADD [Notes] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Branches] ADD [Address] nvarchar(500) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Branches] ADD [LogoDataUrl] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Branches] ADD [Phone] nvarchar(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    CREATE TABLE [MealPackages] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(128) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_MealPackages] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    CREATE TABLE [MealPackageLines] (
        [Id] int NOT NULL IDENTITY,
        [MealPackageId] int NOT NULL,
        [Position] int NOT NULL,
        [ItemId] int NOT NULL,
        [Quantity] decimal(18,3) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [VatRate] int NOT NULL,
        [DiscountRate] decimal(5,2) NOT NULL,
        [WithholdingRate] int NOT NULL,
        CONSTRAINT [PK_MealPackageLines] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MealPackageLines_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MealPackageLines_MealPackages_MealPackageId] FOREIGN KEY ([MealPackageId]) REFERENCES [MealPackages] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    CREATE INDEX [IX_MealPackageLines_ItemId] ON [MealPackageLines] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    CREATE INDEX [IX_MealPackageLines_MealPackageId] ON [MealPackageLines] ([MealPackageId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018033924_CateringPackagesAndNormalInvoices', N'8.0.20');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[OrderLines]') AND [c].[name] = N'UnitPrice');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [OrderLines] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [OrderLines] ALTER COLUMN [UnitPrice] decimal(20,4) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    ALTER TABLE [OrderLines] ADD [DiscountRate] decimal(5,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    ALTER TABLE [OrderLines] ADD [WithholdingRate] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CompanySettings]') AND [c].[name] = N'LogoUrl');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [CompanySettings] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [CompanySettings] ALTER COLUMN [LogoUrl] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    ALTER TABLE [CompanyDetails] ADD [IsPresent] bit NOT NULL DEFAULT CAST(1 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018051123_CateringOrderPackagesAndLogoUploads', N'8.0.20');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018055818_ContactSubscriptionNumbers'
)
BEGIN
    ALTER TABLE [Contacts] ADD [SubscriptionNumber] nvarchar(32) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018055818_ContactSubscriptionNumbers'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Contacts_SubscriptionNumber] ON [Contacts] ([SubscriptionNumber]) WHERE [SubscriptionNumber] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018055818_ContactSubscriptionNumbers'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018055818_ContactSubscriptionNumbers', N'8.0.20');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018102009_SoftwareLicenseExpiry'
)
BEGIN
    ALTER TABLE [CompanySettings] ADD [LicenseExpiresAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018102009_SoftwareLicenseExpiry'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018102009_SoftwareLicenseExpiry', N'8.0.20');
END;
GO

COMMIT;
GO

