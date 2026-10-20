# 📊 Backend Fatura Tipleri Analizi

**Tarih:** 2026-01-18  
**Amaç:** Fatura sisteminin backend yapısını anlamak

---

## 1️⃣ FATURA TİPLERİ (InvoiceType Enum)

```csharp
public enum InvoiceType
{
    Sales = 1,           // Satış Faturası
    Purchase = 2,        // Alış Faturası
    SalesReturn = 3,     // Satış İade Faturası
    PurchaseReturn = 4,  // Alış İade Faturası
    Expense = 5          // ✨ Masraf/Gider Faturası
}
```

### ✅ Sonuç: 5 Tip Fatura Var

1. **Sales (Satış)** - Müşteriye kesilen fatura
2. **Purchase (Alış)** - Tedarikçiden alınan fatura
3. **SalesReturn (Satış İade)** - Müşteriden geri alınan
4. **PurchaseReturn (Alış İade)** - Tedarikçiye geri verilen
5. **Expense (Masraf)** - Gider faturası ✨

---

## 2️⃣ ÜRÜN/HİZMET TİPLERİ (ItemType Enum)

```csharp
public enum ItemType
{
    Inventory = 1,   // Stoklu Ürün (Fiziksel)
    Service = 2      // Hizmet (Stok takibi yapılmaz)
}
```

### ✅ Sonuç: Hizmet Kartı VAR!

- **Inventory:** Fiziksel ürün, stok takibi yapılır
- **Service:** Hizmet (danışmanlık, taşıma, vb.), stok takibi yapılmaz

---

## 3️⃣ MASRAF SİSTEMİ

### ExpenseDefinition Entity

```csharp
public class ExpenseDefinition
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string Code { get; set; }
    public string Name { get; set; }
    public int DefaultVatRate { get; set; }
    public bool IsActive { get; set; }
    // ... timestamps, soft delete, rowVersion
}
```

### ✅ Sonuç: Masraf Tanımı VAR!

Masraf tanımları, önceden tanımlanmış gider kalemleridir:
- Kira
- Elektrik
- Su
- Telefon
- Danışmanlık
- vb.

---

## 4️⃣ FATURA SATIRI (InvoiceLine)

```csharp
public class InvoiceLine
{
    // İKİ SEÇENEK: ItemId VEYA ExpenseDefinitionId
    public int? ItemId { get; set; }              // Ürün/Hizmet kartı
    public int? ExpenseDefinitionId { get; set; }  // VEYA Masraf tanımı
    
    // Snapshot alanlar (o anki değerler)
    public string ItemCode { get; set; }
    public string ItemName { get; set; }
    public string Unit { get; set; }
    
    // Miktar ve Fiyat
    public decimal Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public int VatRate { get; set; }
    
    // Hesaplamalar
    public decimal Gross { get; set; }          // Brüt (Qty * UnitPrice)
    public decimal DiscountRate { get; set; }   // İskonto oranı %
    public decimal DiscountAmount { get; set; } // İskonto tutarı
    public decimal Net { get; set; }            // Net (Gross - Discount)
    public decimal Vat { get; set; }            // KDV
    public int WithholdingRate { get; set; }    // Tevkifat oranı %
    public decimal WithholdingAmount { get; set; } // Tevkifat tutarı
    public decimal GrandTotal { get; set; }     // Genel Toplam (Net + Vat)
}
```

---

## 5️⃣ SORULARIN CEVAPLARI

### ❓ Hizmet faturası var mı?

✅ **EVET!** Hizmet, Item entity'si içinde bir tip olarak var:
- Item tablosunda `Type = Service` olan kayıtlar hizmet kartıdır
- Satış/Alış faturalarına hizmet kartı eklenebilir
- Hizmet kartları stok hareketi yaratmaz

**Özel hizmet faturası yok, normal Sales/Purchase faturası içinde hizmet satırı olur.**

---

### ❓ Masraf faturası var mı?

✅ **EVET!** İki şekilde:

#### 1. InvoiceType.Expense (Tip 5)
Tamamen masraf için ayrılmış fatura tipi.

#### 2. ExpenseDefinition
Masraf tanımları vardır ve fatura satırında kullanılabilir.

**Masraf sistemi iki şekilde kullanılabilir:**
- **Seçenek A:** Normal Purchase faturasında ExpenseDefinition kullanmak
- **Seçenek B:** InvoiceType.Expense ile özel masraf faturası kesmek

---

### ❓ Hizmet kartı satınalma faturasında satır olabilir mi?

✅ **EVET!** Kesinlikle olabilir.

**Örnek Senaryo:**
```
Satınalma Faturası (Purchase)
├─ Satır 1: Laptop (Item, Type=Inventory)    → Stok hareketi yaratır
├─ Satır 2: Danışmanlık (Item, Type=Service) → Stok hareketi yaratmaz
└─ Satır 3: Kargo (ExpenseDefinition)        → Masraf kalemi
```

**Her satırda şu alanlardan BİRİ dolu olur:**
- `ItemId` (Stok veya hizmet kartı)
- `ExpenseDefinitionId` (Masraf tanımı)

---

## 6️⃣ FATURA TİPİ - SATIŞ OLUŞTURMA MATRİSİ

| Fatura Tipi | ItemId (Stok) | ItemId (Hizmet) | ExpenseDefinitionId | Stok Hareketi |
|-------------|---------------|-----------------|---------------------|---------------|
| **Sales** | ✅ | ✅ | ❌ | Stoklu ise çıkar |
| **Purchase** | ✅ | ✅ | ✅ | Stoklu ise girer |
| **SalesReturn** | ✅ | ✅ | ❌ | Stoklu ise girer |
| **PurchaseReturn** | ✅ | ✅ | ❌ | Stoklu ise çıkar |
| **Expense** | ❌ | ❌ | ✅ | Asla |

### Kurallar:
1. **Sales/SalesReturn:** Sadece Item kullanılır (ExpenseDefinition kullanılmaz)
2. **Purchase/PurchaseReturn:** Hem Item hem ExpenseDefinition kullanılabilir
3. **Expense:** Sadece ExpenseDefinition kullanılır
4. **Stok hareketi:** Sadece `ItemType.Inventory` olan itemler için yapılır

---

## 7️⃣ HESAPLAMA AKIŞI

```
1. Gross = Qty × UnitPrice
2. DiscountAmount = Gross × (DiscountRate / 100)
3. Net = Gross - DiscountAmount
4. Vat = Net × (VatRate / 100)
5. WithholdingAmount = Vat × (WithholdingRate / 100)
6. GrandTotal = Net + Vat
7. Payable = GrandTotal - WithholdingAmount  // Ödenecek
```

**Backend'de hesaplama handler'larda yapılıyor, frontend sadece gönderiyor.**

---

## 8️⃣ FRONTEND İÇİN KARARLAR

### Create/Edit Form Tasarımı

#### Fatura Tipi Seçimi (Dropdown)
```typescript
const invoiceTypes = [
  { value: 1, label: 'Satış' },
  { value: 2, label: 'Alış' },
  { value: 3, label: 'Satış İade' },
  { value: 4, label: 'Alış İade' },
  { value: 5, label: 'Masraf/Gider' }
];
```

#### Satır Eklerken
```typescript
// Fatura tipi Sales/SalesReturn/PurchaseReturn ise:
- Sadece Item seçimi (Autocomplete: Stok veya Hizmet)

// Fatura tipi Purchase ise:
- Item VEYA ExpenseDefinition seçimi (Radio button veya toggle)

// Fatura tipi Expense ise:
- Sadece ExpenseDefinition seçimi
```

### Validasyon Kuralları

```typescript
// InvoiceLine validation
if (invoiceType === InvoiceType.Expense) {
  // ExpenseDefinitionId zorunlu, ItemId null olmalı
  itemId: null,
  expenseDefinitionId: required
}
else if (invoiceType === InvoiceType.Purchase) {
  // ItemId VEYA ExpenseDefinitionId (biri zorunlu)
  oneOf: [itemId, expenseDefinitionId]
}
else {
  // ItemId zorunlu, ExpenseDefinitionId null olmalı
  itemId: required,
  expenseDefinitionId: null
}
```

---

## 9️⃣ ÖNERİLER

### Frontend Form Yapısı

```
┌─────────────────────────────────────────────┐
│ Fatura Oluştur                              │
├─────────────────────────────────────────────┤
│                                             │
│ Tip: [Dropdown: Satış/Alış/İade/Masraf]   │
│ Tarih: [DatePicker]                        │
│ Cari: [Autocomplete: Contact]              │
│ Para Birimi: [TRY/USD/EUR]                 │
│                                             │
│ ─────────────────────────────────────────  │
│ SATIRLAR:                                   │
│ ─────────────────────────────────────────  │
│                                             │
│ [+ Stok/Hizmet Ekle] [+ Masraf Ekle]      │
│   ^                    ^                    │
│   │                    │                    │
│   └─ ItemId           └─ ExpenseDefinitionId│
│                                             │
│ Grid:                                       │
│ ┌───┬────────┬────┬─────┬─────┬──────┐   │
│ │Tip│ Adı    │Mik.│Fiyat│ KDV │Tutar │   │
│ ├───┼────────┼────┼─────┼─────┼──────┤   │
│ │📦 │Laptop  │1   │5000 │20%  │6000  │   │
│ │🔧 │Danışmn.│8   │500  │20%  │4800  │   │
│ │💰 │Kira    │1   │2000 │20%  │2400  │   │
│ └───┴────────┴────┴─────┴─────┴──────┘   │
│                                             │
│              Toplam: 13,200.00 TRY         │
└─────────────────────────────────────────────┘
```

### İkonlar
- 📦 Inventory (Stok)
- 🔧 Service (Hizmet)
- 💰 ExpenseDefinition (Masraf)

---

## 🎯 SONUÇ & KARAR

### ✅ Kesin Bilgiler:
1. **5 Fatura Tipi var:** Sales, Purchase, SalesReturn, PurchaseReturn, Expense
2. **Hizmet kartı var:** Item.Type = Service
3. **Masraf tanımı var:** ExpenseDefinition entity
4. **Karışık satır olabilir:** Purchase faturasında hem stok hem hizmet hem masraf

### 📋 Frontend CRUD Sayfası İçin:
1. **Fatura tipi seçimi** dropdown'a 5 seçenek eklenecek
2. **Satır ekleme** fatura tipine göre değişecek:
   - Sales/Return → Sadece Item (stok veya hizmet)
   - Purchase → Item VEYA ExpenseDefinition
   - Expense → Sadece ExpenseDefinition
3. **Grid kolonları** şunları içerecek:
   - Tip ikonu (📦/🔧/💰)
   - İsim
   - Miktar
   - Birim Fiyat
   - İskonto
   - KDV
   - Tevkifat
   - Toplam

---

**Hazırlayan:** Backend Code Analysis  
**Tarih:** 2026-01-18  
**Durum:** Analiz Tamamlandı ✅
