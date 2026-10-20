namespace Accounting.Application.Common.Exceptions;

public sealed class NotFoundException : DomainException
{
    public NotFoundException(string resource, object? key = null)
        : base("not_found", key is null
            ? $"{PersianNames.Resource(resource)} یافت نشد."
            : $"{PersianNames.Resource(resource)} با شناسه {key} یافت نشد.") { }
}

public static class PersianNames
{
    public static string Resource(string name) => name switch
    {
        "Branch" => "شعبه", "Warehouse" => "انبار",
        "Source Warehouse" => "انبار مبدأ", "Target Warehouse" => "انبار مقصد",
        "Item" => "کالا", "Unit" => "واحد اندازه‌گیری", "Contact" => "طرف حساب",
        "Invoice" => "فاکتور", "Order" => "سفارش", "Payment" => "پرداخت",
        "Cheque" => "چک", "Category" => "دسته‌بندی", "User" => "کاربر",
        "Role" => "نقش", "Stock" => "موجودی", "StockMovement" => "گردش انبار",
        "CashBankAccount" => "حساب صندوق یا بانک", "CompanySettings" => "تنظیمات شرکت",
        _ => name.Any(c => c >= 'ا' && c <= 'ی') ? name : "اطلاعات درخواستی"
    };
}
