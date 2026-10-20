# Expense-first Flow

Bu doküman masraf listesinin (Expense List) iş akışını özetler.

## Akış Diyagramı

<img src="expense-flow.svg" alt="Expense Flow" width="500"/>

## Açıklama

1. **Draft (Taslak)**  
   - Kullanıcı masraf listesini oluşturur.  
   - Masraf satırları eklenebilir, düzenlenebilir veya silinebilir.  
   - Henüz resmi bir muhasebe kaydı oluşmaz.

2. **Reviewed (Onaylandı)**  
   - Liste onaylandığında artık üzerinde satır ekleme/silme yapılamaz.  
   - Bu aşamada masraflar kontrol edilmiş sayılır.  

3. **Posted (Satın Alma Faturası)**  
   - `PostToBill` komutu ile onaylanmış liste tek bir **Purchase Invoice**’a dönüştürülür.  
   - Bu aşamada resmi muhasebe kaydı oluşur.  
   - Listeye bağlı satırlar ilgili faturaya işaret edilir.

## Notlar
- Bu akış **Expense-first** yaklaşımını temsil eder: önce masraf satırları girilir, sonra bunlardan fatura üretilir.  
- Alternatif akış **Bill-first**: doğrudan fatura oluşturma → satırlara bağlama (ileride eklenebilir).  
- Tüm parasal hesaplamalar **backend tarafında (decimal)** yapılır. Frontend sadece girdileri gönderir.

---
