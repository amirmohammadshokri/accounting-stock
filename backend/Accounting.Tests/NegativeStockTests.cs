using Accounting.Application.Services;
using Accounting.Domain.Enums;
namespace Accounting.Tests;
public class NegativeStockTests
{
    [Theory]
    [InlineData(StockMovementType.SalesOut, -7)]
    [InlineData(StockMovementType.PurchaseReturn, -7)]
    [InlineData(StockMovementType.PurchaseIn, 13)]
    public void MovementsKeepActualBalancesEvenBelowZero(StockMovementType type, int expected)
        => Assert.Equal(expected, StockQuantityCalculator.ApplyMovement(3, type, 10));
    [Fact]
    public void PurchaseCanIncreaseAnAlreadyNegativeBalance()
        => Assert.Equal(-6, StockQuantityCalculator.ApplyMovement(-10, StockMovementType.PurchaseIn, 4));
}
