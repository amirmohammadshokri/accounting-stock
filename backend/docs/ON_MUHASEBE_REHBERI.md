# 📘 Ön Muhasebe 101: Başlangıç Rehberi

Bu rehber, muhasebe eğitimi almamış işletme sahipleri ve çalışanlar için **Ön Muhasebe** mantığını en basit haliyle anlatmak ve bu yazılımı nasıl verimli kullanabileceğinizi göstermek için hazırlanmıştır.

---

## 🏗️ 1. Temel Kavramlar: İşletmenin Yapı Taşları

Ön muhasebe, işletmenin **günlük finansal hareketlerinin** kaydedilmesidir. "Resmi Muhasebe" (devlete vergi ödemek için yapılan) ile karıştırılmamalıdır. Ön muhasebe **sizin** işletmenizi yönetmeniz içindir.

### 📌 Cari Hesap (Current Account)
İş yaptığınız **kişi veya firmalardır**.
*   **Müşteriler:** Mal veya hizmet sattığınız kişiler. (Size para verecekler -> Borçlular)
*   **Tedarikçiler:** Mal aldığınız toptancılar. (Siz para vereceksiniz -> Alacaklılar)

> **💡 İpucu:** Cari kart açarken bilgileri eksiksiz girmek (Vergi No, Adres) ileride e-Fatura keserken işinizi çok kolaylaştırır.

### 🧾 Fatura (Invoice)
Yapılan ticaretin "resmi belgesi"dir.
*   **Alış Faturası:** Mal aldığınızda toptancı size keser. Stoklarınız artar, toptancıya borcunuz artar.
*   **Satış Faturası:** Mal sattığınızda siz kesersiniz. Stoklarınız azalır, müşteriden alacağınız artar.

> **⚠️ Kritik Bilgi (KDV):** Fatura tutarı 1.000 TL + %20 KDV ise;
> *   1.000 TL (Net): Sizin cebinize giren/çıkan para.
> *   200 TL (KDV): Devlet adına emanet aldığınız veya ödediğiniz para.
> *   İşletme karlılığınızı hesaplarken her zaman **NET** tutara (KDV hariç) bakmalısınız!

---

## 💰 2. Nakit Akışı Yönetimi (Kasa & Banka)

İşletmenin "kan dolaşımı"dır. Kar etmek ile parası olmak aynı şey değildir!

### Kasa (Cash)
Elinizdeki fiziksel nakit paradır.
*   Günlük ufak harcamalar (yemek, yol) buradan yapılır.
*   Perakende satıştan gelen nakit buraya girer.

### Banka Hesabı
Banka hesaplarınızdaki dijital paradır.
*   EFT/Havale ile gelen ödemeler buraya işlenir.
*   Kredi kartı POS cihazından çekilen paralar (genelde ertesi gün) buraya düşer.

### ⚖️ Bakiye Takibi (Balance Tracking)
Programda **"Ödeme Ekle (Payment)"** dediğinizde 3 şey olur:
1.  **Cari Bakiye Düşer:** Müşterinin borcu azalır.
2.  **Kasa/Banka Artar:** Seçtiğiniz hesabın bakiyesi yükselir.
3.  **Fatura Kapanır:** Eğer ödemeyi bir faturayla eşleştirdiyseniz, o faturanın `Kalan` tutarı sıfırlanır.

---

## 📦 3. Stok Yönetimi

Deponuzda ne var ne yok?
*   **Stok Girişi:** Alış Faturası girince otomatik artar.
*   **Stok Çıkışı:** Satış Faturası girince otomatik azalır.
*   **Kritik Stok:** "Elimde 5 tane kaldı, sipariş ver" uyarısı almak için her ürüne alt sınır koyabilirsiniz.

> **Hizmet Satışı:** Eğer fiziksel bir ürün değil, hizmet (Danışmanlık, İşçilik) satıyorsanız, bu kalemleri "Hizmet" türünde açmalısınız. Bunların stoğu düşmez.

---

## 📊 4. Raporlama: İşletmem Nasıl Gidiyor?

Programın en değerli kısmı burasıdır. Veriyi hamallık olsun diye değil, karar vermek için girersiniz.

### Kasa/Banka Durumu (Nakit Durumu)
*"Şu an toplam ne kadar param var?"* sorusunun cevabıdır.
> Formül: (Tüm Kasalar) + (Tüm Bankalar)

### Cari Yaşlandırma (Aging)
*"Bana kimin borcu var ve ne zamandır ödemiyor?"*
*   **0-30 Gün:** Güncel alacaklar.
*   **60+ Gün:** Tehlikeli alacaklar! (Aramanız lazım).

### Kar/Zarar (Profit/Loss)
*"Bu ay para kazandım mı?"*
> Formül: (Toplam Satış Faturaları Net Tutarı) - (Toplam Alış Faturaları Net Tutarı + Masraflar)

> **DİKKAT:** Bu ay 1 Milyon TL ciro yapıp zarar etmiş olabilirsiniz (Eğer maliyetiniz 1.1 Milyon ise). Ciroya değil, kar'a odaklanın.

---

## 📝 5. Çek & Senet (Yakında...)

Türkiye ticaretinin vazgeçilmezidir. Nakit olmayan ama "vadesi gelince" nakde dönen kağıtlardır.
*   **Portföy:** Müşteriden aldığınız, henüz bankaya vermediğiniz çekler.
*   **Tahsil:** Günü geldi, bankadan parası alındı.
*   **Ciro Etmek:** Müşteriden aldığınız çeki, kendi borcunuza karşılık toptancıya vermek. (Parayı görmeden borç ödemek).

---

## 🚀 Son Söz: Disiplin
En iyi yazılım bile veri girilmezse çöp olur.
1.  Faturaları günü gününe işleyin.
2.  Ödemeleri (giriş/çıkış) atlamayın.
3.  Haftada bir raporlara (Dashboard) bakın.

Başarılar!
