using Accounting.Application.Invoices.Queries.Print;
using Accounting.Application.Common.Exceptions;
using Accounting.Infrastructure.Reporting;
using Microsoft.Extensions.Configuration;
using System.ComponentModel.DataAnnotations;
using Stimulsoft.Report.Components;
using Xunit;
namespace Accounting.Tests;
public class InvoicePrintLayoutTests {
    [Fact] public void Store_PersistsSeparateFormatsAndRejectsStaleEditsAndInvalidPaths() {
        var root = Path.Combine(Path.GetTempPath(), "invoice-layout-tests-" + Guid.NewGuid());
        try {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> { ["InvoicePrinting:LayoutDirectory"] = root }).Build();
            var store = new InvoicePrintLayoutStore(config);
            var initial = store.Get("a4-portrait");
            var saved = store.Save(initial.Layout with {Title="قالب آزمایشی", ShowCode=false}, initial.Version);
            Assert.Equal(saved, new InvoicePrintLayoutStore(config).Get("a4-portrait"));
            Assert.NotEqual(initial.Version, saved.Version);
            Assert.Equal("default", store.Get("a5-portrait").Version);
            Assert.Throws<BusinessRuleException>(()=>store.Save(initial.Layout,initial.Version));
            Assert.Throws<BusinessRuleException>(()=>store.Get("../secrets"));
        } finally { if(Directory.Exists(root)) Directory.Delete(root,true); }
    }
    [Theory] [InlineData("a4-portrait",21,29.7)] [InlineData("a5-portrait",14.8,21)] [InlineData("a4-landscape",29.7,21)]
    public void Layout_HasCorrectPaperSizeAndColumnsStayInsideMargins(string format,double width,double height) {
        using var data = new System.Data.DataSet("InvoicePrint"); data.Tables.Add("Invoice"); data.Tables.Add("Lines");
        var layout = new InvoicePrintLayout {Format=format, ShowCode=false, ShowDiscount=false, Margin=1.5};
        using var report = InvoiceReportTemplate.CreateLayout(data,layout);
        var page = report.Pages[0];
        Assert.Equal(width,page.PageWidth,2); Assert.Equal(height,page.PageHeight,2);
        foreach(StiBand band in page.Components) foreach(StiComponent text in band.Components) {
            Assert.True(text.Left >= -.001); Assert.True(text.Right <= width - 3 + .001);
        }
    }
    [Fact] public void Settings_RejectInvalidColorMarginAndExpressionSize() {
        var layout = new InvoicePrintLayout {Format="../bad", HeaderColor="red",Margin=9, FontSize=100, Title=new string('x',101)};
        var errors = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(layout,new ValidationContext(layout),errors,true));
        Assert.True(errors.Count>=5);
    }
}
