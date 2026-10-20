# Çek ve Senet Yönetimi Modülü

Bu modül, işletmenin hem müşterilerden aldığı (Alacak) hem de tedarikçilere verdiği (Borç) kıymetli evrakların (Çek ve Senet) takibini sağlar.

## 1. Temel Kavramlar

### Evrak Türü (Type)
*   **Çek (Cheque):** Banka hesabına bağlı olarak düzenlenen kıymetli evrak.
*   **Senet (PromissoryNote):** Belirli bir vadede ödeme taahhüdü içeren evrak.

> **Not:** Sistemde Çek ve Senet aynı yapı üzerinde tutulur, sadece "Type" alanı farklıdır. İşleyiş mantıkları %99 aynıdır.

### Yön (Direction)
*   **Inbound (Giriş / Müşteri Çeki):** Müşteriden alacak karşılığı alınan evraktır. Portföyümüze girer.
*   **Outbound (Çıkış / Kendi Çekimiz):** Tedarikçiye borç karşılığı verilen evraktır.

### Durumlar (Status)
1.  **Pending (Portföyde / Bekliyor):** Evrak henüz vadesi gelmemiş veya işlem yapılmamış halde sistemde kayıtlıdır.
2.  **Paid (Tahsil Edildi / Ödendi):**
    *   *Giriş Çeki:* Bankadan veya Kasadan tahsil edilmiştir. (Kasa/Banka bakiyesi artar).
    *   *Çıkış Çeki:* Banka hesabımızdan ödenmiştir. (Banka bakiyesi azalır).
3.  **Endorsed (Ciro Edildi):** Portföydeki müşteri çeki, başka bir tedarikçiye borç karşılığı verilmiştir. (Sadece Giriş çekleri ciro edilebilir).
4.  **Bounced (Karşılıksız):** Çekin karşılığı çıkmamış veya senet protesto olmuştur.

---

## 2. İş Akışları (Workflows)

### A. Çek/Senet Girişi (Müşteriden Alma)
Cari hesaptan ödeme olarak çek alındığında kullanılır.
*   **İşlem:** `POST /api/cheques`
*   **Yön:** `Inbound`
*   **Durum:** `Pending`
*   **Etki:** Cari hesabın bakiyesinden düşülür (Alacak azalır), Portföy hesabı artar.

### B. Çek/Senet Çıkışı (Tedarikçiye Verme)
Tedarikçiye ödeme olarak kendi çekimiz verildiğinde kullanılır.
*   **İşlem:** `POST /api/cheques`
*   **Yön:** `Outbound`
*   **Durum:** `Pending`
*   **Etki:** Cari hesabın bakiyesinden düşülür (Borç azalır), "Verilen Çekler" riski oluşur.

### C. Tahsilat (Portföydeki Çeki Bozdurma)
Vadesi gelen müşteri çekinin tahsil edilmesidir.
*   **İşlem:** `PUT /api/cheques/{id}/status` -> `Paid`
*   **Gerekli:** Hangi Kasa/Banka hesabına girdiği seçilmelidir.
*   **Sistem:** Otomatik olarak bir **Tahsilat (Payment In)** kaydı oluşturur ve ilgili kasa bakiyesini artırır.

### D. Ödeme (Kendi Çekimizin Ödenmesi)
Bankadaki hesabımızdan çekin ödenmesi durumudur.
*   **İşlem:** `PUT /api/cheques/{id}/status` -> `Paid`
*   **Gerekli:** Hangi bankadan ödendiği seçilmelidir.
*   **Sistem:** Otomatik olarak bir **Ödeme (Payment Out)** kaydı oluşturur ve banka bakiyesini düşürür.

### E. Ciro Etme (Endorsement)
Elimizdeki müşteri çekini borcumuza karşılık başkasına verme işlemidir.
*   **İşlem:** Bu özellik henüz API'de `PUT /api/cheques/{id}/endorse` olarak planlanmıştır ancak temel durum güncellemesi ile yönetilebilir.
*   **Durum:** `Endorsed`

---

## 3. Teknik Detaylar (API)

| Metot | Endpoint | Açıklama |
| :--- | :--- | :--- |
| `POST` | `/api/cheques` | Yeni Çek/Senet oluşturur (Giriş veya Çıkış). |
| `PUT` | `/api/cheques/{id}/status` | Çek durumunu günceller (Tahsilat/Ödeme yapar). Body: `{ "newStatus": 2, "cashBankAccountId": 5 }` |
| `GET` | `/api/cheques` | Çekleri listeler (Filtreleme yapılabilir). |

> **Önemli:** `Paid` statüsüne alınan bir çekin durumu tekrar değiştirilemez (Muhasebe güvenliği için). Hatalı işlem durumunda ters kayıt (iade) yapılması önerilir.
