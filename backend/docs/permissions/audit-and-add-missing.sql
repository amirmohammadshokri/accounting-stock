-- Run in the intended Accounting database in SSMS. Default: read-only preview.
-- Missing means NOT ASSIGNED; it does not mean every role should get every permission.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() IN (N'master',N'model',N'msdb',N'tempdb')
    THROW 51000, 'Select the application database first.', 1;
DECLARE @RoleId int = NULL; -- Set the target role ID after inspecting the role list.
DECLARE @Apply bit = 0; -- 1 applies ONLY @Requested entries.
DECLARE @Catalog table (Permission nvarchar(150) PRIMARY KEY);
INSERT @Catalog (Permission) VALUES
    (N'Audit.Read'),
    (N'DataMaintenance.Read'),
    (N'DataMaintenance.Reset'),
    (N'Unit.Create'),
    (N'Unit.Read'),
    (N'Unit.Update'),
    (N'Unit.Delete'),
    (N'Invoice.Create'),
    (N'Invoice.Read'),
    (N'Invoice.Update'),
    (N'Invoice.Delete'),
    (N'Payment.Create'),
    (N'Payment.Read'),
    (N'Payment.Update'),
    (N'Payment.Delete'),
    (N'Contact.Create'),
    (N'Contact.Read'),
    (N'Contact.Update'),
    (N'Contact.Delete'),
    (N'Item.Create'),
    (N'Item.Read'),
    (N'Item.Update'),
    (N'Item.Delete'),
    (N'Order.Create'),
    (N'Order.Read'),
    (N'Order.Update'),
    (N'Order.Delete'),
    (N'Order.Approve'),
    (N'Order.Cancel'),
    (N'Order.CreateInvoice'),
    (N'Stock.Read'),
    (N'Stock.Transfer'),
    (N'StockMovement.Create'),
    (N'StockMovement.Read'),
    (N'Warehouse.Create'),
    (N'Warehouse.Read'),
    (N'Warehouse.Update'),
    (N'Warehouse.Delete'),
    (N'CashBankAccount.Create'),
    (N'CashBankAccount.Read'),
    (N'CashBankAccount.Update'),
    (N'CashBankAccount.Delete'),
    (N'Cheque.Create'),
    (N'Cheque.Read'),
    (N'Cheque.Update'),
    (N'Cheque.Delete'),
    (N'Cheque.UpdateStatus'),
    (N'Category.Create'),
    (N'Category.Read'),
    (N'Category.Update'),
    (N'Category.Delete'),
    (N'Branch.Create'),
    (N'Branch.Read'),
    (N'Branch.Update'),
    (N'Branch.Delete'),
    (N'User.Create'),
    (N'User.Read'),
    (N'User.Update'),
    (N'User.Delete'),
    (N'Role.Create'),
    (N'Role.Read'),
    (N'Role.Update'),
    (N'Role.Delete'),
    (N'Report.Dashboard'),
    (N'Report.ProfitLoss'),
    (N'Report.ContactStatement'),
    (N'Report.StockStatus'),
    (N'CompanySettings.Read'),
    (N'CompanySettings.Update');
DECLARE @Requested table (Permission nvarchar(150) PRIMARY KEY);
-- Explicitly select permissions to add, for example:
-- INSERT @Requested VALUES (N'Unit.Read');
SELECT Id,Name,IsStatic FROM dbo.Roles WHERE IsDeleted=0 ORDER BY Id;
-- Effective user permissions are the UNION of their active roles.
SELECT u.Id UserId,u.Email,r.Id RoleId,r.Name RoleName,rp.Permission
FROM dbo.Users u JOIN dbo.UserRoles ur ON ur.UserId=u.Id
JOIN dbo.Roles r ON r.Id=ur.RoleId AND r.IsDeleted=0
LEFT JOIN dbo.RolePermissions rp ON rp.RoleId=r.Id
WHERE u.IsDeleted=0 ORDER BY u.Id,r.Id,rp.Permission;
SELECT rp.RoleId,rp.Permission UnknownPermission FROM dbo.RolePermissions rp
WHERE NOT EXISTS (SELECT 1 FROM @Catalog c WHERE c.Permission COLLATE Latin1_General_100_BIN2=rp.Permission COLLATE Latin1_General_100_BIN2);
IF @RoleId IS NULL
BEGIN
    IF @Apply=1 THROW 51001, 'Set @RoleId before applying.', 1;
    RETURN;
END;
IF NOT EXISTS(SELECT 1 FROM dbo.Roles WHERE Id=@RoleId AND IsDeleted=0)
    THROW 51002, 'Target role does not exist or is deleted.', 1;
-- An individual SQL statement for EACH missing permission.
SELECT c.Permission MissingPermission,
    N'INSERT INTO dbo.RolePermissions(RoleId,Permission,CreatedAtUtc,UpdatedAtUtc) SELECT '
    +CONVERT(nvarchar(20),@RoleId)+N',N'''+c.Permission+N''',SYSUTCDATETIME(),NULL WHERE NOT EXISTS (SELECT 1 FROM dbo.RolePermissions WHERE RoleId='
    +CONVERT(nvarchar(20),@RoleId)+N' AND Permission=N'''+c.Permission+N''');' AS SuggestedSql
FROM @Catalog c WHERE NOT EXISTS(SELECT 1 FROM dbo.RolePermissions rp WHERE rp.RoleId=@RoleId AND rp.Permission=c.Permission)
ORDER BY c.Permission;
IF EXISTS(SELECT 1 FROM @Requested r WHERE NOT EXISTS(SELECT 1 FROM @Catalog c WHERE c.Permission COLLATE Latin1_General_100_BIN2=r.Permission COLLATE Latin1_General_100_BIN2))
    THROW 51003, 'Requested permission is not in the catalog.', 1;
SELECT r.Permission,CASE WHEN rp.Id IS NULL THEN N'Will add' ELSE N'Already assigned' END Action
FROM @Requested r LEFT JOIN dbo.RolePermissions rp ON rp.RoleId=@RoleId AND rp.Permission=r.Permission;
IF @Apply=1
BEGIN
    BEGIN TRANSACTION;
    INSERT dbo.RolePermissions(RoleId,Permission,CreatedAtUtc,UpdatedAtUtc)
    SELECT @RoleId,r.Permission,SYSUTCDATETIME(),NULL FROM @Requested r
    WHERE NOT EXISTS(SELECT 1 FROM dbo.RolePermissions rp WITH(UPDLOCK,HOLDLOCK) WHERE rp.RoleId=@RoleId AND rp.Permission=r.Permission);
    COMMIT;
END;
-- Sign out and sign in again after changes; existing JWT claims are snapshots.
