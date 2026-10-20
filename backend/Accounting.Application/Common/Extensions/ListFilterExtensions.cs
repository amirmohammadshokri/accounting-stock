using System.Globalization;
using System.Linq.Expressions;
using System.Text.Json;
using Accounting.Application.Common.Exceptions;

namespace Accounting.Application.Common.Extensions;

public static class ListFilterExtensions
{
    // Only fields already exposed by list DTOs may be filtered; never accept arbitrary entity paths.
    private static readonly Dictionary<string,string> Fields = new()
    {
        ["Item"]="Id,Code,Name,Type,CategoryId,CategoryName:Category.Name,UnitId,UnitName:Unit.Name,VatRate,DefaultWithholdingRate,PurchasePrice,SalesPrice,PurchaseAccountCode,SalesAccountCode,UsefulLifeYears,CreatedAtUtc,UpdatedAtUtc",
        ["Contact"]="Id,BranchId,Code,Name,SubscriptionNumber,CustomerNumber:Id,ContactRole:IsCustomer,IsCustomer,IsVendor,IsEmployee,IsRetail,Email,Phone,CreatedAtUtc,UpdatedAtUtc",
        ["Invoice"]="Id,InvoiceNumber,ContactId,ContactName:Contact.Name,ContactCode:Contact.Code,BranchId,BranchCode:Branch.Code,BranchName:Branch.Name,UpdatedAtUtc,DateUtc,Type,Currency,TotalNet,TotalVat,TotalGross,Balance,PaymentDueDateUtc,CreatedAtUtc",
        ["Order"]="Id,OrderNumber,ContactId,ContactName:Contact.Name,BranchId,DateUtc,Type,Currency,Status,Description,TotalNet,TotalVat,TotalGross,CreatedAtUtc",
        ["Payment"]="Id,DateUtc,Direction,AccountId,AccountName:Account.Name,AccountCode:Account.Code,ContactId,ContactName:Contact.Name,ContactCode:Contact.Code,Amount,Currency,Description",
        ["CashBankAccount"]="Id,Balance,BranchId,Code,Name,Type,Currency,Iban,CreatedAtUtc",
        ["Stock"]="Id,WarehouseId,WarehouseName:Warehouse.Name,ItemId,ItemCode:Item.Code,ItemName:Item.Name,UnitName:Item.Unit.Name,Unit:Item.Unit.Name,WarehouseCode:Warehouse.Code,Qty:Quantity,Quantity",
        ["StockMovement"]="Id,WarehouseId,WarehouseName:Warehouse.Name,ItemId,ItemCode:Item.Code,ItemName:Item.Name,Type,Quantity,Date:TransactionDateUtc,Item:Item.Name,Qty:Quantity,WarehouseCode:Warehouse.Code,DateUtc:TransactionDateUtc,TransactionDateUtc,Note,CreatedAtUtc",
        ["Cheque"]="Id,BranchId,ChequeNumber,DrawerName,BankName,Type,Direction,Status,Amount,Currency,DueDate,IssueDate,ContactId,ContactName:Contact.Name,CreatedAtUtc",
        ["Warehouse"]="Id,IsDefault,BranchId,Code,Name,CreatedAtUtc",
        ["Category"]="Id,Name,Description,CreatedAtUtc,UpdatedAtUtc",
        ["Unit"]="Id,Name,Description,CreatedAtUtc,UpdatedAtUtc",
        ["User"]="Id,FullName:FirstName,Status:IsActive,BranchId,BranchName:Branch.Name,FirstName,LastName,Email,IsActive,CreatedAtUtc"
    };
    private static readonly Dictionary<string,string> Labels=new(StringComparer.OrdinalIgnoreCase)
    {
        ["Sales"]="فروش",["Purchase"]="خرید",["SalesReturn"]="برگشت از فروش",["PurchaseReturn"]="برگشت از خرید",
        ["Draft"]="پیش‌نویس",["Approved"]="تأیید شده",["Invoiced"]="فاکتور شده",["Cancelled"]="لغو",
        ["Inbound"]="دریافتی",["Outbound"]="پرداختی",["Cash"]="صندوق",["Bank"]="بانک",["Service"]="خدمت",["Inventory"]="کالا",["Product"]="کالا",["Expense"]="هزینه",["FixedAsset"]="دارایی ثابت",["In"]="دریافت",["Out"]="پرداخت",
        ["PurchaseIn"]="ورود خرید",["SalesOut"]="خروج فروش",["AdjustmentIn"]="افزایش موجودی",["AdjustmentOut"]="کاهش موجودی",["TransferIn"]="ورود انتقال",["TransferOut"]="خروج انتقال",["OpeningBalance"]="اول دوره",
        ["Cheque"]="چک",["PromissoryNote"]="سفته",["Pending"]="در دست",["Paid"]="پرداخت شده",["Endorsed"]="واگذار شده",["Bounced"]="برگشتی"
    };
    public static IQueryable<T> ApplyListFilters<T>(this IQueryable<T> query,string? json)
    {
        if(string.IsNullOrWhiteSpace(json))return query;
        try
        {
            if(json.Length>12000)throw new FormatException();
            using var doc=JsonDocument.Parse(json);
            if(doc.RootElement.ValueKind!=JsonValueKind.Object||doc.RootElement.EnumerateObject().Count()>20)throw new FormatException();
            if(!Fields.TryGetValue(typeof(T).Name,out var fields))throw new FormatException();
            var allowed=fields.Split(',').Select(s=>s.Split(':')).ToDictionary(p=>p[0],p=>p.Length>1?p[1]:p[0],StringComparer.OrdinalIgnoreCase);
            foreach(var entry in doc.RootElement.EnumerateObject())
            {
                if(!allowed.TryGetValue(entry.Name,out var path))throw new FormatException();
                var model=entry.Value;
                var op=model.GetProperty("op").GetString()??"contains";
                var text=Normalize(model.TryGetProperty("value",out var v)?v.GetString()??"":"");
                if(text.Length>500)throw new FormatException();
                var parameter=Expression.Parameter(typeof(T),"row");
                Expression member=parameter;Expression guard=Expression.Constant(true);
                foreach(var part in path.Split('.'))
                {
                    if(member!=parameter&&!member.Type.IsValueType)guard=Expression.AndAlso(guard,Expression.NotEqual(member,Expression.Constant(null,member.Type)));
                    member=Expression.Property(member,part);
                }
                if(typeof(T).Name=="User"&&entry.Name.Equals("fullName",StringComparison.OrdinalIgnoreCase))
                    member=Expression.Call(typeof(string).GetMethod(nameof(string.Concat),new[]{typeof(string),typeof(string),typeof(string)})!,Expression.Property(parameter,"FirstName"),Expression.Constant(" "),Expression.Property(parameter,"LastName"));
                if(typeof(T).Name=="StockMovement"&&entry.Name.Equals("qty",StringComparison.OrdinalIgnoreCase))
                {
                    Expression<Func<Accounting.Domain.Entities.StockMovement,decimal>> signed=m=>
                        m.Type==Accounting.Domain.Enums.StockMovementType.PurchaseIn||m.Type==Accounting.Domain.Enums.StockMovementType.AdjustmentIn||
                        m.Type==Accounting.Domain.Enums.StockMovementType.SalesReturn||m.Type==Accounting.Domain.Enums.StockMovementType.TransferIn||
                        m.Type==Accounting.Domain.Enums.StockMovementType.OpeningBalance?m.Quantity:-m.Quantity;
                    member=new SwapParameter(signed.Parameters[0],parameter).Visit(signed.Body)!;
                }
                Expression condition;

                if(typeof(T).Name=="Contact"&&entry.Name.Equals("subscriptionNumber",StringComparison.OrdinalIgnoreCase))
                {
                    Expression<Func<Accounting.Domain.Entities.Contact,string>> display=c=>c.SubscriptionNumber??("AUTO-"+(c.Id<1000000?("000000"+c.Id.ToString()).Substring(c.Id.ToString().Length):c.Id.ToString()));
                    member=new SwapParameter(display.Parameters[0],parameter).Visit(display.Body)!;
                    condition=Build(member,guard,op,text,model);
                }
                else if(typeof(T).Name=="Contact"&&entry.Name.Equals("contactRole",StringComparison.OrdinalIgnoreCase))
                {
                    var roles=new Dictionary<string,string>{{"مشتری","IsCustomer"},{"تأمین‌کننده","IsVendor"},{"کارمند","IsEmployee"},{"خرده‌فروشی","IsRetail"}};
                    condition=roles.Where(r=>TextMatch(r.Key,text,op)).Select(r=>(Expression)Expression.Property(parameter,r.Value)).Aggregate((Expression)Expression.Constant(false),Expression.OrElse);
                    if(op=="notEqual"||op=="blank")condition=Expression.Not(condition);
                }
                else condition=Build(member,guard,op,text,model);
                query=query.Where(Expression.Lambda<Func<T,bool>>(condition,parameter));
            }
            return query;
        }
        catch(Exception ex) when(ex is JsonException or FormatException or InvalidOperationException or ArgumentException or OverflowException or KeyNotFoundException)
        {throw new BusinessRuleException("فیلتر ستون معتبر نیست؛ برای عدد و تاریخ مقدار مناسب وارد کنید.");}
    }
    private static Expression Build(Expression member,Expression guard,string op,string text,JsonElement model)
    {
        var nullable=Nullable.GetUnderlyingType(member.Type);
        var type=nullable??member.Type;
        var present=type==typeof(string)?Expression.NotEqual(member,Expression.Constant(null,member.Type)):nullable!=null?(Expression)Expression.Property(member,"HasValue"):Expression.Constant(true);
        var exists=Expression.AndAlso(guard,present);
        if(op=="blank"||op=="notBlank")
        {
            Expression nonempty=exists;
            if(type==typeof(string))nonempty=Expression.AndAlso(exists,Expression.NotEqual(member,Expression.Constant("")));
            return op=="blank"?Expression.Not(nonempty):nonempty;
        }
        var value=nullable!=null?Expression.Property(member,"Value"):member;
        Expression condition;
        if(type==typeof(string))
        {
            var upper=Expression.Call(value,nameof(string.ToUpper),Type.EmptyTypes);
            var constant=Expression.Constant(text.ToUpperInvariant());
            condition=op switch {
                "contains"=>Expression.Call(upper,nameof(string.Contains),Type.EmptyTypes,constant),
                "startsWith"=>Expression.Call(upper,nameof(string.StartsWith),Type.EmptyTypes,constant),
                "endsWith"=>Expression.Call(upper,nameof(string.EndsWith),Type.EmptyTypes,constant),
                "equal" or "notEqual"=>Expression.Equal(upper,constant),
                _=>throw new FormatException()
            };
        }
        else if(type.IsEnum)
        {
            var matches=Enum.GetValues(type).Cast<object>().Where(v=>TextMatch(v.ToString()!,text,op)||
                (Labels.TryGetValue(v.ToString()!,out var label)&&TextMatch(label,text,op))||Convert.ToInt32(v).ToString(CultureInfo.InvariantCulture)==text).ToList();
            condition=matches.Select(v=>(Expression)Expression.Equal(value,Expression.Constant(v,type))).Aggregate((Expression)Expression.Constant(false),Expression.OrElse);
        }
        else if(type==typeof(bool))
        {
            var flag=text.ToLowerInvariant() switch {"true" or "1" or "بله" or "فعال"=>true,"false" or "0" or "خیر" or "غیرفعال"=>false,_=>throw new FormatException()};
            condition=Expression.Equal(value,Expression.Constant(flag));
        }
        else if(type==typeof(DateTime))
        {
            var date=ParseDate(text);
            condition=op switch {
                "greater"=>Expression.GreaterThanOrEqual(value,Expression.Constant(date.AddDays(1))),
                "less"=>Expression.LessThan(value,Expression.Constant(date)),
                "range"=>Expression.AndAlso(Expression.GreaterThanOrEqual(value,Expression.Constant(date)),Expression.LessThan(value,Expression.Constant(ParseDate(Normalize(model.GetProperty("to").GetString()!)).AddDays(1)))),
                "equal" or "notEqual" or "contains"=>Expression.AndAlso(Expression.GreaterThanOrEqual(value,Expression.Constant(date)),Expression.LessThan(value,Expression.Constant(date.AddDays(1)))),
                _=>throw new FormatException()
            };
        }
        else
        {
            var number=Expression.Constant(Convert.ChangeType(text,type,CultureInfo.InvariantCulture),type);
            condition=op switch {
                "greater"=>Expression.GreaterThan(value,number),"less"=>Expression.LessThan(value,number),
                "range"=>Expression.AndAlso(Expression.GreaterThanOrEqual(value,number),Expression.LessThanOrEqual(value,Expression.Constant(Convert.ChangeType(Normalize(model.GetProperty("to").GetString()!),type,CultureInfo.InvariantCulture),type))),
                "contains" or "equal" or "notEqual"=>Expression.Equal(value,number),_=>throw new FormatException()
            };
        }
        return Expression.AndAlso(exists,op=="notEqual"?Expression.Not(condition):condition);
    }
    private sealed class SwapParameter(ParameterExpression original,ParameterExpression replacement):ExpressionVisitor
    { protected override Expression VisitParameter(ParameterExpression node)=>node==original?replacement:base.VisitParameter(node); }
    private static bool TextMatch(string candidate,string text,string op)=>op switch {
        "equal" or "notEqual"=>candidate.Equals(text,StringComparison.OrdinalIgnoreCase),
        "startsWith"=>candidate.StartsWith(text,StringComparison.OrdinalIgnoreCase),
        "endsWith"=>candidate.EndsWith(text,StringComparison.OrdinalIgnoreCase),
        _=>candidate.Contains(text,StringComparison.OrdinalIgnoreCase)
    };
    private static string Normalize(string value)=>string.Concat(value.Trim().Replace(",", "").Replace("٬", "").Select(c=>c is >= '۰' and <= '۹'?(char)('0'+c-'۰'):c is >= '٠' and <= '٩'?(char)('0'+c-'٠'):c));
    private static DateTime ParseDate(string text)
    {
        var parts=text.Replace('-','/').Split('/');
        if(parts.Length==3&&int.TryParse(parts[0],out var year)&&year is >=1300 and <1600)
            return new PersianCalendar().ToDateTime(year,int.Parse(parts[1]),int.Parse(parts[2]),0,0,0,0);
        return DateTime.Parse(text,CultureInfo.InvariantCulture,DateTimeStyles.AssumeUniversal|DateTimeStyles.AdjustToUniversal).Date;
    }
}
