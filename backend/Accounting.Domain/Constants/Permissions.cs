namespace Accounting.Domain.Constants;

/// <summary>
/// Centralized permission constants for authorization.
/// Usage: [Authorize(Policy = Permissions.Invoice.Create)]
/// </summary>
public static class Permissions
{
    public static class Unit
    {
        public const string Create = "Unit.Create";
        public const string Read = "Unit.Read";
        public const string Update = "Unit.Update";
        public const string Delete = "Unit.Delete";
    }

    public static class Invoice
    {
        public const string Create = "Invoice.Create";
        public const string Read = "Invoice.Read";
        public const string Update = "Invoice.Update";
        public const string Delete = "Invoice.Delete";
    }

    public static class Payment
    {
        public const string Create = "Payment.Create";
        public const string Read = "Payment.Read";
        public const string Update = "Payment.Update";
        public const string Delete = "Payment.Delete";
    }

    public static class Contact
    {
        public const string Create = "Contact.Create";
        public const string Read = "Contact.Read";
        public const string Update = "Contact.Update";
        public const string Delete = "Contact.Delete";
    }

    public static class Item
    {
        public const string Create = "Item.Create";
        public const string Read = "Item.Read";
        public const string Update = "Item.Update";
        public const string Delete = "Item.Delete";
    }

    public static class Order
    {
        public const string Create = "Order.Create";
        public const string Read = "Order.Read";
        public const string Update = "Order.Update";
        public const string Delete = "Order.Delete";
        public const string Approve = "Order.Approve";
        public const string Cancel = "Order.Cancel";
        public const string CreateInvoice = "Order.CreateInvoice";
    }

    public static class Stock
    {
        public const string Read = "Stock.Read";
        public const string Transfer = "Stock.Transfer";
    }

    public static class StockMovement
    {
        public const string Create = "StockMovement.Create";
        public const string Read = "StockMovement.Read";
    }

    public static class Warehouse
    {
        public const string Create = "Warehouse.Create";
        public const string Read = "Warehouse.Read";
        public const string Update = "Warehouse.Update";
        public const string Delete = "Warehouse.Delete";
    }

    public static class CashBankAccount
    {
        public const string Create = "CashBankAccount.Create";
        public const string Read = "CashBankAccount.Read";
        public const string Update = "CashBankAccount.Update";
        public const string Delete = "CashBankAccount.Delete";
    }

    public static class Cheque
    {
        public const string Create = "Cheque.Create";
        public const string Read = "Cheque.Read";
        public const string Update = "Cheque.Update";
        public const string Delete = "Cheque.Delete";
        public const string UpdateStatus = "Cheque.UpdateStatus";
    }

    public static class Category
    {
        public const string Create = "Category.Create";
        public const string Read = "Category.Read";
        public const string Update = "Category.Update";
        public const string Delete = "Category.Delete";
    }

    public static class Branch
    {
        public const string Create = "Branch.Create";
        public const string Read = "Branch.Read";
        public const string Update = "Branch.Update";
        public const string Delete = "Branch.Delete";
    }

    public static class User
    {
        public const string Create = "User.Create";
        public const string Read = "User.Read";
        public const string Update = "User.Update";
        public const string Delete = "User.Delete";
    }

    public static class Role
    {
        public const string Create = "Role.Create";
        public const string Read = "Role.Read";
        public const string Update = "Role.Update";
        public const string Delete = "Role.Delete";
    }

    public static class Report
    {
        public const string Dashboard = "Report.Dashboard";
        public const string ProfitLoss = "Report.ProfitLoss";
        public const string ContactStatement = "Report.ContactStatement";
        public const string StockStatus = "Report.StockStatus";
    }

    public static class CompanySettings
    {
        public const string Read = "CompanySettings.Read";
        public const string Update = "CompanySettings.Update";
    }

    /// <summary>
    /// Returns all permission values for seeding or validation.
    /// </summary>
    public static IEnumerable<string> GetAll()
    {
        return new[]
        {
            // Invoice
            Invoice.Create, Invoice.Read, Invoice.Update, Invoice.Delete,
            // Payment
            Payment.Create, Payment.Read, Payment.Update, Payment.Delete,
            // Contact
            Contact.Create, Contact.Read, Contact.Update, Contact.Delete,
            // Item
            Item.Create, Item.Read, Item.Update, Item.Delete,
            Unit.Create, Unit.Read, Unit.Update, Unit.Delete,
            // Order
            Order.Create, Order.Read, Order.Update, Order.Delete, Order.Approve, Order.Cancel, Order.CreateInvoice,
            // Stock
            Stock.Read, Stock.Transfer,
            // StockMovement
            StockMovement.Create, StockMovement.Read,
            // Warehouse
            Warehouse.Create, Warehouse.Read, Warehouse.Update, Warehouse.Delete,
            // CashBankAccount
            CashBankAccount.Create, CashBankAccount.Read, CashBankAccount.Update, CashBankAccount.Delete,
            // Cheque
            Cheque.Create, Cheque.Read, Cheque.Update, Cheque.Delete, Cheque.UpdateStatus,
            // Category
            Category.Create, Category.Read, Category.Update, Category.Delete,
            // Branch
            Branch.Create, Branch.Read, Branch.Update, Branch.Delete,
            // User
            User.Create, User.Read, User.Update, User.Delete,
            // Role
            Role.Create, Role.Read, Role.Update, Role.Delete,
            // Report
            Report.Dashboard, Report.ProfitLoss, Report.ContactStatement, Report.StockStatus,
            // CompanySettings
            CompanySettings.Read, CompanySettings.Update
        };
    }
}
