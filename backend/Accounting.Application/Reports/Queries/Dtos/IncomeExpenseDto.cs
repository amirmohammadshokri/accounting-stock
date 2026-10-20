using Accounting.Application.Common.JsonConverters;
using System.Text.Json.Serialization;

namespace Accounting.Application.Reports.Queries.Dtos;

/// <summary>
/// Gelir-Gider Raporu DTO (Income & Expense Report)
/// NAK�T BAZLI RAPOR - Ger�ek muhasebe kar� de�ildir
/// </summary>
public record IncomeExpenseDto(
    /// <summary>
    /// Net Sat��lar (Sales - Sales Returns)
    /// </summary>
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal Income,

    /// <summary>
    /// Stok Al�mlar� (Inventory Purchases)
    /// D�KKAT: Bu COGS (Sat�lan Mal�n Maliyeti) DE��LD�R!
    /// D�nem i�inde sat�n al�nan mal bedelidir.
    /// Ger�ek COGS i�in FIFO/LIFO sistemi gerekir.
    /// </summary>
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal InventoryPurchases,

    /// <summary>
    /// Faaliyet Giderleri (Operating Expenses)
    /// Expense + Service item al�mlar�
    /// </summary>
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal OperatingExpenses,

    /// <summary>
    /// Br�t K�r (Gross Profit)
    /// NAK�T BAZLI: Income - Inventory Purchases
    /// </summary>
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal GrossProfit,

    /// <summary>
    /// Net K�r/Zarar (Net Profit/Loss)
    /// Gross Profit - Operating Expenses
    /// </summary>
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal NetProfit,

    /// <summary>
    /// KDV Dengesi (VAT Balance)
    /// Pozitif: �denecek KDV
    /// Negatif: �ade al�nacak KDV
    /// </summary>
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal VatBalance
);
