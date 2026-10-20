using Accounting.Infrastructure.Reporting;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Accounting.Tests;

public class StimulsoftLicenseConfigurationTests
{
    [Fact]
    public void Designer_ReusesSharedKey_UnlessExplicitlyOverridden()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Stimulsoft:LicenseKey"] = "shared-test-key"
        }).Build();
        Assert.Equal("shared-test-key", StimulsoftLicenseConfiguration.GetKey(config, forDesigner: true));
        config["InvoicePrinting:PublicDesignerLicenseKey"] = "designer-test-key";
        Assert.Equal("designer-test-key", StimulsoftLicenseConfiguration.GetKey(config, forDesigner: true));
        Assert.Equal("shared-test-key", StimulsoftLicenseConfiguration.GetKey(config));
        config["InvoicePrinting:PublicDesignerLicenseKey"] = " ";
        Assert.Equal("shared-test-key", StimulsoftLicenseConfiguration.GetKey(config, forDesigner: true));
    }
}
