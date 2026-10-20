-- ساختار خام دیتابیس حسابداری و انبار؛ تولیدشده از migrationهای پروژه
-- ابتدا در SQL Server یک دیتابیس خالی بسازید و آن را در SSMS انتخاب کنید.
-- این فایل هیچ کاربر، رمز، اطلاعات عملیاتی یا تنظیم اتصال خصوصی ندارد.
-- برای داده‌های پایه و ساخت مدیر، ابزار راه‌اندازی را اجرا کنید.
IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE TABLE [CashBankAccounts] (
        [Id] int NOT NULL IDENTITY,
        [Type] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Iban] nvarchar(34) NULL,
        CONSTRAINT [PK_CashBankAccounts] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE TABLE [Contacts] (
        [Id] int NOT NULL IDENTITY,
        [Type] int NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [TaxNo] nvarchar(20) NULL,
        [Email] nvarchar(160) NULL,
        [Phone] nvarchar(40) NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [UpdatedAtUtc] datetimeoffset NULL,
        CONSTRAINT [PK_Contacts] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE TABLE [Invoices] (
        [Id] int NOT NULL IDENTITY,
        [ContactId] int NOT NULL,
        [Direction] int NOT NULL,
        [DateUtc] datetime2 NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [TotalNet] decimal(18,2) NOT NULL,
        [TotalVat] decimal(18,2) NOT NULL,
        [TotalGross] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE TABLE [Items] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(160) NOT NULL,
        [Unit] nvarchar(16) NOT NULL,
        [VatRate] int NOT NULL,
        [DefaultUnitPrice] decimal(18,4) NULL,
        CONSTRAINT [PK_Items] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Item_VatRate_Range] CHECK ([VatRate] BETWEEN 0 AND 100)
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] int NOT NULL IDENTITY,
        [AccountId] int NOT NULL,
        [ContactId] int NULL,
        [LinkedInvoiceId] int NULL,
        [DateUtc] datetime2 NOT NULL,
        [Direction] int NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE TABLE [InvoiceLines] (
        [Id] int NOT NULL IDENTITY,
        [InvoiceId] int NOT NULL,
        [ItemId] int NOT NULL,
        [Qty] decimal(18,3) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [VatRate] int NOT NULL,
        [Net] decimal(18,2) NOT NULL,
        [Vat] decimal(18,2) NOT NULL,
        [Gross] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_InvoiceLines] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_InvoiceLine_Qty_Positive] CHECK ([Qty] >= 0),
        CONSTRAINT [CK_InvoiceLine_UnitPrice_Positive] CHECK ([UnitPrice] >= 0),
        CONSTRAINT [CK_InvoiceLine_VatRate_Range] CHECK ([VatRate] BETWEEN 0 AND 100),
        CONSTRAINT [FK_InvoiceLines_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_CashBankAccounts_Type] ON [CashBankAccounts] ([Type]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_Contacts_Name] ON [Contacts] ([Name]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_Contacts_Type] ON [Contacts] ([Type]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_InvoiceLines_InvoiceId] ON [InvoiceLines] ([InvoiceId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_Invoices_DateUtc] ON [Invoices] ([DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_Invoices_Direction_DateUtc] ON [Invoices] ([Direction], [DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_Payments_DateUtc] ON [Payments] ([DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    CREATE INDEX [IX_Payments_Direction_DateUtc] ON [Payments] ([Direction], [DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250810153437_Initial'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250810153437_Initial', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820174834_AddInvoiceType'
)
BEGIN
    EXEC sp_rename N'[Invoices].[Direction]', N'Type', N'COLUMN';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820174834_AddInvoiceType'
)
BEGIN
    EXEC sp_rename N'[Invoices].[IX_Invoices_Direction_DateUtc]', N'IX_Invoices_Type_DateUtc', N'INDEX';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820174834_AddInvoiceType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250820174834_AddInvoiceType', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    CREATE TABLE [ExpenseLists] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(200) NOT NULL,
        [CreatedUtc] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [PostedInvoiceId] int NULL,
        CONSTRAINT [PK_ExpenseLists] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    CREATE TABLE [Expenses] (
        [Id] int NOT NULL IDENTITY,
        [ExpenseListId] int NOT NULL,
        [DateUtc] datetime2 NOT NULL,
        [SupplierId] int NULL,
        [Currency] nvarchar(3) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [VatRate] int NOT NULL,
        [Category] nvarchar(100) NULL,
        [Notes] nvarchar(500) NULL,
        [PostedInvoiceId] int NULL,
        CONSTRAINT [PK_Expenses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Expenses_ExpenseLists_ExpenseListId] FOREIGN KEY ([ExpenseListId]) REFERENCES [ExpenseLists] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    CREATE INDEX [IX_ExpenseLists_CreatedUtc] ON [ExpenseLists] ([CreatedUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    CREATE INDEX [IX_ExpenseLists_Status] ON [ExpenseLists] ([Status]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    CREATE INDEX [IX_Expenses_DateUtc] ON [Expenses] ([DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    CREATE INDEX [IX_Expenses_ExpenseListId] ON [Expenses] ([ExpenseListId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    CREATE INDEX [IX_Expenses_SupplierId_DateUtc] ON [Expenses] ([SupplierId], [DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820181535_AddExpenseAndExpenseListEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250820181535_AddExpenseAndExpenseListEntities', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250914164754_AddInvoiceSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [Invoices] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250914164754_AddInvoiceSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [Invoices] ADD [RowVersion] rowversion NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250914164754_AddInvoiceSoftDeleteAndConcurrency'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250914164754_AddInvoiceSoftDeleteAndConcurrency', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918174258_AddContactSoftDeleteAndConcurrency'
)
BEGIN
    DROP INDEX [IX_Contacts_Name] ON [Contacts];
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'Name');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Contacts] ALTER COLUMN [Name] nvarchar(200) NOT NULL;
    CREATE INDEX [IX_Contacts_Name] ON [Contacts] ([Name]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918174258_AddContactSoftDeleteAndConcurrency'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'Email');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [Contacts] ALTER COLUMN [Email] nvarchar(320) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918174258_AddContactSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [Contacts] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918174258_AddContactSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [Contacts] ADD [RowVersion] rowversion NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918174258_AddContactSoftDeleteAndConcurrency'
)
BEGIN
    CREATE INDEX [IX_Contacts_Type_Name] ON [Contacts] ([Type], [Name]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918174258_AddContactSoftDeleteAndConcurrency'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250918174258_AddContactSoftDeleteAndConcurrency', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004122629_AddPaymentsSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [Payments] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004122629_AddPaymentsSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [Payments] ADD [RowVersion] rowversion NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004122629_AddPaymentsSoftDeleteAndConcurrency'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251004122629_AddPaymentsSoftDeleteAndConcurrency', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004153303_AddExpenseListSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [ExpenseLists] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004153303_AddExpenseListSoftDeleteAndConcurrency'
)
BEGIN
    ALTER TABLE [ExpenseLists] ADD [RowVersion] rowversion NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004153303_AddExpenseListSoftDeleteAndConcurrency'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251004153303_AddExpenseListSoftDeleteAndConcurrency', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    DROP INDEX [IX_ExpenseLists_CreatedUtc] ON [ExpenseLists];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ExpenseLists]') AND [c].[name] = N'CreatedUtc');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [ExpenseLists] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [ExpenseLists] DROP COLUMN [CreatedUtc];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Payments] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Payments] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Payments] ADD [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Items] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Items] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Items] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Items] ADD [RowVersion] rowversion NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Items] ADD [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Invoices] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Invoices] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Invoices] ADD [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Expenses] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Expenses] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Expenses] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Expenses] ADD [RowVersion] rowversion NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Expenses] ADD [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [ExpenseLists] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [ExpenseLists] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [ExpenseLists] ADD [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'UpdatedAtUtc');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [Contacts] ALTER COLUMN [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    DECLARE @var4 sysname;
    SELECT @var4 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'CreatedAtUtc');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var4 + '];');
    ALTER TABLE [Contacts] ALTER COLUMN [CreatedAtUtc] datetime2 NOT NULL;
    ALTER TABLE [Contacts] ADD DEFAULT (GETUTCDATE()) FOR [CreatedAtUtc];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [Contacts] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [RowVersion] rowversion NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [UpdatedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    CREATE INDEX [IX_Items_Name] ON [Items] ([Name]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    EXEC(N'ALTER TABLE [Expenses] ADD CONSTRAINT [CK_Expense_VatRate_Range] CHECK ([VatRate] BETWEEN 0 AND 100)');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    CREATE INDEX [IX_ExpenseLists_CreatedAtUtc] ON [ExpenseLists] ([CreatedAtUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    CREATE INDEX [IX_CashBankAccounts_Name] ON [CashBankAccounts] ([Name]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251004172724_DbDefaults_CreatedAtUtc_And_SoftDelete_Unify', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    DROP INDEX [IX_Payments_Direction_DateUtc] ON [Payments];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    DROP INDEX [IX_Invoices_Type_DateUtc] ON [Invoices];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    CREATE INDEX [IX_Payments_AccountId] ON [Payments] ([AccountId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    CREATE INDEX [IX_Payments_ContactId] ON [Payments] ([ContactId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    CREATE INDEX [IX_Payments_Currency] ON [Payments] ([Currency]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    CREATE INDEX [IX_Invoices_ContactId] ON [Invoices] ([ContactId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    CREATE INDEX [IX_Invoices_Currency] ON [Invoices] ([Currency]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251013201800_AddPaymentInvoiceItemIndexes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251013201800_AddPaymentInvoiceItemIndexes', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [InvoiceLines] DROP CONSTRAINT [FK_InvoiceLines_Invoices_InvoiceId];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    DROP INDEX [IX_Payments_Currency] ON [Payments];
    DECLARE @var5 sysname;
    SELECT @var5 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Payments]') AND [c].[name] = N'Currency');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [Payments] DROP CONSTRAINT [' + @var5 + '];');
    ALTER TABLE [Payments] ALTER COLUMN [Currency] varchar(3) NOT NULL;
    CREATE INDEX [IX_Payments_Currency] ON [Payments] ([Currency]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [Items] ADD [Code] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    DROP INDEX [IX_Invoices_Currency] ON [Invoices];
    DECLARE @var6 sysname;
    SELECT @var6 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Invoices]') AND [c].[name] = N'Currency');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Invoices] DROP CONSTRAINT [' + @var6 + '];');
    ALTER TABLE [Invoices] ALTER COLUMN [Currency] varchar(3) NOT NULL;
    CREATE INDEX [IX_Invoices_Currency] ON [Invoices] ([Currency]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [ItemCode] nvarchar(64) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [ItemName] nvarchar(256) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [Unit] nvarchar(16) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [Contacts] ADD [Code] nvarchar(32) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [Code] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    CREATE INDEX [IX_Payments_LinkedInvoiceId] ON [Payments] ([LinkedInvoiceId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    CREATE INDEX [IX_Invoices_Type] ON [Invoices] ([Type]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    CREATE INDEX [IX_InvoiceLines_ItemId] ON [InvoiceLines] ([ItemId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Contacts_Code] ON [Contacts] ([Code]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD CONSTRAINT [FK_InvoiceLines_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD CONSTRAINT [FK_InvoiceLines_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [Invoices] ADD CONSTRAINT [FK_Invoices_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_CashBankAccounts_AccountId] FOREIGN KEY ([AccountId]) REFERENCES [CashBankAccounts] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_Invoices_LinkedInvoiceId] FOREIGN KEY ([LinkedInvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101191526_AddCodeFieldToEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251101191526_AddCodeFieldToEntities', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101195322_CorrectMaxLengths'
)
BEGIN
    DROP INDEX [IX_Items_Name] ON [Items];
    DECLARE @var7 sysname;
    SELECT @var7 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'Name');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var7 + '];');
    ALTER TABLE [Items] ALTER COLUMN [Name] nvarchar(256) NOT NULL;
    CREATE INDEX [IX_Items_Name] ON [Items] ([Name]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101195322_CorrectMaxLengths'
)
BEGIN
    DECLARE @var8 sysname;
    SELECT @var8 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'Code');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var8 + '];');
    ALTER TABLE [Items] ALTER COLUMN [Code] nvarchar(64) NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101195322_CorrectMaxLengths'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Items_Code] ON [Items] ([Code]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251101195322_CorrectMaxLengths'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251101195322_CorrectMaxLengths', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115082255_AddExpenseDefinitionEntity'
)
BEGIN
    CREATE TABLE [ExpenseDefinitions] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(32) NOT NULL,
        [Name] nvarchar(128) NOT NULL,
        [DefaultVatRate] int NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_ExpenseDefinitions] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_ExpenseDef_VatRange] CHECK ([DefaultVatRate] BETWEEN 0 AND 100)
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115082255_AddExpenseDefinitionEntity'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ExpenseDefinitions_Code] ON [ExpenseDefinitions] ([Code]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115082255_AddExpenseDefinitionEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251115082255_AddExpenseDefinitionEntity', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251122200706_AddFixedAssets'
)
BEGIN
    CREATE TABLE [FixedAssets] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(32) NOT NULL,
        [Name] nvarchar(128) NOT NULL,
        [PurchaseDateUtc] datetime2 NOT NULL,
        [PurchasePrice] decimal(18,2) NOT NULL,
        [UsefulLifeYears] int NOT NULL,
        [DepreciationRatePercent] decimal(9,4) NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_FixedAssets] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_FixedAssets_DepRate] CHECK ([DepreciationRatePercent] >= 0 AND [DepreciationRatePercent] <= 100),
        CONSTRAINT [CK_FixedAssets_UsefulLife] CHECK ([UsefulLifeYears] >= 1 AND [UsefulLifeYears] <= 100)
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251122200706_AddFixedAssets'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FixedAssets_Code] ON [FixedAssets] ([Code]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251122200706_AddFixedAssets'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251122200706_AddFixedAssets', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129133213_AddBranchEntity'
)
BEGIN
    CREATE TABLE [Branches] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(32) NOT NULL,
        [Name] nvarchar(128) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Branches] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129133213_AddBranchEntity'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Branches_Code] ON [Branches] ([Code]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129133213_AddBranchEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251129133213_AddBranchEntity', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129142829_AddBranchRelationToInvoiceEntity'
)
BEGIN
    ALTER TABLE [Invoices] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129142829_AddBranchRelationToInvoiceEntity'
)
BEGIN
    CREATE INDEX [IX_Invoices_BranchId] ON [Invoices] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129142829_AddBranchRelationToInvoiceEntity'
)
BEGIN
    ALTER TABLE [Invoices] ADD CONSTRAINT [FK_Invoices_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129142829_AddBranchRelationToInvoiceEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251129142829_AddBranchRelationToInvoiceEntity', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129171255_AddBranchToExpenseListEntity'
)
BEGIN
    ALTER TABLE [ExpenseLists] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129171255_AddBranchToExpenseListEntity'
)
BEGIN
    CREATE INDEX [IX_ExpenseLists_BranchId] ON [ExpenseLists] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129171255_AddBranchToExpenseListEntity'
)
BEGIN
    ALTER TABLE [ExpenseLists] ADD CONSTRAINT [FK_ExpenseLists_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251129171255_AddBranchToExpenseListEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251129171255_AddBranchToExpenseListEntity', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [Payments] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [Items] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [FixedAssets] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [Contacts] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    CREATE INDEX [IX_Payments_BranchId] ON [Payments] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    CREATE INDEX [IX_Items_BranchId] ON [Items] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    CREATE INDEX [IX_FixedAssets_BranchId] ON [FixedAssets] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    CREATE INDEX [IX_Contacts_BranchId] ON [Contacts] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    CREATE INDEX [IX_CashBankAccounts_BranchId] ON [CashBankAccounts] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD CONSTRAINT [FK_CashBankAccounts_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [Contacts] ADD CONSTRAINT [FK_Contacts_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [FixedAssets] ADD CONSTRAINT [FK_FixedAssets_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260102194441_AddBranchToAllEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260102194441_AddBranchToAllEntities', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260103125627_AddInvoiceBalance'
)
BEGIN
    ALTER TABLE [Invoices] ADD [Balance] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260103125627_AddInvoiceBalance'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260103125627_AddInvoiceBalance', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104132525_RenameExpenseToExpenseLine'
)
BEGIN
    DROP TABLE [Expenses];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104132525_RenameExpenseToExpenseLine'
)
BEGIN
    CREATE TABLE [ExpenseLines] (
        [Id] int NOT NULL IDENTITY,
        [ExpenseListId] int NOT NULL,
        [DateUtc] datetime2 NOT NULL,
        [SupplierId] int NULL,
        [Currency] nvarchar(3) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [VatRate] int NOT NULL,
        [Category] nvarchar(100) NULL,
        [Notes] nvarchar(500) NULL,
        [PostedInvoiceId] int NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_ExpenseLines] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_ExpenseLine_VatRate_Range] CHECK ([VatRate] BETWEEN 0 AND 100),
        CONSTRAINT [FK_ExpenseLines_ExpenseLists_ExpenseListId] FOREIGN KEY ([ExpenseListId]) REFERENCES [ExpenseLists] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104132525_RenameExpenseToExpenseLine'
)
BEGIN
    CREATE INDEX [IX_ExpenseLines_DateUtc] ON [ExpenseLines] ([DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104132525_RenameExpenseToExpenseLine'
)
BEGIN
    CREATE INDEX [IX_ExpenseLines_ExpenseListId] ON [ExpenseLines] ([ExpenseListId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104132525_RenameExpenseToExpenseLine'
)
BEGIN
    CREATE INDEX [IX_ExpenseLines_SupplierId_DateUtc] ON [ExpenseLines] ([SupplierId], [DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104132525_RenameExpenseToExpenseLine'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260104132525_RenameExpenseToExpenseLine', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE TABLE [Warehouses] (
        [Id] int NOT NULL IDENTITY,
        [BranchId] int NOT NULL,
        [Code] nvarchar(64) NOT NULL,
        [Name] nvarchar(256) NOT NULL,
        [IsDefault] bit NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Warehouses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Warehouses_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE TABLE [StockMovements] (
        [Id] int NOT NULL IDENTITY,
        [BranchId] int NOT NULL,
        [WarehouseId] int NOT NULL,
        [ItemId] int NOT NULL,
        [Type] int NOT NULL,
        [Quantity] decimal(18,3) NOT NULL,
        [TransactionDateUtc] datetime2 NOT NULL,
        [Note] nvarchar(500) NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_StockMovements] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_StockMovements_Quantity_Positive] CHECK ([Quantity] > 0),
        CONSTRAINT [FK_StockMovements_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_StockMovements_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_StockMovements_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE TABLE [Stocks] (
        [Id] int NOT NULL IDENTITY,
        [BranchId] int NOT NULL,
        [WarehouseId] int NOT NULL,
        [ItemId] int NOT NULL,
        [Quantity] decimal(18,3) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Stocks] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Stocks_Quantity_NonNegative] CHECK ([Quantity] >= 0),
        CONSTRAINT [FK_Stocks_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Stocks_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Stocks_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE INDEX [IX_StockMovements_BranchId] ON [StockMovements] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE INDEX [IX_StockMovements_ItemId] ON [StockMovements] ([ItemId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE INDEX [IX_StockMovements_TransactionDateUtc] ON [StockMovements] ([TransactionDateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE INDEX [IX_StockMovements_WarehouseId] ON [StockMovements] ([WarehouseId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE INDEX [IX_Stocks_ItemId] ON [Stocks] ([ItemId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE INDEX [IX_Stocks_WarehouseId] ON [Stocks] ([WarehouseId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Stocks_Branch_Warehouse_Item] ON [Stocks] ([BranchId], [WarehouseId], [ItemId]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    CREATE INDEX [IX_Warehouses_BranchId] ON [Warehouses] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Warehouses_Branch_Code] ON [Warehouses] ([BranchId], [Code]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260104153732_StockModule_MvpCore'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260104153732_StockModule_MvpCore', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260105210841_AddExpenseInvoiceSupport'
)
BEGIN
    ALTER TABLE [InvoiceLines] DROP CONSTRAINT [FK_InvoiceLines_Items_ItemId];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260105210841_AddExpenseInvoiceSupport'
)
BEGIN
    DECLARE @var9 sysname;
    SELECT @var9 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InvoiceLines]') AND [c].[name] = N'ItemId');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [InvoiceLines] DROP CONSTRAINT [' + @var9 + '];');
    ALTER TABLE [InvoiceLines] ALTER COLUMN [ItemId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260105210841_AddExpenseInvoiceSupport'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [ExpenseDefinitionId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260105210841_AddExpenseInvoiceSupport'
)
BEGIN
    CREATE INDEX [IX_InvoiceLines_ExpenseDefinitionId] ON [InvoiceLines] ([ExpenseDefinitionId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260105210841_AddExpenseInvoiceSupport'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD CONSTRAINT [FK_InvoiceLines_ExpenseDefinitions_ExpenseDefinitionId] FOREIGN KEY ([ExpenseDefinitionId]) REFERENCES [ExpenseDefinitions] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260105210841_AddExpenseInvoiceSupport'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD CONSTRAINT [FK_InvoiceLines_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260105210841_AddExpenseInvoiceSupport'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260105210841_AddExpenseInvoiceSupport', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    DROP INDEX [IX_ExpenseDefinitions_Code] ON [ExpenseDefinitions];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    ALTER TABLE [ExpenseDefinitions] ADD [BranchId] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    ALTER TABLE [ExpenseDefinitions] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    ALTER TABLE [ExpenseDefinitions] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ExpenseDefinitions_BranchId_Code] ON [ExpenseDefinitions] ([BranchId], [Code]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    ALTER TABLE [ExpenseDefinitions] ADD CONSTRAINT [FK_ExpenseDefinitions_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260106191413_AddSoftDeleteToExpenseDefAndInvoiceLine', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107184740_AddItemCategories'
)
BEGIN
    ALTER TABLE [Items] ADD [CategoryId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107184740_AddItemCategories'
)
BEGIN
    CREATE TABLE [Categories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [Color] nvarchar(7) NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107184740_AddItemCategories'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_StockMovements_Note] ON [StockMovements] ([Note]) WHERE [Note] IS NOT NULL');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107184740_AddItemCategories'
)
BEGIN
    CREATE INDEX [IX_Items_CategoryId] ON [Items] ([CategoryId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107184740_AddItemCategories'
)
BEGIN
    CREATE INDEX [IX_Categories_Name] ON [Categories] ([Name]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107184740_AddItemCategories'
)
BEGIN
    ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107184740_AddItemCategories'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260107184740_AddItemCategories', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    ALTER TABLE [Invoices] ADD [InvoiceNumber] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    ALTER TABLE [Invoices] ADD [OrderId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    CREATE TABLE [Orders] (
        [Id] int NOT NULL IDENTITY,
        [BranchId] int NOT NULL,
        [ContactId] int NOT NULL,
        [OrderNumber] nvarchar(20) NOT NULL,
        [DateUtc] datetime2 NOT NULL,
        [Type] int NOT NULL,
        [Status] int NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [Description] nvarchar(200) NULL,
        [TotalNet] decimal(18,2) NOT NULL,
        [TotalVat] decimal(18,2) NOT NULL,
        [TotalGross] decimal(18,2) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Orders_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Orders_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    CREATE TABLE [OrderLines] (
        [Id] int NOT NULL IDENTITY,
        [OrderId] int NOT NULL,
        [ItemId] int NULL,
        [Description] nvarchar(200) NOT NULL,
        [Quantity] decimal(18,3) NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [VatRate] int NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_OrderLines] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderLines_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_OrderLines_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    CREATE INDEX [IX_OrderLines_ItemId] ON [OrderLines] ([ItemId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    CREATE INDEX [IX_OrderLines_OrderId] ON [OrderLines] ([OrderId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    CREATE INDEX [IX_Orders_BranchId] ON [Orders] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    CREATE INDEX [IX_Orders_ContactId] ON [Orders] ([ContactId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Orders_OrderNumber] ON [Orders] ([OrderNumber]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107190855_AddOrderManagement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260107190855_AddOrderManagement', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    DROP INDEX [IX_Orders_OrderNumber] ON [Orders];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    ALTER TABLE [OrderLines] ADD [DeletedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    ALTER TABLE [OrderLines] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Orders_BranchId_Type_OrderNumber] ON [Orders] ([BranchId], [Type], [OrderNumber]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    CREATE INDEX [IX_Orders_DateUtc] ON [Orders] ([DateUtc]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    CREATE INDEX [IX_Orders_Status] ON [Orders] ([Status]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    CREATE INDEX [IX_Invoices_OrderId] ON [Invoices] ([OrderId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    ALTER TABLE [Invoices] ADD CONSTRAINT [FK_Invoices_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107194011_OrderAndInvoiceFixes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260107194011_OrderAndInvoiceFixes', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107200347_AddInvoiceNumber'
)
BEGIN
    DECLARE @var10 sysname;
    SELECT @var10 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Invoices]') AND [c].[name] = N'InvoiceNumber');
    IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [Invoices] DROP CONSTRAINT [' + @var10 + '];');
    ALTER TABLE [Invoices] ALTER COLUMN [InvoiceNumber] nvarchar(50) NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107200347_AddInvoiceNumber'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260107200347_AddInvoiceNumber', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260107202837_AddItemCategoryIdIndex'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260107202837_AddItemCategoryIdIndex', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260109212810_AddAccountBalance'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [Balance] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260109212810_AddAccountBalance'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260109212810_AddAccountBalance', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260109224618_AddChequeEntity'
)
BEGIN
    CREATE TABLE [Cheques] (
        [Id] int NOT NULL IDENTITY,
        [BranchId] int NOT NULL,
        [ContactId] int NULL,
        [Type] int NOT NULL,
        [Direction] int NOT NULL,
        [Status] int NOT NULL,
        [ChequeNumber] nvarchar(50) NOT NULL,
        [IssueDate] datetime2 NOT NULL,
        [DueDate] datetime2 NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Currency] nvarchar(max) NOT NULL,
        [BankName] nvarchar(max) NULL,
        [BankBranch] nvarchar(max) NULL,
        [AccountNumber] nvarchar(max) NULL,
        [DrawerName] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Cheques] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Cheques_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Cheques_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260109224618_AddChequeEntity'
)
BEGIN
    CREATE INDEX [IX_Cheques_BranchId] ON [Cheques] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260109224618_AddChequeEntity'
)
BEGIN
    CREATE INDEX [IX_Cheques_ContactId] ON [Cheques] ([ContactId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260109224618_AddChequeEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260109224618_AddChequeEntity', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110104749_AddStockMovementInvoiceId'
)
BEGIN
    ALTER TABLE [StockMovements] ADD [InvoiceId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110104749_AddStockMovementInvoiceId'
)
BEGIN
    CREATE INDEX [IX_StockMovements_InvoiceId] ON [StockMovements] ([InvoiceId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110104749_AddStockMovementInvoiceId'
)
BEGIN
    ALTER TABLE [StockMovements] ADD CONSTRAINT [FK_StockMovements_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE SET NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110104749_AddStockMovementInvoiceId'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110104749_AddStockMovementInvoiceId', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    DECLARE @var11 sysname;
    SELECT @var11 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'DrawerName');
    IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var11 + '];');
    ALTER TABLE [Cheques] ALTER COLUMN [DrawerName] nvarchar(200) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    DECLARE @var12 sysname;
    SELECT @var12 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'Description');
    IF @var12 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var12 + '];');
    ALTER TABLE [Cheques] ALTER COLUMN [Description] nvarchar(500) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    DECLARE @var13 sysname;
    SELECT @var13 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'Currency');
    IF @var13 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var13 + '];');
    ALTER TABLE [Cheques] ALTER COLUMN [Currency] nvarchar(3) NOT NULL;
    ALTER TABLE [Cheques] ADD DEFAULT N'TRY' FOR [Currency];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    DECLARE @var14 sysname;
    SELECT @var14 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'CreatedAtUtc');
    IF @var14 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var14 + '];');
    ALTER TABLE [Cheques] ADD DEFAULT (GETUTCDATE()) FOR [CreatedAtUtc];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    DECLARE @var15 sysname;
    SELECT @var15 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'BankName');
    IF @var15 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var15 + '];');
    ALTER TABLE [Cheques] ALTER COLUMN [BankName] nvarchar(100) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    DECLARE @var16 sysname;
    SELECT @var16 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'BankBranch');
    IF @var16 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var16 + '];');
    ALTER TABLE [Cheques] ALTER COLUMN [BankBranch] nvarchar(100) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    DECLARE @var17 sysname;
    SELECT @var17 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'AccountNumber');
    IF @var17 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var17 + '];');
    ALTER TABLE [Cheques] ALTER COLUMN [AccountNumber] nvarchar(50) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Cheques_BranchId_ChequeNumber_Unique] ON [Cheques] ([BranchId], [ChequeNumber]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    CREATE INDEX [IX_Cheques_DueDate] ON [Cheques] ([DueDate]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    CREATE INDEX [IX_Cheques_Status] ON [Cheques] ([Status]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110110801_AddChequeIndexes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110110801_AddChequeIndexes', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110112502_AddPaymentChequeId'
)
BEGIN
    ALTER TABLE [Payments] ADD [ChequeId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110112502_AddPaymentChequeId'
)
BEGIN
    CREATE INDEX [IX_Payments_ChequeId] ON [Payments] ([ChequeId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110112502_AddPaymentChequeId'
)
BEGIN
    ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_Cheques_ChequeId] FOREIGN KEY ([ChequeId]) REFERENCES [Cheques] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110112502_AddPaymentChequeId'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110112502_AddPaymentChequeId', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110115602_SeparatePricesToItems'
)
BEGIN
    EXEC sp_rename N'[Items].[DefaultUnitPrice]', N'SalesPrice', N'COLUMN';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110115602_SeparatePricesToItems'
)
BEGIN
    ALTER TABLE [Items] ADD [PurchasePrice] decimal(18,4) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110115602_SeparatePricesToItems'
)
BEGIN
    ALTER TABLE [CashBankAccounts] ADD [Currency] nvarchar(3) NOT NULL DEFAULT N'';
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110115602_SeparatePricesToItems'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110115602_SeparatePricesToItems', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110131312_AddCompanySettings'
)
BEGIN
    CREATE TABLE [CompanySettings] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [TaxNumber] nvarchar(20) NULL,
        [TaxOffice] nvarchar(100) NULL,
        [Address] nvarchar(max) NULL,
        [Phone] nvarchar(20) NULL,
        [Email] nvarchar(100) NULL,
        [Website] nvarchar(100) NULL,
        [TradeRegisterNo] nvarchar(50) NULL,
        [MersisNo] nvarchar(50) NULL,
        [LogoUrl] nvarchar(500) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_CompanySettings] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110131312_AddCompanySettings'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110131312_AddCompanySettings', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    ALTER TABLE [Orders] ADD [CreatedByUserId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(50) NOT NULL,
        [Description] nvarchar(200) NULL,
        [IsStatic] bit NOT NULL,
        [Permissions] nvarchar(max) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [FirstName] nvarchar(50) NOT NULL,
        [LastName] nvarchar(50) NOT NULL,
        [Email] nvarchar(100) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [RefreshToken] nvarchar(max) NULL,
        [RefreshTokenExpiryTime] datetime2 NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    CREATE TABLE [UserRoles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [RoleId] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    CREATE INDEX [IX_Orders_CreatedByUserId] ON [Orders] ([CreatedByUserId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserRoles_UserId_RoleId] ON [UserRoles] ([UserId], [RoleId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    ALTER TABLE [Orders] ADD CONSTRAINT [FK_Orders_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110195328_AddIdentity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110195328_AddIdentity', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110200857_AddRolePermissions'
)
BEGIN
    DECLARE @var18 sysname;
    SELECT @var18 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Roles]') AND [c].[name] = N'Permissions');
    IF @var18 IS NOT NULL EXEC(N'ALTER TABLE [Roles] DROP CONSTRAINT [' + @var18 + '];');
    ALTER TABLE [Roles] DROP COLUMN [Permissions];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110200857_AddRolePermissions'
)
BEGIN
    CREATE TABLE [RolePermissions] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] int NOT NULL,
        [Permission] nvarchar(150) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RolePermissions_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110200857_AddRolePermissions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RolePermissions_RoleId_Permission] ON [RolePermissions] ([RoleId], [Permission]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110200857_AddRolePermissions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110200857_AddRolePermissions', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110204039_AddBranchIdToUser'
)
BEGIN
    ALTER TABLE [Users] ADD [BranchId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110204039_AddBranchIdToUser'
)
BEGIN
    CREATE INDEX [IX_Users_BranchId] ON [Users] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110204039_AddBranchIdToUser'
)
BEGIN
    ALTER TABLE [Users] ADD CONSTRAINT [FK_Users_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260110204039_AddBranchIdToUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260110204039_AddBranchIdToUser', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    DROP INDEX [IX_Contacts_Type_Name] ON [Contacts];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    DECLARE @var19 sysname;
    SELECT @var19 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'TaxNo');
    IF @var19 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var19 + '];');
    ALTER TABLE [Contacts] DROP COLUMN [TaxNo];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [Address] nvarchar(500) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [City] nvarchar(max) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [District] nvarchar(max) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [Iban] nvarchar(34) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [IsCustomer] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [IsEmployee] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [IsRetail] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Contacts] ADD [IsVendor] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    ALTER TABLE [Branches] ADD [IsHeadquarters] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    CREATE TABLE [AuditTrails] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NULL,
        [Action] nvarchar(20) NULL,
        [EntityName] nvarchar(100) NULL,
        [PrimaryKey] nvarchar(100) NULL,
        [OldValues] nvarchar(max) NULL,
        [NewValues] nvarchar(max) NULL,
        [TimestampUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditTrails] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    CREATE TABLE [CompanyDetails] (
        [ContactId] int NOT NULL,
        [TaxNumber] nvarchar(10) NULL,
        [TaxOffice] nvarchar(100) NULL,
        [MersisNo] nvarchar(20) NULL,
        [TicaretSicilNo] nvarchar(20) NULL,
        CONSTRAINT [PK_CompanyDetails] PRIMARY KEY ([ContactId]),
        CONSTRAINT [FK_CompanyDetails_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    CREATE TABLE [PersonDetails] (
        [ContactId] int NOT NULL,
        [Tckn] nvarchar(11) NULL,
        [FirstName] nvarchar(100) NOT NULL,
        [LastName] nvarchar(100) NOT NULL,
        [Title] nvarchar(100) NULL,
        [Department] nvarchar(100) NULL,
        CONSTRAINT [PK_PersonDetails] PRIMARY KEY ([ContactId]),
        CONSTRAINT [FK_PersonDetails_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    CREATE INDEX [IX_Contacts_IsCustomer] ON [Contacts] ([IsCustomer]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    CREATE INDEX [IX_Contacts_IsEmployee] ON [Contacts] ([IsEmployee]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    CREATE INDEX [IX_Contacts_IsVendor] ON [Contacts] ([IsVendor]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111131255_RefactorContactsUnifiedModel'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260111131255_RefactorContactsUnifiedModel', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111135143_RefactorContacts_FinalCleanup'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260111135143_RefactorContacts_FinalCleanup', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111151326_RefactorContacts_RemoveType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260111151326_RefactorContacts_RemoveType', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111162724_RemoveContactType'
)
BEGIN
    DROP INDEX [IX_Contacts_Type] ON [Contacts];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111162724_RemoveContactType'
)
BEGIN
    DECLARE @var20 sysname;
    SELECT @var20 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'Type');
    IF @var20 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var20 + '];');
    ALTER TABLE [Contacts] DROP COLUMN [Type];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111162724_RemoveContactType'
)
BEGIN
    DECLARE @var21 sysname;
    SELECT @var21 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'District');
    IF @var21 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var21 + '];');
    ALTER TABLE [Contacts] ALTER COLUMN [District] nvarchar(200) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111162724_RemoveContactType'
)
BEGIN
    DECLARE @var22 sysname;
    SELECT @var22 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contacts]') AND [c].[name] = N'City');
    IF @var22 IS NOT NULL EXEC(N'ALTER TABLE [Contacts] DROP CONSTRAINT [' + @var22 + '];');
    ALTER TABLE [Contacts] ALTER COLUMN [City] nvarchar(200) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111162724_RemoveContactType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260111162724_RemoveContactType', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Items] ADD [Type] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Invoices] ADD [CurrencyRate] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Invoices] ADD [PaymentDueDateUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Invoices] ADD [TotalDiscount] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Invoices] ADD [TotalLineGross] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Invoices] ADD [TotalWithholding] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Invoices] ADD [WaybillDateUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [Invoices] ADD [WaybillNumber] nvarchar(max) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [DiscountAmount] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [DiscountRate] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [GrandTotal] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [WithholdingAmount] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [WithholdingRate] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111163906_EnhancedInvoiceSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260111163906_EnhancedInvoiceSchema', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111172229_ApplyOpusFeedback'
)
BEGIN
    DECLARE @var23 sysname;
    SELECT @var23 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Invoices]') AND [c].[name] = N'WaybillNumber');
    IF @var23 IS NOT NULL EXEC(N'ALTER TABLE [Invoices] DROP CONSTRAINT [' + @var23 + '];');
    ALTER TABLE [Invoices] ALTER COLUMN [WaybillNumber] nvarchar(50) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111172229_ApplyOpusFeedback'
)
BEGIN
    DECLARE @var24 sysname;
    SELECT @var24 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Invoices]') AND [c].[name] = N'CurrencyRate');
    IF @var24 IS NOT NULL EXEC(N'ALTER TABLE [Invoices] DROP CONSTRAINT [' + @var24 + '];');
    ALTER TABLE [Invoices] ALTER COLUMN [CurrencyRate] decimal(18,4) NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260111172229_ApplyOpusFeedback'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260111172229_ApplyOpusFeedback', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260113165649_AddItemDefaultWithholdingRate'
)
BEGIN
    ALTER TABLE [Items] ADD [DefaultWithholdingRate] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260113165649_AddItemDefaultWithholdingRate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260113165649_AddItemDefaultWithholdingRate', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117085026_AddDescriptionToPayment'
)
BEGIN
    ALTER TABLE [Payments] ADD [Description] nvarchar(200) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260117085026_AddDescriptionToPayment'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260117085026_AddDescriptionToPayment', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    ALTER TABLE [InvoiceLines] DROP CONSTRAINT [FK_InvoiceLines_ExpenseDefinitions_ExpenseDefinitionId];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    DROP TABLE [ExpenseDefinitions];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    DROP TABLE [ExpenseLines];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    DROP TABLE [FixedAssets];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    DROP TABLE [ExpenseLists];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    DROP INDEX [IX_InvoiceLines_ExpenseDefinitionId] ON [InvoiceLines];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    DECLARE @var25 sysname;
    SELECT @var25 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InvoiceLines]') AND [c].[name] = N'ExpenseDefinitionId');
    IF @var25 IS NOT NULL EXEC(N'ALTER TABLE [InvoiceLines] DROP CONSTRAINT [' + @var25 + '];');
    ALTER TABLE [InvoiceLines] DROP COLUMN [ExpenseDefinitionId];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    ALTER TABLE [Items] ADD [PurchaseAccountCode] nvarchar(16) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    ALTER TABLE [Items] ADD [SalesAccountCode] nvarchar(16) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    ALTER TABLE [Items] ADD [UsefulLifeYears] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    ALTER TABLE [Invoices] ADD [DocumentType] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260118162909_ConsolidateExpensesAndFixedAssetsIntoItems', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118193721_AddAccountCodeToInvoiceLine'
)
BEGIN
    ALTER TABLE [InvoiceLines] ADD [AccountCode] nvarchar(16) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118193721_AddAccountCodeToInvoiceLine'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260118193721_AddAccountCodeToInvoiceLine', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    ALTER TABLE [Items] DROP CONSTRAINT [FK_Items_Branches_BranchId];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    DROP INDEX [IX_Items_BranchId] ON [Items];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    DROP INDEX [IX_Items_Name] ON [Items];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    DROP INDEX [UX_Items_Code] ON [Items];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    DECLARE @var26 sysname;
    SELECT @var26 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'BranchId');
    IF @var26 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var26 + '];');
    ALTER TABLE [Items] DROP COLUMN [BranchId];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    DECLARE @var27 sysname;
    SELECT @var27 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'IsDeleted');
    IF @var27 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var27 + '];');
    ALTER TABLE [Items] ADD DEFAULT CAST(0 AS bit) FOR [IsDeleted];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Items_Code] ON [Items] ([Code]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    EXEC(N'ALTER TABLE [Items] ADD CONSTRAINT [CK_Item_PurchasePrice_Positive] CHECK ([PurchasePrice] IS NULL OR [PurchasePrice] >= 0)');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    EXEC(N'ALTER TABLE [Items] ADD CONSTRAINT [CK_Item_SalesPrice_Positive] CHECK ([SalesPrice] IS NULL OR [SalesPrice] >= 0)');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260118200140_MakeItemsGlobal'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260118200140_MakeItemsGlobal', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810013824_AddUserRoleSoftDeleteFilters'
)
BEGIN
    DROP INDEX [IX_Users_Email] ON [Users];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810013824_AddUserRoleSoftDeleteFilters'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810013824_AddUserRoleSoftDeleteFilters'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260810013824_AddUserRoleSoftDeleteFilters', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014000000_UseIranianRialDefault'
)
BEGIN
    DECLARE @var28 sysname;
    SELECT @var28 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Cheques]') AND [c].[name] = N'Currency');
    IF @var28 IS NOT NULL EXEC(N'ALTER TABLE [Cheques] DROP CONSTRAINT [' + @var28 + '];');
    ALTER TABLE [Cheques] ALTER COLUMN [Currency] nvarchar(3) NOT NULL;
    ALTER TABLE [Cheques] ADD DEFAULT N'IRR' FOR [Currency];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014000000_UseIranianRialDefault'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261014000000_UseIranianRialDefault', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    CREATE TABLE [Units] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(16) NOT NULL,
        [Description] nvarchar(500) NULL,
        [CreatedAtUtc] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Units] PRIMARY KEY ([Id])
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    ALTER TABLE [Items] ADD [UnitId] int NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    EXEC(N'INSERT INTO [Units] ([Name], [IsDeleted])
    SELECT DISTINCT COALESCE(NULLIF(LTRIM(RTRIM([Unit])), N''''), N''عدد''), 0
    FROM [Items];

    UPDATE i SET [UnitId] = u.[Id]
    FROM [Items] AS i
    INNER JOIN [Units] AS u
      ON u.[Name] = COALESCE(NULLIF(LTRIM(RTRIM(i.[Unit])), N''''), N''عدد'');

    IF EXISTS (SELECT 1 FROM [Items] WHERE [UnitId] IS NULL)
        THROW 51000, ''Some item units could not be migrated.'', 1;');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    DECLARE @var29 sysname;
    SELECT @var29 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'UnitId');
    IF @var29 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var29 + '];');
    ALTER TABLE [Items] ALTER COLUMN [UnitId] int NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    DECLARE @var30 sysname;
    SELECT @var30 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'Unit');
    IF @var30 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var30 + '];');
    ALTER TABLE [Items] DROP COLUMN [Unit];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    CREATE INDEX [IX_Items_UnitId] ON [Items] ([UnitId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Units_Name] ON [Units] ([Name]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Units_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [Units] ([Id]) ON DELETE NO ACTION;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    EXEC(N'INSERT INTO [RolePermissions] ([RoleId], [Permission], [CreatedAtUtc])
    SELECT p.[RoleId], REPLACE(p.[Permission], N''Item.'', N''Unit.''), GETUTCDATE()
    FROM [RolePermissions] AS p
    WHERE p.[Permission] IN (N''Item.Read'', N''Item.Create'', N''Item.Update'', N''Item.Delete'')
      AND NOT EXISTS (
        SELECT 1 FROM [RolePermissions] AS existing
        WHERE existing.[RoleId] = p.[RoleId]
          AND existing.[Permission] = REPLACE(p.[Permission], N''Item.'', N''Unit.''));');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261014122520_NormalizeItemUnits', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [Contacts] ADD [NationalId] nvarchar(11) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [Contacts] ADD [PostalCode] nvarchar(10) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [CompanySettings] ADD [NationalId] nvarchar(11) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    ALTER TABLE [CompanySettings] ADD [PostalCode] nvarchar(10) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    DECLARE @var31 sysname;
    SELECT @var31 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CompanyDetails]') AND [c].[name] = N'TaxNumber');
    IF @var31 IS NOT NULL EXEC(N'ALTER TABLE [CompanyDetails] DROP CONSTRAINT [' + @var31 + '];');
    ALTER TABLE [CompanyDetails] ALTER COLUMN [TaxNumber] nvarchar(20) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014133224_AddInvoicePrintIdentity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261014133224_AddInvoicePrintIdentity', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE TABLE [ContactOpeningBalances] (
        [Id] int NOT NULL IDENTITY,
        [BranchId] int NOT NULL,
        [DateUtc] datetime2 NOT NULL,
        [Note] nvarchar(500) NULL,
        [ContactId] int NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [IsDebit] bit NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_ContactOpeningBalances] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_ContactOpening_Amount] CHECK ([Amount] > 0),
        CONSTRAINT [FK_ContactOpeningBalances_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ContactOpeningBalances_Contacts_ContactId] FOREIGN KEY ([ContactId]) REFERENCES [Contacts] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE TABLE [InventoryOpeningBalances] (
        [Id] int NOT NULL IDENTITY,
        [BranchId] int NOT NULL,
        [DateUtc] datetime2 NOT NULL,
        [Note] nvarchar(500) NULL,
        [WarehouseId] int NOT NULL,
        [ItemId] int NOT NULL,
        [Quantity] decimal(18,3) NOT NULL,
        [UnitCost] decimal(18,4) NULL,
        [StockMovementId] int NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_InventoryOpeningBalances] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_InventoryOpening_Cost] CHECK ([UnitCost] IS NULL OR [UnitCost] >= 0),
        CONSTRAINT [CK_InventoryOpening_Quantity] CHECK ([Quantity] > 0),
        CONSTRAINT [FK_InventoryOpeningBalances_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InventoryOpeningBalances_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InventoryOpeningBalances_StockMovements_StockMovementId] FOREIGN KEY ([StockMovementId]) REFERENCES [StockMovements] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InventoryOpeningBalances_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_ContactOpeningBalances_BranchId] ON [ContactOpeningBalances] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ContactOpeningBalances_ContactId] ON [ContactOpeningBalances] ([ContactId]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_InventoryOpeningBalances_BranchId] ON [InventoryOpeningBalances] ([BranchId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_InventoryOpeningBalances_ItemId] ON [InventoryOpeningBalances] ([ItemId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_InventoryOpeningBalances_StockMovementId] ON [InventoryOpeningBalances] ([StockMovementId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_InventoryOpeningBalances_WarehouseId_ItemId] ON [InventoryOpeningBalances] ([WarehouseId], [ItemId]) WHERE [IsDeleted] = 0');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261017031615_AddOpeningBalances', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Stocks] DROP CONSTRAINT [CK_Stocks_Quantity_NonNegative];
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Invoices] ADD [Notes] nvarchar(max) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Branches] ADD [Address] nvarchar(500) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Branches] ADD [LogoDataUrl] nvarchar(max) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    ALTER TABLE [Branches] ADD [Phone] nvarchar(50) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
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

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
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

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    CREATE INDEX [IX_MealPackageLines_ItemId] ON [MealPackageLines] ([ItemId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    CREATE INDEX [IX_MealPackageLines_MealPackageId] ON [MealPackageLines] ([MealPackageId]);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018033924_CateringPackagesAndNormalInvoices'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018033924_CateringPackagesAndNormalInvoices', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    DECLARE @var32 sysname;
    SELECT @var32 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[OrderLines]') AND [c].[name] = N'UnitPrice');
    IF @var32 IS NOT NULL EXEC(N'ALTER TABLE [OrderLines] DROP CONSTRAINT [' + @var32 + '];');
    ALTER TABLE [OrderLines] ALTER COLUMN [UnitPrice] decimal(20,4) NOT NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    ALTER TABLE [OrderLines] ADD [DiscountRate] decimal(5,2) NOT NULL DEFAULT 0.0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    ALTER TABLE [OrderLines] ADD [WithholdingRate] int NOT NULL DEFAULT 0;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    DECLARE @var33 sysname;
    SELECT @var33 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CompanySettings]') AND [c].[name] = N'LogoUrl');
    IF @var33 IS NOT NULL EXEC(N'ALTER TABLE [CompanySettings] DROP CONSTRAINT [' + @var33 + '];');
    ALTER TABLE [CompanySettings] ALTER COLUMN [LogoUrl] nvarchar(max) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    ALTER TABLE [CompanyDetails] ADD [IsPresent] bit NOT NULL DEFAULT CAST(1 AS bit);
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018051123_CateringOrderPackagesAndLogoUploads'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018051123_CateringOrderPackagesAndLogoUploads', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018055818_ContactSubscriptionNumbers'
)
BEGIN
    ALTER TABLE [Contacts] ADD [SubscriptionNumber] nvarchar(32) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018055818_ContactSubscriptionNumbers'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Contacts_SubscriptionNumber] ON [Contacts] ([SubscriptionNumber]) WHERE [SubscriptionNumber] IS NOT NULL');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018055818_ContactSubscriptionNumbers'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018055818_ContactSubscriptionNumbers', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018102009_SoftwareLicenseExpiry'
)
BEGIN
    ALTER TABLE [CompanySettings] ADD [LicenseExpiresAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261018102009_SoftwareLicenseExpiry'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261018102009_SoftwareLicenseExpiry', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
BEGIN TRANSACTION;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020000000_UserSessionTimeouts'
)
BEGIN
    ALTER TABLE [Users] ADD [SessionId] nvarchar(32) NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020000000_UserSessionTimeouts'
)
BEGIN
    ALTER TABLE [Users] ADD [SessionStartedAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020000000_UserSessionTimeouts'
)
BEGIN
    ALTER TABLE [Users] ADD [SessionLastActivityAtUtc] datetime2 NULL;
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261020000000_UserSessionTimeouts'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261020000000_UserSessionTimeouts', N'8.0.19');
END;
GO

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, N'یک دیتابیس خالی مخصوص برنامه انتخاب کنید.', 1;
COMMIT;
GO
