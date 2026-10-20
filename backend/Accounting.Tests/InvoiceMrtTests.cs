using Accounting.Application.Common.Exceptions;
using Accounting.Infrastructure.Reporting;
using Microsoft.Extensions.Configuration;
using Xunit;
namespace Accounting.Tests;
public class InvoiceMrtTests
{
    [Fact]
    public void EmbeddedPngResource_IsAllowed_ButDataResourcesAreRejected()
    {
        var config=new ConfigurationBuilder().AddInMemoryCollection().Build();var layouts=new InvoicePrintLayoutStore(config);var store=new InvoiceMrtStore(config,layouts);
        using var report=store.LoadValidated(store.CreateDefault("a4-portrait",InvoiceDesignerSample.Create()),"a4-portrait");
        using var bitmap=new System.Drawing.Bitmap(2,2);using var stream=new MemoryStream();bitmap.Save(stream,System.Drawing.Imaging.ImageFormat.Png);
        var image=new Stimulsoft.Report.Dictionary.StiResource("Logo","Logo",Stimulsoft.Report.Dictionary.StiResourceType.Image,stream.ToArray(),false);
        report.Dictionary.Resources.Add(image);
        using var validated=store.LoadValidated(report.SaveToJsonString(),"a4-portrait");Assert.Single(validated.Dictionary.Resources.Cast<Stimulsoft.Report.Dictionary.StiResource>());
        report.Dictionary.Resources.Clear();report.Dictionary.Resources.Add(new Stimulsoft.Report.Dictionary.StiResource("Data","Data",Stimulsoft.Report.Dictionary.StiResourceType.Json,"{}"u8.ToArray(),false));
        Assert.Throws<BusinessRuleException>(()=>store.LoadValidated(report.SaveToJsonString(),"a4-portrait"));
    }
    [Fact]
    public void Store_UsesCurrentLayout_SeparatesFormats_RejectsStaleSave_AndRestoresDefault()
    {
        var root=Path.Combine(Path.GetTempPath(),"mrt-tests-"+Guid.NewGuid());
        try
        {
            var config=new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>{["InvoicePrinting:LayoutDirectory"]=Path.Combine(root,"layouts"),["InvoicePrinting:MrtDirectory"]=root}).Build();
            var layouts=new InvoicePrintLayoutStore(config);var store=new InvoiceMrtStore(config,layouts);var sample=InvoiceDesignerSample.Create();
            var simple=layouts.Get("a4-portrait");layouts.Save(simple.Layout with {Title="عنوان اختصاصی",ShowCode=true},simple.Version);
            var template=store.CreateDefault("a4-portrait",sample);
            using(var report=store.LoadValidated(template,"a4-portrait")){Assert.Equal(21,report.Pages[0].PageWidth,2);Assert.Equal(29.7,report.Pages[0].PageHeight,2);}
            var saved=store.Save("a4-portrait",template,"default");Assert.NotEqual("default",saved.Version);
            Assert.Equal(saved,new InvoiceMrtStore(config,layouts).Read("a4-portrait"));Assert.Null(store.Read("a5-portrait").Template);
            Assert.Throws<ConcurrencyConflictException>(()=>store.Save("a4-portrait",template,"default"));
            Assert.Throws<BusinessRuleException>(()=>store.LoadValidated(template,"a5-portrait"));
            Assert.Throws<BusinessRuleException>(()=>store.Read("../private"));
            Assert.Throws<BusinessRuleException>(()=>store.LoadValidated("{\"Script\":\"System.IO.File.ReadAllText(abc)\"}","a4-portrait"));
            Assert.Throws<BusinessRuleException>(()=>store.LoadValidated("{\"Dictionary\":{\"Databases\":{\"0\":{\"ConnectionString\":\"private\"}}}}","a4-portrait"));
            store.Reset("a4-portrait",saved.Version);Assert.Null(store.Read("a4-portrait").Template);
            var a5=store.CreateDefault("a5-portrait",sample);using var validA5=store.LoadValidated(a5,"a5-portrait");Assert.Equal(14.8,validA5.Pages[0].PageWidth,2);
        }
        finally{if(Directory.Exists(root))Directory.Delete(root,true);}
    }
}
