using Accounting.Application.Invoices.Queries.Print;
using Accounting.Infrastructure.Reporting;
using Microsoft.Extensions.Configuration;
using System.Drawing;
using System.Drawing.Imaging;

var output = Path.GetFullPath(args.FirstOrDefault() ?? "output/pdf/catering");
Directory.CreateDirectory(output);
var party = new InvoicePrintParty("کترینگ بهار", null, null, null, "تهران، خیابان بهار، پلاک ۱۲", "۰۲۱۱۲۳۴۵۶۷۸");
var buyer = new InvoicePrintParty("مشتری نمونه", null, null, null, "سالن پذیرایی", "۰۹۱۲۱۲۳۴۵۶۷");
using var bitmap = new Bitmap(180, 100);
using (var g = Graphics.FromImage(bitmap)) {g.Clear(Color.DarkGreen);g.FillEllipse(Brushes.White,55,15,70,70);}
using var buffer = new MemoryStream(); bitmap.Save(buffer,ImageFormat.Png);
var logo = "data:image/png;base64," + Convert.ToBase64String(buffer.ToArray());
var pdf = new StimulsoftInvoicePdfService(new ConfigurationBuilder().Build());
foreach(var format in new[]{"a4-portrait","a5-portrait"}) foreach(var count in new[]{4,45}) {
    var lines = Enumerable.Range(1,count).Select(i => new InvoicePrintLine(i,"F"+i,
        i%3==0 ? "چلو جوجه کباب ویژه با مخلفات و دورچین به همراه خدمات پذیرایی" : "چلو کباب مخصوص",
        "پرس",10,200000,2000000,0,2000000,0,0,2000000)).ToList();
    var layout = new InvoicePrintLayout {Format=format,Terms="قوانین سفارش:\nتغییر تعداد سفارش تا روز قبل امکان‌پذیر است.\nلطفاً هنگام تحویل، تعداد غذاها را بررسی کنید.",HeaderText="غذا و خدمات پذیرایی مراسم",ShowWords=true};
    var d = new InvoicePrintDocument(1,"S-1405-001",DateTime.UtcNow,"فاکتور فروش",party,buyer,lines,
        count*2000000,0,count*2000000,0,count*2000000,0,count*2000000-500000,null,null) {
        Notes="تحویل سفارش ساعت ۱۲:۳۰ در محل سالن. لطفاً غذاها به صورت گرم تحویل شوند.",
        LogoDataUrl=logo,BranchName="شعبه مرکزی",Layout=layout,IsLayoutPreview=true};
    var result=pdf.Render(d);
    var path=Path.Combine(output,$"catering-{format}-{count}.pdf");
    File.WriteAllBytes(path,result.Content);Console.WriteLine(path);
}
