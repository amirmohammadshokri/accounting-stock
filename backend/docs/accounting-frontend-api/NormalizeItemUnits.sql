-- SQL Server: normalize Items.Unit into Units and Items.UnitId.
-- Existing Accounting database; executes no other pending migrations.
-- Generated from 20261014122520_NormalizeItemUnits, wrapped for atomic error handling.
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;

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

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    ALTER TABLE [Items] ADD [UnitId] int NULL;
END;

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

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'UnitId');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Items] ALTER COLUMN [UnitId] int NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'Unit');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [Items] DROP COLUMN [Unit];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    CREATE INDEX [IX_Items_UnitId] ON [Items] ([UnitId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Units_Name] ON [Units] ([Name]) WHERE [IsDeleted] = 0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Units_UnitId] FOREIGN KEY ([UnitId]) REFERENCES [Units] ([Id]) ON DELETE NO ACTION;
END;

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

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261014122520_NormalizeItemUnits'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261014122520_NormalizeItemUnits', N'8.0.20');
END;

COMMIT;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
