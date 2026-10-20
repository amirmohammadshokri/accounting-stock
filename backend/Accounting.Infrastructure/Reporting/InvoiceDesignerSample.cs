using Accounting.Application.Invoices.Queries.Print;
namespace Accounting.Infrastructure.Reporting;
public static class InvoiceDesignerSample
{
    public static InvoicePrintDocument Create()=>new(0,"نمونه-۰۰۱",new DateTime(2026,10,18),"فاکتور فروش",
        new("کترینگ نمونه",null,null,null,"تهران، خیابان بهار","۰۲۱۱۲۳۴۵۶۷۸"),
        new InvoicePrintParty("مشتری نمونه",null,null,null,"نشانی مشتری","۰۹۱۲۱۲۳۴۵۶۷"){CustomerNumber="VIP-1001"},
        new[]{new InvoicePrintLine(1,"غذا-۱","زرشک‌پلو با مرغ","پرس",10,2200000,22000000,0,22000000,0,0,22000000),
            new InvoicePrintLine(2,"نوشیدنی-۱","دوغ خانواده","عدد",2,400000,800000,0,800000,0,0,800000)},
        22800000,0,22800000,0,22800000,0,17800000,null,null)
        {BranchName="شعبه مرکزی",Notes="تحویل سفارش ساعت ۱۲ ظهر"};
}
