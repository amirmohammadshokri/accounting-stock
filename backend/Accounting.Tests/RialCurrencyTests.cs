using Accounting.Application.Common.Validation;
using Accounting.Domain.Entities;
using FluentValidation;

namespace Accounting.Tests;

public class RialCurrencyTests
{
    [Fact]
    public void NewRecords_DefaultToRial()
    {
        Assert.Equal("IRR", new Invoice().Currency);
        Assert.Equal("IRR", new Order().Currency);
        Assert.Equal("IRR", new Payment().Currency);
        Assert.Equal("IRR", new Cheque().Currency);
        Assert.Equal("IRR", new CashBankAccount().Currency);
        Assert.Equal("IRR", CommonValidationRules.NormalizeAndValidateCurrency(" irr "));
    }
    [Theory]
    [InlineData("TRY")]
    [InlineData("USD")]
    [InlineData("EUR")]
    [InlineData("GBP")]
    public void NewRecords_RejectForeignCurrencies(string currency)
    {
        Assert.False(CommonValidationRules.IsValidCurrency(currency));
        Assert.Throws<ValidationException>(() => CommonValidationRules.NormalizeAndValidateCurrency(currency));
    }
    [Fact]
    public void HistoricalCurrency_IsPreservedAndCannotBeRelabeled()
    {
        Assert.Equal("USD", CommonValidationRules.PreserveExistingCurrency("usd", "USD"));
        Assert.Throws<ValidationException>(() => CommonValidationRules.PreserveExistingCurrency("IRR", "USD"));
        Assert.Throws<ValidationException>(() => CommonValidationRules.PreserveExistingCurrency("USD", "IRR"));
    }
}
