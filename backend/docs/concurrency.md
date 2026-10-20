# Optimistic Concurrency (İyimser Eşzamanlılık)

## Amaç
Bir kaydı aynı anda birden fazla kullanıcının görüntüleyip değiştirmesi durumunda **veri kaybını önlemek**.  
EF Core’da bu amaç için `RowVersion` (timestamp) kullanıyoruz.

## Mantık
- **RowVersion**: SQL Server tarafından her güncellemede otomatik değiştirilen bayt dizisi.  
- EF Core’da `IsRowVersion()` ile **concurrency token** yapılır.  
- API’de `base64` string olarak taşınır.

## Senaryo
1. **Kullanıcı A** kaydı okur → RowVersion: `0x55B`.  
2. **Kullanıcı B** aynı kaydı okur → RowVersion: `0x55B`.  
3. **B günceller** → DB RowVersion değerini `0x66A` yapar.  
4. **A güncelleme/silme dener** → kendi elindeki `0x55B`’i gönderir.  
5. EF Core farkı yakalar → `DbUpdateConcurrencyException` → API **ProblemDetails (409/400)** döner.  
6. A sayfayı yeniler → güncel veriyi ve yeni `RowVersion`’ı görür.

## API Akışı
- `GET /api/invoices/{id}` → yanıt içinde `rowVersion` (base64).  
- `PUT/DELETE` → body içinde aynı `rowVersion` geri gönderilir.  
- DB’de değer değiştiyse → işlem reddedilir.

## Neden Önemli?
- **Veri bütünlüğü**: “Son yazan kazanır” sorununu engeller.  
- **Çakışma algılama**: Kullanıcıya “Bu kayıt başka biri tarafından değiştirildi” mesajı verilebilir.  
- **Kurumsal pratik**: ERP, CRM, finans uygulamalarında standart yaklaşım.

## Notlar
- Şu an `Invoice` entity’sinde `RowVersion` var.  
- Gerekirse `InvoiceLine` gibi alt entity’lere de eklenebilir.  
- Hata kodu tercihi: `409 Conflict` veya `412 Precondition Failed` olabilir.
