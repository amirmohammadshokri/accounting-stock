/**
 * Reports Models
 * Backend: Accounting.Api.Controllers.ReportsController
 * Backend: Accounting.Application.Reports.Queries.Dtos.DashboardDtos
 */

// ========== Dashboard ==========

export interface CashStatusDto {
  id: number;
  name: string;
  type: string; // "Kasa" | "Banka"
  balance: string; // Money as string (2 decimals)
  currency: string;
}

export interface DashboardStatsDto {
  dailySalesTotal: string;
  dailyPurchasesTotal?: string;
  dailyCollectionsTotal: string;
  totalReceivables: string;
  totalPayables: string;
  cashStatus: CashStatusDto[];
}

// ========== Contact Statement (Cari Ekstre) ==========

export interface ContactStatementLineDto {
  dateUtc: string;
  type: string; // "DEVİR" | "Satış Faturası" | "Alış Faturası" | "Tahsilat" | "Ödeme" | ...
  documentNo: string;
  description: string;
  debt: string;    // Borç
  credit: string;  // Alacak
  balance: string; // Running balance
}

export interface ContactStatementDto {
  contactId: number;
  contactName: string;
  items: ContactStatementLineDto[];
}

// ========== Stock Status Report (Stok Durumu Raporu) ==========

export interface StockStatusDto {
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  quantityIn: string;        // Giren
  quantityOut: string;       // Çıkan
  quantityReserved: string;  // Rezerve
  quantityAvailable: string; // Mevcut
}

// ========== Income & Expense Report (Gelir/Gider Raporu) ==========
// NAKİT BAZLI RAPOR - gerçek muhasebe karı değildir (bkz. backend IncomeExpenseDto)

export interface IncomeExpenseDto {
  income: string;             // Net Satışlar
  inventoryPurchases: string; // Stok Alımları (COGS değil)
  operatingExpenses: string;  // Faaliyet Giderleri
  grossProfit: string;        // Brüt Kâr
  netProfit: string;          // Net Kâr/Zarar
  vatBalance: string;         // KDV Dengesi
}
