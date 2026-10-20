# 📊 Accounting & Inventory Management System

**.NET 8** tabanlı kurumsal muhasebe ve stok yönetimi sistemi. **Clean Architecture**, **CQRS**, **Domain-Driven Design** prensipleriyle geliştirilmiştir.

---

## 📌 Project Goal & Scope

Disclaimer: This project is designed as a Technical Proof of Concept (POC) to demonstrate proficiency in .NET 8, Clean Architecture, and CQRS patterns. It is not intended to be a fully compliant production-ready accounting software.

While the core architectural flows (Auth, Transaction Management, Multi-tenancy basics) are implemented, complex domain specifics (like official tax regulations, advanced inventory costing methods e.g., FIFO/LIFO, or governmental integrations) are intentionally out of scope.

Primary Focus:

- Clean Code & SOLID Principles

- Architectural Modularity

- Handling Concurrency & Transactions

- AI-Assisted Development Workflows

---

## 🏗️ Mimari

### Katmanlar
```
├── Accounting.Api              # REST API endpoints (Controllers)
├── Accounting.Application      # CQRS (Commands/Queries), Business Logic
├── Accounting.Domain           # Entities, Enums, Value Objects
└── Accounting.Infrastructure   # EF Core, Persistence, External Services
```

### Temel Prensipler
- **CQRS (MediatR)**: Command/Query ayrımı
- **Clean Architecture**: Domain merkezli, bağımlılıklar içe doğru
- **Repository Pattern yok**: CQRS handler'lar direkt `IAppDbContext` kullanır
- **FluentValidation**: Request validation
- **Optimistic Concurrency**: RowVersion ile çakışma kontrolü
- **Soft Delete**: Kayıtlar fiziksel olarak silinmez
- **Audit Trail**: `CreatedAtUtc`, `UpdatedAtUtc` otomatik eklenir

---

## 🔐 Transaction Yönetimi

### Yaklaşım: Manuel Transaction

Projede transaction yönetimi **açık ve görünür** olması için handler'ların içinde manuel olarak yapılmaktadır. Bu sayede:
- Transaction nerede başlıyor/bitiyor açıkça görülür
- Debug ve bakım kolaylaşır
- Junior developer'lar bile kodu kolayca anlayabilir

> **Not:** `TransactionBehavior` ve `ITransactionalRequest` projede mevcut ancak aktif olarak kullanılmıyor. İleride ihtiyaç olursa kullanılabilir.

### Ne Zaman Transaction Gerekli?

| Durum | Örnek | Gerekli mi? |
|-------|-------|-------------|
| **2+ SaveChangesAsync çağrısı** | Payment → InvoiceBalance güncelleme | ✅ EVET |
| **MediatR ile nested command** | CreateInvoice + StockMovement | ✅ EVET |
| **Tek SaveChangesAsync** | CreateContact, UpdateOrder | ❌ HAYIR |
| **Parent + Child entity (aynı aggregate)** | Order + OrderLines | ❌ HAYIR |

### Transaction Kullanan Handler'lar

| Handler | Sebep |
|---------|-------|
| `CreatePaymentHandler` | 2x SaveChanges (Payment + InvoiceBalance) |
| `UpdatePaymentHandler` | 2x SaveChanges |
| `SoftDeletePaymentHandler` | 2x SaveChanges |
| `CreateInvoiceHandler` | MediatR.Send (StockMovement) |
| `UpdateInvoiceHandler` | 2x SaveChanges + MediatR.Send |

---

## 🔐 Kimlik Doğrulama & Yetkilendirme

### Kimlik Doğrulama
- **JWT-tabanlı** kimlik doğrulama (access & refresh token)
- **Şifre Hashleme**: `IPasswordHasher` (Identity.Core)
- **Özel** User/Role entity'leri (ASP.NET Identity framework kullanılmıyor)

### Yetkilendirme Stratejileri

#### 1. **Rol Bazlı** (Yönetim İşlemleri)
```csharp
[Authorize(Roles = "Admin")]  // Kullanıcı/Rol yönetimi
```

#### 2. **Şube Bazlı** (Veri İzolasyonu)
Tüm sorgular otomatik olarak şubeye göre filtrelenir.

---

## 🏢 Çok Şubeli Veri Görünürlüğü

### Kurallar
- **Admin** kullanıcılar → TÜM şubeleri görebilir
- **Merkez** kullanıcılar → TÜM şubeleri görebilir  
- **Normal** kullanıcılar → SADECE kendi şubelerini görebilir

### Şube Bazlı Entity'ler (Branch Filter Uygulanır):
**List:** Invoices, Contacts, Payments, CashBankAccounts, Stocks, Warehouses, StockMovements

**GetById:** Invoices, Contacts, Payments, CashBankAccounts, Warehouses

### Global Entity'ler (Branch Filter Uygulanmaz):
**Items:** 🌍 Tüm şubeler tüm item'ları görebilir
- Item (Ürün Tanımı): Global
- Stock (Stok Miktarı): Şube bazlı ✅
- StockMovement (Stok Hareketi): Şube bazlı ✅

**Mantık:** Ürün kataloğu merkezde, stok takibi şubelerde.

### Uygulama

```csharp
var invoices = await _db.Invoices
    .ApplyBranchFilter(_currentUserService)  // 👈 Tek satır!
    .ToListAsync();
```

### Güvenli Hale Getirilen Entity'ler
**List:** Invoices, Items, Contacts, Payments, CashBankAccounts, Stocks, Warehouses, StockMovements

**GetById:** Invoices, Items, Contacts, Payments, CashBankAccounts, Warehouses

---

## 📦 Domain Modülleri

### 1. **Contacts (Cariler) - Tek Kart Yapısı**
- **Mimari**: Composition Pattern (Hybrid Model)
- **Yapı**: 
  - `Contact`: Ana kimlik ve bayraklar (`IsCustomer`, `IsVendor`, `IsEmployee`, `IsRetail`)
  - `PersonDetails`: Şahıs bilgileri (TCKN, Ad, Soyad) - *Opsiyonel*
  - `CompanyDetails`: Şirket bilgileri (Vergi No, Daire, Mersis) - *Opsiyonel*
- **Esneklik (Hibrid Yapı)**:
  - **Şirket**: Sadece `CompanyDetails` içerir.
  - **Şahıs**: Sadece `PersonDetails` içerir.
  - **Şahıs Şirketi**: Hem `PersonDetails` hem `CompanyDetails` içerir (Tek kartta birleşik).
- **Validasyonlar**:
  - Personel (`IsEmployee`) ise `PersonDetails` zorunludur.
  - Cari kart en az bir detay (Şahıs veya Şirket) içermelidir.
  - Perakende (`IsRetail`) ve Kurumsal (`IsCustomer`) aynı anda olamaz.

### 2. **Invoices (Faturalar)** ✨ GÜNCELLENDİ

#### Invoice Types (`InvoiceType` Enum):
- **Sales (1)**: Satış faturası
- **Purchase (2)**: Alış faturası
- **SalesReturn (3)**: Satış iadesi
- **PurchaseReturn (4)**: Alış iadesi
- ~~**Expense (5)**~~: **KALDIRILDI** → Artık `Purchase` + `Item.Type=Expense` kullanılıyor

#### Document Types (`DocumentType` Enum): 🆕 YENİ
- **Invoice (1)**: Standart fatura
- **RetailReceipt (2)**: Perakende satış fişi
- **ExpenseNote (3)**: Masraf belgesi (eski ExpenseList yerine)

#### Kapsamlı Hesaplama:
- **Matrah (Net)**: `(Miktar * Fiyat) - İskonto`
- **İskonto (Discount)**: Satır bazında oran (%) veya tutar
- **KDV (VAT)**: Matrah üzerinden hesaplanan vergi
- **Tevkifat (Withholding)**: KDV'nin belli oranının (örn. 5/10) alıcı tarafından ödenmesi
- **Genel Toplam (Grand Total)**: `Fatura Toplamı - Tevkifat`

#### Masraf/Demirbaş Girişi (Yeni Workflow):
```csharp
// Eskiden: ExpenseList oluştur → Post to Bill
// Şimdi: Purchase Invoice + Expense/FixedAsset tipli Item

// Elektrik faturası girişi
POST /api/invoices {
  Type: InvoiceType.Purchase,
  DocumentType: DocumentType.RetailReceipt,
  Lines: [
    { ItemId: 15, Qty: 1, UnitPrice: 850 }  // Item.Type = Expense
  ]
}

// Demirbaş alımı
POST /api/invoices {
  Type: InvoiceType.Purchase,
  DocumentType: DocumentType.Invoice,
  Lines: [
    { ItemId: 20, Qty: 1, UnitPrice: 25000 }  // Item.Type = FixedAsset
  ]
}
```

### 3. **Items (Stok Kartları)** ✨ GÜNCELLENDİ

**Unified Item Model**: Tüm ürün, hizmet, masraf ve demirbaşlar tek bir Item entity'sinde yönetilir.

**🌍 Global Item Model**: Tüm ürün, hizmet, masraf ve demirbaşlar **tüm şubeler tarafından paylaşılan** tek bir Item entity'sinde yönetilir.

#### 🔑 Önemli: Global vs Şube Bazlı

| Entity | Kapsam | Açıklama |
|--------|--------|----------|
| **Item** | 🌍 GLOBAL | Ürün tanımı tüm şubeler için tek ve ortaktır |
| **Stock** | 🏢 ŞUBE BAZLI | Her şube kendi stok miktarını takip eder |
| **StockMovement** | 🏢 ŞUBE BAZLI | Her şube kendi hareketlerini yönetir |

#### Item Tipleri (`ItemType` Enum):

##### **Inventory (1)**: Stoklu ürünler
- Fiziksel mal - stok takibi yapılır
- **Örnek**: Laptop, Telefon, Çay, Kahve
- **Özellikler**: Alış/Satış fiyatı, Stok hareketi, Depo bazlı takip
- **Stok Hareketi**: ✅ Oluşturulur (StockMovement)

##### **Service (2)**: Hizmetler  
- Stok takibi yapılmaz
- **Örnek**: Teknik destek, Danışmanlık, Kargo hizmeti
- **Özellikler**: Sadece satış fiyatı, Zamana dayalı (saat/gün)
- **Stok Hareketi**: ❌ Oluşturulmaz

##### **Expense (3)**: Masraf kalemleri
- Stok takibi yapılmaz
- **Örnek**: Elektrik, Su, Kira, İnternet
- **Özellikler**: Sadece gider kaydı, Purchase invoice ile girilir
- **Eski Sistem**: ExpenseDefinition + ExpenseList → **KALDIRILDI**
- **Stok Hareketi**: ❌ Oluşturulmaz

##### **FixedAsset (4)**: Demirbaşlar
- Stok takibi yapılmaz
- **Örnek**: Bilgisayar, Masa, Sandalye, Yazıcı
- **Özellikler**: Faydalı ömür (UsefulLifeYears), Sadece Purchase invoice ile girilir
- **Eski Sistem**: FixedAsset entity → **KALDIRILDI**
- **Stok Hareketi**: ❌ Oluşturulmaz

#### Yeni Alanlar:
- `PurchaseAccountCode`: Muhasebe alış hesap kodu (örn: "153" - Ticari Mallar)
- `SalesAccountCode`: Muhasebe satış hesap kodu (örn: "600" - Yurt İçi Satışlar)
- `UsefulLifeYears`: Demirbaş faydalı ömrü (sadece FixedAsset için)

#### Örnek Kullanım:
```csharp
// Laptop (Inventory)
new Item { 
  Type = ItemType.Inventory, 
  Code = "LAP001", 
  PurchasePrice = 12000, 
  SalesPrice = 15000,
  PurchaseAccountCode = "153",
  SalesAccountCode = "600"
}

// Kargo (Service)
new Item { 
  Type = ItemType.Service, 
  Code = "SRV001", 
  SalesPrice = 50, 
  SalesAccountCode = "602"
}

// Elektrik Gideri (Expense)
new Item { 
  Type = ItemType.Expense, 
  Code = "EXP001", 
  PurchaseAccountCode = "770"
}

// Demirbaş Laptop (FixedAsset)
new Item { 
  Type = ItemType.FixedAsset, 
  Code = "FA001", 
  PurchasePrice = 25000, 
  UsefulLifeYears = 5,
  PurchaseAccountCode = "255"
}
```

### 4. **Payments (Tahsilat/Tediye)**
- **Yönler**: In (Tahsilat), Out (Ödeme)
- **İlişkiler**: CashBankAccount, Contact, Invoice
- **Özellikler**: Multi-currency, date range filtering

### 5. **Stock Management (Stok Yönetimi)**
- **Warehouse**: Depo tanımları
- **Stock**: Anlık stok miktarları (Warehouse + Item bazında)
- **StockMovement**: Stok hareketleri
  - **Tipler**: PurchaseIn, SalesOut, SalesReturn, PurchaseReturn, AdjustmentIn, AdjustmentOut

**⚠️ Önemli**: Sadece `ItemType.Inventory` tipindeki item'lar için stok hareketi oluşturulur!

### 6. **Cash/Bank Accounts (Kasa/Banka)**
- **Tipler**: Cash, Bank
- Tahsilat/tediye hesapları

### 7. **Cheques & Promissory Notes (Çek/Senet)**
- **Tipler**: Cheque (Çek), PromissoryNote (Senet)
- **Yönler**: Inbound (Müşteriden alınan), Outbound (Tedarikçiye verilen)
- **Durumlar**: Pending, Paid, Bounced (Karşılıksız), Endorsed (Ciro)

### 8. **Reports (Raporlar)** ✨ GÜNCELLENDİ

#### Gelir-Gider Raporu (Income & Expense Report)

⚠️ **ÖNEMLİ UYARI**: Bu rapor **NAKİT BAZLI** bir gelir-gider tablosudur.

**Ne Değildir:**
- ❌ Kâr-Zarar Tablosu (Profit & Loss Statement) DEĞİLDİR
- ❌ Tahakkuk esası muhasebe raporu DEĞİLDİR
- ❌ COGS (Satılan Malın Maliyeti) içermez
- ❌ Resmi vergi beyannamesi için KULLANILAMAZ

**Ne İçerir:**
- ✅ Dönem içi satış gelirleri (Sales - Sales Returns)
- ✅ Dönem içi stok alımları (Inventory Purchases - Returns)
- ✅ Dönem içi faaliyet giderleri (Expense + Service alımları - Returns)
- ✅ Nakit bazlı fazla/açık
- ✅ KDV dengesi

**Hesaplama Mantığı:**
```
Gelir = Satışlar - Satış İadeleri
Stok Alımları = Inventory Alımları - Alım İadeleri
Faaliyet Giderleri = Expense Alımları + Service Alımları - İadeler
Nakit Fazlası = Gelir - Stok Alımları - Faaliyet Giderleri
```

**Neden COGS Değil?**
- Gerçek COGS için stok envanteri gerekir (Dönem Başı + Alımlar - Dönem Sonu)
- FIFO/LIFO gibi maliyet yöntemleri gerekir
- Bu rapor sadece "ne kadar mal aldık" gösterir, "satılanın maliyeti" değil

**Kimler İçin Uygundur:**
- ✅ KOBİ nakit akışı takibi
- ✅ Günlük/aylık gelir-gider kontrolü
- ✅ Basit finansal durum özeti
- ❌ Resmi mali tablolar için değil

**API Endpoint:**
```
GET /api/reports/income-expense?dateFrom=2026-01-01&dateTo=2026-01-31&branchId=1
```

**Response Örneği:**
```json
{
  "grossSales": 100000,
  "salesReturns": 10000,
  "netIncome": 90000,
  "inventoryPurchases": 60000,
  "inventoryReturns": 5000,
  "netInventoryPurchases": 55000,
  "operatingExpenses": 12000,
  "totalExpenses": 67000,
  "cashSurplus": 23000,
  "vatBalance": 6000
}
```

**Gelecek Geliştirmeler:**
Gerçek Kâr-Zarar Tablosu için:
1. Stok envanter modülü ekle (Dönem Başı/Sonu sayımı)
2. Her satış satırına maliyet alanı ekle (FIFO/LIFO)
3. Tahakkuk esası muhasebe entegrasyonu

### 9. **Identity & Access Management (IAM)**
- **Users**: Kullanıcı yönetimi, şifre hashleme, rol atama
- **Roles**: Dinamik rol ve izin (Permission) yönetimi
- **Güvenlik**: JWT tabanlı, Branch-scoped erişim kontrolü

#### Varsayılan Roller (DataSeeder)

| Rol | Açıklama | Örnek Kullanıcı (Şifre: ...123!) |
|-----|----------|-----------------|
| **Admin** | Sistem Yöneticisi | `admin@demo.local` |
| **Patron** | İşletme Sahibi | `patron@demo.local` |
| **MuhasebeSefi** | Mali Müşavir / Müdür | `sef@demo.local` |
| **OnMuhasebe** | Muhasebe Elemanı | `muhasebe@demo.local` |
| **DepoSorumlusu** | Depo Amiri | `depo@demo.local` |
| **SatisTemsilcisi** | Plasiyer | `satis@demo.local` |

---

## 🔄 Optimistic Concurrency

Her entity `RowVersion` (byte[]) içerir. Güncelleme/silme işlemlerinde concurrency kontrolü yapılır.

### Akış
1. **GET** `/api/invoices/5` → `rowVersion: "AAAAAAAAB9E="` döner
2. **PUT** `/api/invoices/5` → Body'de `rowVersion` gönder
3. Başka biri aynı kaydı değiştirdiyse → **409 Conflict**

---

## 💰 Money & Decimal Policy

### Kurallar
- **Veritabanı**: `decimal(18,2)` veya `decimal(18,3)` (stok için)
- **DTO**: String olarak (`"1500.00"`)
- **Yuvarlama**: `MidpointRounding.AwayFromZero`

---

## 📊 Veritabanı Şeması

### Ana Tablolar

| Tablo | Açıklama | Özel Alanlar |
|-------|----------|--------------|
| `Items` | **Birleşik Stok Kartı** (Ürün/Hizmet/Masraf/Demirbaş) | `Type`, `PurchaseAccountCode`, `SalesAccountCode`, `UsefulLifeYears` |
| `Invoices` | Faturalar (Sales/Purchase + İadeler) | `Type`, `DocumentType` 🆕, `InvoiceNumber`, `Balance` |
| `InvoiceLines` | Fatura Satırları | `ItemId` (ExpenseDefinitionId kaldırıldı ❌) |
| `Contacts` | Cariler (Müşteri/Tedarikçi/Personel) | `IsCustomer`, `IsVendor`, `IsEmployee`, `IsRetail` |
| `Payments` | Tahsilat/Tediye | `Direction`, `InvoiceId`, `CashBankAccountId` |
| `Stocks` | Anlık Stok | `WarehouseId`, `ItemId`, `Quantity` |
| `StockMovements` | Stok Hareketleri | `Type`, `InvoiceId`, `WarehouseId` |
| `CashBankAccounts` | Kasa/Banka Hesapları | `Type`, `Currency`, `Balance` |
| `Cheques` | Çek/Senet | `Type`, `Direction`, `Status`, `DueDate` |
| `Warehouses` | Depolar | `IsDefault`, `BranchId` |
| `Branches` | Şubeler | `IsHeadquarters` |
| `Users` | Kullanıcılar | `BranchId`, `Roles` |

---

## 🔌 API Endpoints

### Items
```
GET    /api/items                 # List (with Type filter support)
GET    /api/items/{id}            # GetById
POST   /api/items                 # Create
PUT    /api/items/{id}            # Update
DELETE /api/items/{id}            # Soft Delete
```

### Invoices
```
GET    /api/invoices              # List
GET    /api/invoices/{id}         # GetById
POST   /api/invoices              # Create (with DocumentType)
PUT    /api/invoices/{id}         # Update
DELETE /api/invoices/{id}         # Soft Delete
```

**Constraint**: Stok negatif olamaz (DB check constraint)

---

## 💰 Decimal & JSON Serialization

### Yaklaşım: JsonConverter ile Otomatik Formatlama

Tüm finansal değerler (tutar, miktar, fiyat) için **merkezi JSON converter** pattern'i kullanılmaktadır. Bu sayede:
- Handler'larda manuel `string` dönüşümü gerekmez
- Tutarlı format garantisi (ör: her zaman `"1250.50"`, asla `1250.5`)
- Tek noktadan kontrol (converter değişince tüm API etkilenir)

### JSON Converters

| Converter | Hassasiyet | Kullanım Alanı | Input/Output |
|-----------|------------|----------------|--------------|
| `AmountJsonConverter` | 2 hane | Tutar, Toplam, Bakiye, Fiyat | `"1250.50"` |
| `QuantityJsonConverter` | 3 hane | Miktar, Adet, Kilo | `"1.500"` |
| `UnitPriceJsonConverter` | 4 hane | Birim Fiyat (maliyet) | `"10.5045"` |
| `PercentJsonConverter` | 2 hane | İskonto, Vergi Oranı | `"18.00"` |

### DTO Örneği

```csharp
public record InvoiceLineDto(
    [property: JsonConverter(typeof(QuantityJsonConverter))]
    decimal Qty,                    // → "1.500"
    
    [property: JsonConverter(typeof(UnitPriceJsonConverter))]
    decimal UnitPrice,              // → "10.5000"
    
    [property: JsonConverter(typeof(AmountJsonConverter))]
    decimal Total                   // → "15.75"
);
```

### Özellikler
- **Bi-directional:** Hem input (request) hem output (response) için çalışır
- **Flexible Input:** String (`"100.50"`) veya number (`100.5`) kabul eder
- **Consistent Output:** Her zaman string formatında döner
- **Auto-rounding:** `MidpointRounding.AwayFromZero` ile yuvarlar

### DecimalExtensions (Hesaplama için)

Handler'larda hesaplama yaparken:
```csharp
var lineNet = DecimalExtensions.RoundAmount(qty * unitPrice);  // 2 hane
var roundedQty = DecimalExtensions.RoundQuantity(qty);         // 3 hane
```

---

## 📦 Sipariş ve Fatura Fiyatlandırması

### KOBİ Kullanım Prensibi

> **"Stok kartını seçince fiyat gelsin, ama ben üzerine yazabileyim"**

Bu Türkiye'deki KOBİ'lerin en yaygın kullanım şeklidir.

### Akış

```
┌─────────────────────────────────────────────────────────┐
│  1. Kullanıcı stok kartı seçer                          │
│     └─► Frontend: GET /api/items/{id}                   │
│                                                         │
│  2. Fiyat otomatik doldurulur                           │
│     └─► Satış Siparişi: item.SalesPrice                 │
│     └─► Alış Siparişi: item.PurchasePrice               │
│                                                         │
│  3. Kullanıcı isterse fiyatı değiştirir                 │
│     └─► Müşteriye özel fiyat, kampanya, toplu indirim   │
│                                                         │
│  4. Backend kullanıcının gönderdiği fiyatı kabul eder   │
│     └─► POST/PUT request'teki UnitPrice kullanılır      │
└─────────────────────────────────────────────────────────┘
```

### Neden Bu Yaklaşım?

| Senaryo | Açıklama |
|---------|----------|
| **Müşteriye özel fiyat** | VIP müşteriye %10 indirimli fiyat |
| **Kampanya** | Yılbaşı indirimi |
| **Toplu alım** | 100+ adet alımda birim fiyat düşer |
| **Geçmiş kayıt** | Eski fatura/sipariş orijinal fiyatı korur |

### Sorumluluk Dağılımı

| Katman | Sorumluluk |
|--------|------------|
| **Frontend** | Item seçilince fiyatı API'den çekip UnitPrice alanına doldurur |
| **Backend** | Request'teki UnitPrice değerini doğrudan kullanır |
| **Validation** | UnitPrice > 0 kontrolü yapar |

---

## 🌐 API Standartları

### Pagination
```json
{
  "items": [...],
  "totalCount": 150,
  "pageNumber": 1,
  "pageSize": 20
}
```
├── Controllers/
│   ├── InvoicesController.cs      ✅ DocumentType desteği
│   ├── ItemsController.cs         ✅ Type bazlı filtreleme
│   ├── ReportsController.cs       ✅ GetIncomeExpense
│   ├── ContactsController.cs
│   ├── PaymentsController.cs
│   └── ...
```

### Sorting
```
?sort=createdAtUtc:desc
?sort=name:asc
│   ├── Commands/Update/
│   └── Queries/
├── Items/
│   ├── Commands/Create/           ✅ Type validasyonu
│   ├── Commands/Update/
│   └── Queries/
├── Reports/
│   └── Queries/GetIncomeExpense/  ✅ Yeni (eski: GetProfitLoss)
└── ...
```

### Date Format
**UTC ISO-8601**: `2025-01-04T10:00:00Z`

### Error Responses (ProblemDetails)
- **400** Validation Error
- **404** Not Found
- **409** Concurrency Conflict

---

## 📋 Enums (Domain/Enums)

- **ItemType** 🆕: Inventory(1), Service(2), Expense(3), FixedAsset(4)
- **InvoiceType**: Sales(1), Purchase(2), SalesReturn(3), PurchaseReturn(4)
- **DocumentType** 🆕: Invoice(1), RetailReceipt(2), ExpenseNote(3)
- **StockMovementType**: PurchaseIn, SalesOut, SalesReturn, PurchaseReturn, AdjustmentIn, AdjustmentOut
- **PaymentMethod**: Cash, CreditCard, BankTransfer, Cheque, PromissoryNote
- **OrderStatus**: Draft, Confirmed, Processing, Shipped, Completed, Cancelled
- **ContactType**: Customer, Vendor, Employee, Retail
- **ChequeStatus**: Pending, Paid, Bounced, Endorsed

---

## 🎯 Migration Bilgisi

### Son Migration: `ConsolidateExpensesAndFixedAssetsIntoItems`

**Yapılan İşlemler:**
1. ❌ ExpenseDefinitions tablosu DROP
2. ❌ ExpenseLists tablosu DROP
3. ❌ ExpenseLines tablosu DROP
4. ❌ FixedAssets tablosu DROP
5. ❌ InvoiceLines.ExpenseDefinitionId kolon DROP
6. ✅ Items.PurchaseAccountCode kolon ADD
7. ✅ Items.SalesAccountCode kolon ADD
8. ✅ Items.UsefulLifeYears kolon ADD
9. ✅ Invoices.DocumentType kolon ADD

**Eski Sistem → Yeni Sistem:**
```
ExpenseDefinition → Item (Type=Expense)
ExpenseList → Purchase Invoice (DocumentType=ExpenseNote)
FixedAsset → Item (Type=FixedAsset)
```

---

## 🚀 Başlangıç

### Gereksinimler
- .NET 8 SDK
- SQL Server 2019+
- Node.js 18+ (Frontend için)

### Kurulum
```bash
# JWT secret'ı ayarla (appsettings.json'da artık default secret YOK - güvenlik gereği)
cd Accounting.Api
dotnet user-secrets init
dotnet user-secrets set "JwtSettings:Secret" "en-az-32-karakterlik-kendi-secret-iniz"
cd ..

# Database oluştur
dotnet ef database update

# API'yi çalıştır
dotnet run --project Accounting.Api

# Test kullanıcılarıyla giriş yap (şifre: ...123!)
admin@demo.local
patron@demo.local
muhasebe@demo.local
```

---

## 📝 DTO Naming Convention

Projede tutarlı DTO isimlendirmesi kullanılmaktadır:

| Kullanım | Suffix | Örnek |
|----------|--------|-------|
| Tek kayıt (GetById) | `DetailDto` | `InvoiceDetailDto` |
| Liste item | `ListItemDto` | `InvoiceListItemDto` |
| Child/Nested | `Dto` | `InvoiceLineDto` |
| Command result | `Result` | `CreateInvoiceResult` |

### Örnek Kullanım

```csharp
// Controller
[HttpGet]
public Task<PagedResult<InvoiceListItemDto>> List(...)  // Liste

[HttpGet("{id}")]
public Task<InvoiceDetailDto> GetById(int id)           // Tek kayıt

[HttpPost]
public Task<CreateInvoiceResult> Create(...)            // Create result

[HttpPut("{id}")]
public Task<InvoiceDetailDto> Update(...)               // Update response
```

---

## 📝 Notlar

### Breaking Changes (v2.0.0)
- ExpenseList modülü kaldırıldı → Purchase Invoice kullanın
- FixedAsset entity kaldırıldı → Item.Type=FixedAsset kullanın
- ProfitLoss raporu → IncomeExpense olarak yeniden adlandırıldı
- Stok takibi sadece ItemType.Inventory için yapılıyor

### Gelecek Özellikler
- [ ] Gerçek COGS hesaplaması (FIFO/LIFO)
- [ ] Envanter sayım modülü
- [ ] İleri düzey raporlar (Bilanço, Gelir Tablosu)

---

**© 2026 Accounting & Inventory Management System**  
Clean Architecture + CQRS + DDD


## نسخهٔ کترینگ

راهنمای پکیج غذا و خدمات، فاکتور ساده، گزارش خرید و طراحی چاپ A4/A5 در [راهنمای کترینگ](docs/CATERING.fa.md) آمده است. migration این نسخه برای اجرا روی دیتابیس شبکه نیازمند تأیید مسئول دیتابیس است.
