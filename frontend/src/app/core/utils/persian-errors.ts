import { persianDigits } from './persian.utils';

const MESSAGES: Record<string, string> = {
  "Invalid credentials.": "ایمیل یا رمز عبور اشتباه است.",
  "User is not active.": "حساب کاربری غیرفعال است.",
  "Invalid or expired refresh token.": "نشست منقضی شده است؛ دوباره وارد شوید.",
  "Email already exists": "این ایمیل قبلاً ثبت شده است.",
  "Email is required": "ایمیل الزامی است.",
  "First name is required": "نام الزامی است.",
  "Last name is required": "نام خانوادگی الزامی است.",
  "Invalid email format": "قالب ایمیل معتبر نیست.",
  "Password is required": "رمز عبور الزامی است.",
  "Password must be at least 8 characters": "رمز عبور باید حداقل ۸ نویسه داشته باشد.",
  "Password must contain at least one lowercase letter": "رمز عبور باید حداقل یک حرف کوچک لاتین داشته باشد.",
  "Password must contain at least one uppercase letter": "رمز عبور باید حداقل یک حرف بزرگ لاتین داشته باشد.",
  "Password must contain at least one number": "رمز عبور باید حداقل یک عدد داشته باشد.",
  "At least one role must be assigned": "حداقل یک نقش انتخاب کنید.",
  "One or more role IDs are invalid": "یک یا چند نقش انتخاب‌شده نامعتبر است.",
  "Role name already exists": "این نام نقش قبلاً ثبت شده است.",
  "Cannot delete role with assigned users": "این نقش به کاربر اختصاص دارد و قابل حذف نیست.",
  "Cannot delete invoice with linked payments. Please delete payments first.": "ابتدا پرداخت‌های مرتبط را حذف کنید؛ سپس فاکتور قابل حذف است.",
  "Cannot delete paid or bounced cheque": "چک وصول‌شده یا برگشتی قابل حذف نیست.",
  "Linked invoice not found, deleted, or belongs to another branch.": "فاکتور مرتبط یافت نشد، حذف شده یا متعلق به شعبهٔ دیگری است.",
  "Payment amount exceeds invoice balance.": "مبلغ پرداخت از ماندهٔ فاکتور بیشتر است.",
  "Payment currency must match invoice currency.": "واحد پول پرداخت باید با فاکتور یکسان باشد.",
  "ItemId is required for all invoice lines": "انتخاب کالا برای تمام ردیف‌های فاکتور الزامی است.",
  "Bu kategoriye bağlı ürünler olduğu için silinemez.": "این دسته‌بندی دارای کالا است و قابل حذف نیست.",
  "Bu şube kodu zaten kullanılıyor.": "این کد شعبه قبلاً ثبت شده است.",
  "Cari (Contact) fatura ile aynı şubeye ait olmalıdır.": "طرف حساب و فاکتور باید متعلق به یک شعبه باشند.",
  "Cari bulunamadı veya bu şubeye ait değil.": "طرف حساب یافت نشد یا متعلق به این شعبه نیست.",
  "Cari bulunamadı.": "طرف حساب یافت نشد.",
  "Cari kart Şahıs veya Şirket bilgilerinden en az birini içermelidir.": "حداقل اطلاعات شخص حقیقی یا شرکت را برای طرف حساب وارد کنید.",
  "Currency ISO 4217 3-haneli olmalı (örn. TRY, USD).": "کد واحد پول باید سه حرف لاتین باشد.",
  "DateUtc gereklidir.": "تاریخ الزامی است.",
  "DateUtc geçerli bir tarih olmalıdır.": "تاریخ معتبر وارد کنید.",
  "Demirbaşlar için faydalı ömür 1-50 yıl arası olmalıdır": "عمر مفید دارایی ثابت باید بین ۱ تا ۵۰ سال باشد.",
  "En az bir satır girmelisiniz.": "حداقل یک ردیف وارد کنید.",
  "En az bir satır olmalıdır.": "حداقل یک ردیف لازم است.",
  "En az bir sipariş kalemi gereklidir.": "حداقل یک قلم سفارش لازم است.",
  "Farklı şubeler arası depo transferi (henüz) desteklenmiyor.": "انتقال انبار بین شعبه‌های مختلف پشتیبانی نمی‌شود.",
  "Fatura satırlarındaki bir veya daha fazla ürün bulunamadı.": "یک یا چند کالای فاکتور یافت نشد.",
  "Faturalandırılmış siparişler iptal edilemez.": "سفارش فاکتور‌شده قابل لغو نیست.",
  "Firma ünvanı boş olamaz.": "نام شرکت الزامی است.",
  "Firma ünvanı en fazla 200 karakter olabilir.": "نام شرکت حداکثر ۲۰۰ نویسه است.",
  "Geçerli bir belge türü seçiniz.": "نوع سند معتبر انتخاب کنید.",
  "Geçersiz e-posta adresi formatı.": "قالب ایمیل معتبر نیست.",
  "Geçersiz fatura türü.": "نوع فاکتور معتبر نیست.",
  "Geçersiz stok hareket tipi.": "نوع گردش انبار معتبر نیست.",
  "Hedef depo bulunamadı.": "انبار مقصد یافت نشد.",
  "Kaynak depo bulunamadı.": "انبار مبدأ یافت نشد.",
  "Kaynak ve hedef depo aynı olamaz.": "انبار مبدأ و مقصد باید متفاوت باشند.",
  "Kasa/Banka hesabı bulunamadı veya bu şubeye ait değil.": "حساب صندوق / بانک یافت نشد یا متعلق به این شعبه نیست.",
  "KDV oranı 0, 1, 10 veya 20 olmalıdır.": "نرخ مالیات باید ۰، ۱، ۱۰ یا ۲۰ باشد.",
  "Lines içinde tekrar eden satır Id değerleri var.": "شناسهٔ برخی ردیف‌ها تکراری است.",
  "Lines null olamaz.": "ردیف‌ها نمی‌توانند خالی باشند.",
  "Müşteri evrağı girişinde cari seçimi zorunludur.": "برای ثبت سند مشتری، انتخاب طرف حساب الزامی است.",
  "Perakende müşteri (Retail) aynı zamanda Kurumsal Müşteri (Customer) olamaz.": "مشتری خرده‌فروشی نمی‌تواند همزمان مشتری سازمانی باشد.",
  "Personel (Employee) kaydı mutlaka Şahıs bilgilerini (Person Details) içermelidir.": "برای کارمند، اطلاعات شخص حقیقی الزامی است.",
  "Personel (Employee) kaydı mutlaka Şahıs bilgilerini içermelidir.": "برای کارمند، اطلاعات شخص حقیقی الزامی است.",
  "Sadece 'Taslak' durumundaki siparişler onaylanabilir.": "فقط سفارش‌های پیش‌نویس قابل تأیید هستند.",
  "Sadece onaylı siparişler faturaya dönüştürülebilir.": "فقط سفارش تأیید‌شده قابل تبدیل به فاکتور است.",
  "Sadece taslak durumundaki siparişler güncellenebilir.": "فقط سفارش‌های پیش‌نویس قابل ویرایش هستند.",
  "Sadece taslak veya iptal durumundaki siparişler silinebilir.": "فقط سفارش‌های پیش‌نویس یا لغوشده قابل حذف هستند.",
  "Seçilen cari (Contact) bu şubeye ait değil.": "طرف حساب انتخاب‌شده متعلق به این شعبه نیست.",
  "Sipariş zaten iptal edilmiş.": "سفارش قبلاً لغو شده است.",
  "Tahsilat/Ödeme işlemi için Kasa/Banka hesabı seçilmelidir.": "برای دریافت / پرداخت، حساب صندوق یا بانک انتخاب کنید.",
  "Telefon numarası çok uzun.": "شماره تلفن طولانی است.",
  "Vade tarihi düzenleme tarihinden önce olamaz.": "تاریخ سررسید نباید قبل از تاریخ صدور باشد.",
  "Vergi numarası en fazla 20 karakter olabilir.": "شماره مالیاتی حداکثر ۲۰ نویسه است.",
  "Vergi numarası zorunludur.": "شماره مالیاتی الزامی است.",
  "Zaten ödenmiş/tahsil edilmiş evrakın durumu değiştirilemez.": "وضعیت سند دریافت / پرداخت شده قابل تغییر نیست.",
  "Ürün bulunamadı.": "کالا یافت نشد.",
  "İskonto oranı 0-100 arasında olmalıdır.": "نرخ تخفیف باید بین ۰ تا ۱۰۰ باشد.",
  "Şube adı boş olamaz.": "نام شعبه الزامی است.",
  "Şube adı en fazla 128 karakter olabilir.": "نام شعبه حداکثر ۱۲۸ نویسه است.",
  "Şube kodu boş olamaz.": "کد شعبه الزامی است.",
  "Şube kodu en fazla 32 karakter olabilir.": "کد شعبه حداکثر ۳۲ نویسه است.",
  "Birim fiyat 0'dan küçük olamaz.": "قیمت واحد نمی‌تواند منفی باشد.",
  "Miktar 0'dan büyük olmalıdır.": "مقدار باید بیشتر از صفر باشد.",
  "Tutar 0'dan büyük olmalıdır.": "مبلغ باید بیشتر از صفر باشد.",
  "Quantity 0'dan büyük olmalı.": "مقدار باید بیشتر از صفر باشد.",
  "Transfer miktarı 0'dan büyük olmalı.": "مقدار انتقال باید بیشتر از صفر باشد."
};

export function persianError(message: string | undefined, status = 400): string {
  if (message && MESSAGES[message]) return MESSAGES[message];
  if (message && /[؀-ۿ]/.test(message)) return message;
  if (message && /eşzamanlı|başka bir|başka biri|Concurrency|concurrency/i.test(message)) return 'اطلاعات توسط کاربر دیگری تغییر کرده است؛ صفحه را بازخوانی کنید.';
  if (message && /yetersiz stok/i.test(message)) return 'موجودی کالا در انبار مربوط به این سند کافی نیست.';
  if (message && /zaten var/i.test(message)) return 'رکوردی با این کد قبلاً ثبت شده است.';
  if (message && /not found/i.test(message)) return 'رکورد موردنظر یافت نشد.';
  if (message && /currency/i.test(message)) return 'ثبت جدید فقط با ریال ایران (IRR) مجاز است.';
  if (message && /RowVersion|Base64/i.test(message)) return 'نسخهٔ رکورد معتبر نیست؛ صفحه را بازخوانی کنید.';
  if (message && /must not be empty|is required|gereklidir/i.test(message)) return 'تکمیل این فیلد الزامی است.';
  if (message && /must be greater than/i.test(message)) return 'مقدار واردشده باید از حداقل مجاز بیشتر باشد.';
  if (message && /must be less than/i.test(message)) return 'مقدار واردشده از حداکثر مجاز بیشتر است.';
  if (message && /maximum length|characters or fewer/i.test(message)) return 'طول متن از حد مجاز بیشتر است.';
  if (message && /ISO-8601|tarih/i.test(message)) return 'تاریخ واردشده معتبر نیست.';
  return ({ 0: 'ارتباط با سرور برقرار نشد.', 400: 'اطلاعات واردشده معتبر نیست؛ فیلدها را بررسی کنید.', 401: 'نشست شما منقضی شده است؛ دوباره وارد شوید.', 403: 'اجازهٔ انجام این عملیات را ندارید.', 404: 'رکورد موردنظر یافت نشد.', 409: 'اطلاعات تغییر کرده یا تکراری است؛ صفحه را بازخوانی کنید.', 500: 'خطایی در سرور رخ داد؛ دوباره تلاش کنید.' } as Record<number, string>)[status] ?? `عملیات ناموفق بود (کد ${persianDigits(status)}).`;
}

export function persianField(field: string): string {
  return ({ Name: 'نام', Code: 'کد', Email: 'ایمیل', Password: 'رمز عبور', FirstName: 'نام', LastName: 'نام خانوادگی', Amount: 'مبلغ', DateUtc: 'تاریخ', Currency: 'واحد پول', ItemId: 'کالا', ContactId: 'طرف حساب', AccountId: 'حساب', BranchId: 'شعبه', Lines: 'ردیف‌ها', Quantity: 'مقدار', Qty: 'مقدار', UnitPrice: 'قیمت واحد', VatRate: 'نرخ مالیات', RowVersion: 'نسخهٔ رکورد', RowVersionBase64: 'نسخهٔ رکورد' } as Record<string, string>)[field.split('.').pop() ?? field] ?? 'اطلاعات';
}
