BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    ALTER TABLE [AuditTrails] ADD [BranchId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    CREATE INDEX [IX_AuditTrails_BranchId] ON [AuditTrails] ([BranchId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    DROP INDEX [IX_ContactOpeningBalances_BranchId] ON [ContactOpeningBalances];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    DROP INDEX [IX_ContactOpeningBalances_ContactId] ON [ContactOpeningBalances];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    CREATE TABLE [UserBranches] (
        [UserId] int NOT NULL,
        [BranchId] int NOT NULL,
        CONSTRAINT [PK_UserBranches] PRIMARY KEY ([UserId], [BranchId]),
        CONSTRAINT [FK_UserBranches_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_UserBranches_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ContactOpeningBalances_BranchId_ContactId] ON [ContactOpeningBalances] ([BranchId], [ContactId]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    CREATE INDEX [IX_ContactOpeningBalances_ContactId] ON [ContactOpeningBalances] ([ContactId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    CREATE INDEX [IX_UserBranches_BranchId] ON [UserBranches] ([BranchId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102034520_ActiveBranchWorkspace'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261102034520_ActiveBranchWorkspace', N'8.0.20');
END;
GO

COMMIT;
GO

