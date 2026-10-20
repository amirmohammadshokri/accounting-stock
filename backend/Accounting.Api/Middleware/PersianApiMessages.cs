using System.Globalization;
using FluentValidation;
using FluentValidation.Resources;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.Api.Middleware;

public static class PersianApiMessages
{
    public static void ConfigureValidation()
    {
        // Use Persian validation regardless of browser language; do not change numeric/date parsing.
        ValidatorOptions.Global.LanguageManager = new PersianValidationLanguage();
        ValidatorOptions.Global.DisplayNameResolver = (_, member, _) => member?.Name switch
        {
            "Id" => "شناسه", "Name" => "نام", "Code" => "کد", "Title" => "عنوان",
            "Email" => "ایمیل", "Password" => "رمز عبور", "FirstName" => "نام",
            "LastName" => "نام خانوادگی", "Currency" => "واحد پول",
            "RowVersionBase64" => "نسخه رکورد", "ContactId" => "طرف حساب",
            "ItemId" => "کالا", "UnitId" => "واحد اندازه‌گیری", "BranchId" => "شعبه",
            "WarehouseId" => "انبار", "DateUtc" => "تاریخ", "Lines" => "ردیف‌ها",
            "Qty" or "Quantity" => "مقدار", "UnitPrice" => "قیمت واحد",
            "VatRate" => "درصد مالیات", "DiscountRate" => "درصد تخفیف",
            "WithholdingRate" => "درصد کسورات", "Amount" => "مبلغ",
            "Page" => "صفحه", "PageSize" => "اندازه صفحه", "Type" => "نوع",
            "NationalId" => "کد ملی یا شناسه ملی", "PostalCode" => "کد پستی",
            "Phone" => "شماره تلفن", "Address" => "نشانی",
            _ => "مقدار فیلد"
        };
    }

    public static ProblemDetails Status(int status) => new()
    {
        Status = status, Type = "about:blank",
        Title = status switch
        {
            400 => "درخواست نامعتبر", 401 => "ورود به حساب کاربری الزامی است",
            403 => "دسترسی غیرمجاز", 404 => "مسیر یا اطلاعات یافت نشد",
            405 => "روش درخواست مجاز نیست", 415 => "قالب درخواست پشتیبانی نمی‌شود",
            _ => "خطا در پردازش درخواست"
        },
        Detail = status switch
        {
            400 => "اطلاعات درخواست را بررسی کنید.",
            401 => "نشست شما معتبر نیست؛ دوباره وارد شوید.",
            403 => "مجوز انجام این عملیات را ندارید.",
            404 => "مسیر یا اطلاعات درخواستی یافت نشد.",
            405 => "روش ارسال درخواست برای این مسیر مجاز نیست.",
            415 => "نوع محتوای درخواست معتبر نیست؛ قالب مورد انتظار را ارسال کنید.",
            _ => "درخواست انجام نشد؛ دوباره تلاش کنید."
        }
    };
}

public sealed class PersianValidationLanguage : LanguageManager
{
    public override string GetString(string key, CultureInfo? culture = null)
    {
        var message = base.GetString(key, CultureInfo.GetCultureInfo("fa"));
        return message.Any(c => c >= 'ا' && c <= 'ی')
            ? message : "«{PropertyName}» معتبر نیست.";
    }
}
