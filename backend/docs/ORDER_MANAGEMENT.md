# Sipariş Yönetimi (Order Management)

Bu modül, muhasebe sistemi içerisindeki **Teklif -> Sipariş -> Fatura** akışını yönetmek için tasarlanmıştır.

## Genel Akış (Workflow)

Sipariş süreci şu adımlardan oluşur:

1.  **Taslak (Draft):**
    *   Sipariş ilk oluşturulduğunda `Draft` statüsündedir.
    *   Bu aşamada bir "Teklif" niteliğindedir.
    *   Stoklara veya cari bakiyesine **etkisi yoktur**.
    *   İstenildiği kadar güncellenebilir veya silinebilir.

2.  **Onaylandı (Approved):**
    *   Teklif müşteri tarafından kabul edildiğinde veya satınalma onaylandığında sipariş `Approved` statüsüne çekilir.
    *   Bu aşamada sipariş kesinleşmiştir.
    *   Hala stok veya cari bakiyeye **finansal bir etkisi yoktur** (Rezervasyon mantığı ileride eklenebilir).
    *   Bu aşamadaki sipariş **silinemez** (önce iptal edilmelidir) ve içeriği **değiştirilemez**.

3.  **Faturalandı (Invoiced):**
    *   Sipariş sevk edildiğinde veya hizmet verildiğinde tek tuşla faturaya dönüştürülür.
    *   Sistem, sipariş bilgilerini kopyalayarak yeni bir **Fatura (Invoice)** kaydı oluşturur.
    *   Siparişin statüsü `Invoiced` olur ve süreç tamamlanır.
    *   Oluşan fatura, stokları ve cari bakiyeyi etkiler.

4.  **İptal (Cancelled):**
    *   Taslak veya Onaylı siparişler iptal edilebilir.
    *   İptal edilen siparişler raporlamada görünür ancak işleme alınmaz.

## Veri Modeli

### Order (Sipariş Başlığı)
*   **OrderNumber:** Sipariş Numarası (Tekil).
*   **Type:** `Sales` (Satış) veya `Purchase` (Alış).
*   **Status:** `Draft` (1), `Approved` (2), `Invoiced` (3), `Cancelled` (9).
*   **Totals:** `TotalNet`, `TotalVat`, `TotalGross` (Sipariş toplamları).
*   **Currency:** Para birimi (örn: TRY, USD).

### OrderLine (Sipariş Satırları)
*   **ItemId / Description:** Ürün veya hizmet tanımı.
*   **Quantity:** Miktar.
*   **UnitPrice:** Birim Fiyat.
*   **VatRate:** KDV Oranı.
*   **Total:** Satır Toplamı.

## API Kullanımı

### 1. Sipariş Oluşturma (Taslak)
**POST** `/api/orders`
```json
{
  "branchId": 1,
  "contactId": 10,
  "dateUtc": "2024-01-01T10:00:00Z",
  "type": 1, // 1: Sales, 2: Purchase
  "lines": [
    { "itemId": 5, "quantity": "10", "unitPrice": "100.00", "vatRate": 20 }
  ]
}
```

### 2. Siparişi Onaylama
**PUT** `/api/orders/{id}/approve`
*   Siparişi onaylar ve kilitler.

### 3. Faturaya Dönüştürme
**POST** `/api/orders/{id}/create-invoice`
*   Onaylı siparişi faturaya çevirir.
*   Dönen yanıt, yeni oluşturulan **Fatura ID**'sidir.

## Kurallar
*   Sadece `Draft` statüsündeki siparişler güncellenebilir veya silinebilir.
*   Sadece `Approved` statüsündeki siparişler faturaya dönüştürülebilir.
*   Silinen ürünler (`Soft Delete`) siparişlerde tarihçesi korunarak saklanır.
