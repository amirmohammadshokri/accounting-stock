BEGIN TRANSACTION;
GO

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

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_ContactOpeningBalances_BranchId] ON [ContactOpeningBalances] ([BranchId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ContactOpeningBalances_ContactId] ON [ContactOpeningBalances] ([ContactId]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_InventoryOpeningBalances_BranchId] ON [InventoryOpeningBalances] ([BranchId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_InventoryOpeningBalances_ItemId] ON [InventoryOpeningBalances] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    CREATE INDEX [IX_InventoryOpeningBalances_StockMovementId] ON [InventoryOpeningBalances] ([StockMovementId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_InventoryOpeningBalances_WarehouseId_ItemId] ON [InventoryOpeningBalances] ([WarehouseId], [ItemId]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261017031615_AddOpeningBalances'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261017031615_AddOpeningBalances', N'8.0.20');
END;
GO

COMMIT;
GO

