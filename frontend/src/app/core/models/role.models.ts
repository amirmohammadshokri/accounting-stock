/**
 * Role Models (Roller)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Roles.Queries.Dto.RoleDto
 */

// ============================================================================
// DTOs - READ (GET/LIST)
// ============================================================================

/**
 * Role List Item DTO (Read)
 * Backend: RoleListItemDto
 */
export interface RoleListItemDto {
  id: number;
  name: string;
  description?: string | null;
  permissionCount: number;
}

/**
 * Role Detail DTO (Read)
 * Backend: RoleDetailDto
 */
export interface RoleDetailDto {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];            // Permission names (örn: "Invoice.Create")
}

// ============================================================================
// COMMAND BODIES - WRITE (CREATE/UPDATE)
// ============================================================================

/**
 * Create Role Body
 * Backend: CreateRoleCommand
 */
export interface CreateRoleBody {
  name: string;
  description?: string | null;
  permissions: string[];            // Permission names to assign
}

/**
 * Update Role Body
 * Backend: UpdateRoleCommand
 */
export interface UpdateRoleBody {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];            // Permission names to assign
}

// ============================================================================
// PERMISSION CATALOG
// Backend: Accounting.Domain.Constants.Permissions.GetAll() — no list endpoint
// exists, so this must be kept in sync with Permissions.cs by hand.
// ============================================================================

export interface PermissionGroup {
  label: string;
  permissions: string[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  { label: 'سوابق فعالیت', permissions: ['Audit.Read'] },
  { label: 'مدیریت داده‌ها', permissions: ['DataMaintenance.Read', 'DataMaintenance.Reset'] },
  { label: 'فاکتورها', permissions: ['Invoice.Create', 'Invoice.Read', 'Invoice.Update', 'Invoice.Delete'] },
  { label: 'پرداخت‌ها', permissions: ['Payment.Create', 'Payment.Read', 'Payment.Update', 'Payment.Delete'] },
  { label: 'طرف‌های حساب', permissions: ['Contact.Create', 'Contact.Read', 'Contact.Update', 'Contact.Delete'] },
  { label: 'کالاها', permissions: ['Item.Create', 'Item.Read', 'Item.Update', 'Item.Delete'] },
  { label: 'سفارش‌ها', permissions: ['Order.Create', 'Order.Read', 'Order.Update', 'Order.Delete', 'Order.Approve', 'Order.Cancel', 'Order.CreateInvoice'] },
  { label: 'موجودی', permissions: ['Stock.Read', 'Stock.Transfer'] },
  { label: 'گردش انبار', permissions: ['StockMovement.Create', 'StockMovement.Read'] },
  { label: 'انبارها', permissions: ['Warehouse.Create', 'Warehouse.Read', 'Warehouse.Update', 'Warehouse.Delete'] },
  { label: 'صندوق و بانک', permissions: ['CashBankAccount.Create', 'CashBankAccount.Read', 'CashBankAccount.Update', 'CashBankAccount.Delete'] },
  { label: 'چک / سفته', permissions: ['Cheque.Create', 'Cheque.Read', 'Cheque.Update', 'Cheque.Delete', 'Cheque.UpdateStatus'] },
  { label: 'واحدهای کالا', permissions: ['Unit.Create', 'Unit.Read', 'Unit.Update', 'Unit.Delete'] },
  { label: 'دسته‌بندی‌ها', permissions: ['Category.Create', 'Category.Read', 'Category.Update', 'Category.Delete'] },
  { label: 'شعبه‌ها', permissions: ['Branch.Create', 'Branch.Read', 'Branch.Update', 'Branch.Delete'] },
  { label: 'کاربران', permissions: ['User.Create', 'User.Read', 'User.Update', 'User.Delete'] },
  { label: 'نقش‌ها', permissions: ['Role.Create', 'Role.Read', 'Role.Update', 'Role.Delete'] },
  { label: 'گزارش‌ها', permissions: ['Report.Dashboard', 'Report.ProfitLoss', 'Report.ContactStatement', 'Report.StockStatus'] },
  { label: 'تنظیمات شرکت', permissions: ['CompanySettings.Read', 'CompanySettings.Update'] }
];
