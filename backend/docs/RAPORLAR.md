# Raporlar Dokümantasyonu

Bu belge, proje kapsamında geliştirilen finansal ve operasyonel raporların detaylarını içerir.

## 1. Gösterge Paneli (Dashboard)
**Endpoint:** `/api/reports/dashboard`

Şirketin finansal durumuna dair anlık özet bilgileri içerir.

### İçerik:
*   **DailySales (Günlük Satışlar):** Bugün kesilen Satış Faturalarının toplamı (Tahakkuk esaslı - tahsil edilip edilmediğine bakılmaz).
*   **DailyCollection (Günlük Tahsilat):** Bugün kasaya/bankaya giren Ödemelerin toplamı (Nakit esaslı).
*   **TotalReceivables (Toplam Alacaklar):** Müşterilerden alacakların toplam bakiyesi.
*   **TotalPayables (Toplam Borçlar):** Tedarikçilere olan borçların toplam bakiyesi.
*   **CashStatus (Kasa/Banka Durumu):** Mevcut Kasa ve Banka hesaplarının anlık bakiyeleri.

---

## 2. Stok Durum Raporu (Stock Status Report)
**Endpoint:** `/api/reports/stock-status`
**Excel İndir:** `/api/reports/stock-status/export`

Sistemdeki tüm ürünlerin stok hareketlerini ve güncel mevcudunu gösterir.

### Hesaplama Mantığı:
*   **Giren (QuantityIn):** Alış Faturalarındaki (InvoiceType.Purchase) toplam miktar.
*   **Çıkan (QuantityOut):** Satış Faturalarındaki (InvoiceType.Sales) toplam miktar.
*   **Rezerve (QuantityReserved):** Onaylanmış (Approved) ancak henüz faturalaşmamış Satış Siparişlerinin miktarı.
*   **Mevcut (QuantityAvailable):** `(Giren - Çıkan) - Rezerve`

> **Önemli:** Sistem stoktan düşümü fatura kesildiğinde yapar. Ancak sipariş onaylandığında o ürünü satışa uygun stoktan "Rezerve" ederek başkasına satılmasını engeller.

---

## 3. Cari Hesap Ekstresi (Contact Statement)
**Endpoint:** `/api/reports/contact/{id}/statement`
**Excel İndir:** `/api/reports/contact/{id}/statement/export`
*   **Filtreler:** `dateFrom`, `dateTo` (Opsiyonel)

Belirli bir Cari Hesabın (Müşteri veya Tedarikçi) tüm hareketlerini tarih sırasına göre listeler.

### İçerik:
*   **Tarih:** İşlem tarihi.
*   **İşlem Türü:** Fatura, Tahsilat, Ödeme vb.
*   **Evrak No:** Fatura veya işlem numarası.
*   **Borç:** Carinin bize borçlandığı tutar (Örn: Satış Faturası).
*   **Alacak:** Carinin alacaklandığı tutar (Örn: Ödeme yapması veya Alış Faturası).
*   **Bakiye:** Kümülatif (yürüyen) bakiye.

---

## 4. Kâr / Zarar Raporu (Profit / Loss Report)
**Endpoint:** `/api/reports/profit-loss`
**Filtreler:** `dateFrom`, `dateTo` (Opsiyonel)

Belirli bir dönemdeki tahmini kârlılığı gösterir.

### Hesaplama Mantığı (Basit Ön Muhasebe):
Bu rapor **tahakkuk esaslı** çalışır (Faturalar baz alınır, tahsilatlar değil).

*   **(+) Gelirler (Income):** Satış Faturalarının KDV Hariç toplamı.
*   **(-) Satılan Malın Maliyeti (Cost of Goods):** Alış Faturalarının KDV Hariç toplamı.
    *   *Not: Basit modelde, alınan her mal direkt gider/maliyet olarak düşülür. Stok değerlemesi yapılmaz.*
*   **(-) Giderler (Expenses):** Masraf Fişlerinin KDV Hariç toplamı.
*   **(=) Brüt Kâr:** Gelirler - Maliyetler
*   **(=) Net Kâr:** Brüt Kâr - Giderler

> **Vergi Notu:** Raporda ayrıca tahmini KDV durumu (Ödenecek/Devreden) da bilgi amaçlı gösterilir.
