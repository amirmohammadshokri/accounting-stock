بستهٔ تحویل API حسابداری به فرانت‌اند
نسخهٔ قرارداد استخراج‌شده از کد فعلی — 2026-10-14

فایل‌ها
--------
accounting-openapi.json: قرارداد OpenAPI 3 شامل مسیرها، پارامترها و schemaها؛ قابل Import در Postman و Swagger Editor.
accounting-postman.json: کالکشن Postman همهٔ درخواست‌ها، گروه‌بندی‌شده بر اساس ماژول.
API_REFERENCE.txt: فهرست خوانای همهٔ مسیرها، متدها، مجوزها، ورودی و خروجی.
validation-rules.txt: قواعد واقعی FluentValidation؛ اجباری بودن فیلدها و قواعد تجاری همیشه از Swagger قابل استنتاج نیست.
INVOICE_PRINT.md و UNITS_API.md: راهنمای تفصیلی چاپ و واحد کالا.
InvoicePrintIdentity.sql و NormalizeItemUnits.sql: اسکریپت‌های تغییرات دیتابیس؛ داخل این بسته اجرا نشده‌اند.

شروع اتصال
-----------
1. accounting-postman.json را Import کنید.
2. متغیر baseUrl را روی نشانی بک‌اند، بدون /api انتهایی، تنظیم کنید؛ نمونه: https://localhost:7000.
3. متغیرهای email و password را با حساب واقعی خود پر کنید.
4. POST /api/auth/login را اجرا کنید؛ اسکریپت کالکشن accessToken را ذخیره می‌کند.
5. درخواست‌های محافظت‌شده از Authorization: Bearer {{accessToken}} استفاده می‌کنند.
6. شناسه‌ها، بدنه‌های نمونه و rowVersion ساختگی‌اند؛ قبل از ثبت/ویرایش، مقدار واقعی را جایگزین کنید.
7. برای refresh از POST /api/auth/refresh و کوکی HttpOnly استفاده کنید. در مرورگر withCredentials: true لازم است؛ کوکی Secure به HTTPS نیاز دارد.

قراردادهای مهم
---------------
- ارز فقط IRR است و مبلغ‌ها ریال هستند.
- در ثبت/ویرایش کالا به جای unit، مقدار unitId ارسال می‌شود؛ خروجی کالا unitId و unitName دارد.
- واحدهای قابل انتخاب: GET /api/units. ثبت: POST /api/units. ویرایش: PUT /api/units/{id}. حذف: DELETE /api/units/{id}?rowVersion=...
- برای ویرایش و حذف‌های دارای rowVersion، توکن آخرین دریافت تکی را عیناً ارسال کنید. query string باید URL-encode شود.
- تاریخ‌های API از نوع DateTime و به قالب ISO-8601 هستند؛ تاریخ شمسی برای نمایش و چاپ است.
- Enumها طبق قرارداد JSON فعلی عددی‌اند؛ مقادیر مجاز هر enum داخل schema آمده است.
- فیلدهای مالی دارای JsonConverter در پاسخ به شکل رشتهٔ عددی، مثل "1250.50"، برمی‌گردند؛ با Number یا کتابخانهٔ decimal به شکل کنترل‌شده تبدیل کنید.
- ساختار صفحه‌بندی معمول: total, pageNumber, pageSize, items و گاهی totals. نام پارامتر ورودی بعضی APIها page و بعضی pageNumber است؛ فایل قرارداد را ملاک قرار دهید.
- بعضی ایجادها 201 و بعضی 200 می‌دهند؛ حذف‌های 204 بدنهٔ JSON ندارند. برای همهٔ عملیات موفق فرض یکسان نگذارید.
- خطاهای رایج: 400 اعتبارسنجی، 401 احراز هویت، 403 مجوز، 404 نبود رکورد/خارج از دسترسی، 409 تداخل نسخه، 422 قاعدهٔ تجاری.
- x-permissions در OpenAPI، مجوز لازم هر عملیات را مشخص می‌کند. دسترسی واقعی شعبه نیز در بک‌اند اعمال می‌شود.

دانلود و چاپ فاکتور
--------------------
GET /api/Invoices/{id}/pdf
Authorization: Bearer <accessToken>
Response: application/pdf — Blob / فایل باینری، نه JSON
Permission: Invoice.Read

نمونهٔ Angular:
  this.http.get(`${apiBaseUrl}/invoices/${id}/pdf`, { responseType: 'blob' })
    .subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${id}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });

در این مثال apiBaseUrl شامل /api است. درخواست باید از interceptor احراز هویت فعلی عبور کند.
برای پیش‌نمایش و چاپ، سرویس InvoicePrintService موجود در فرانت، Blob را در پنجرهٔ جدید باز می‌کند.
اگر مشخصات شرکت یا طرف حساب ناقص باشد، پاسخ JSON خطا دریافت می‌شود؛ در حالت responseType: blob، بدنهٔ خطا را با blob.text() و JSON.parse بخوانید.

Stimulsoft
-----------
کتابخانه‌های محلی بک‌اند: Accounting.Infrastructure/libs/Stimulsoft/2024.3.2
نسخهٔ نصب‌شده: 2024.3.2.0
قالب: Accounting.Infrastructure/Reporting/Invoice.mrt
فرانت برای این پیاده‌سازی به پکیج Stimulsoft نیاز ندارد؛ PDF در بک‌اند تولید می‌شود.

کلید از تنظیمات محیطی یا فایل خصوصی بک‌اند خوانده می‌شود. فایل خصوصی لایسنس نباید به فرانت ارسال شود.
کتابخانهٔ محلی دسکتاپ به Windows Desktop Runtime 8 و ویندوز نیاز دارد.
برای ویرایش قالب، Designer رسمی را نصب کنید و با حساب Stimulsoft وارد شوید؛ ترجیحاً نسخهٔ 2024.3.2 را مطابق موتور استفاده کنید.
برای فعال‌سازی نسخهٔ دارای لایسنس، کلید معتبر را فقط در بک‌اند و در تنظیمات امن Stimulsoft:LicenseKey یا متغیر محیطی Stimulsoft__LicenseKey قرار دهید.
کلید را در فرانت، مخزن یا فایل‌های قابل انتشار نگذارید.

مراجع رسمی:
https://www.stimulsoft.com/en/faq/purchase
https://www.stimulsoft.com/en/downloads
https://www.stimulsoft.com/en/downloads

این بسته صرفاً قرارداد و نمونهٔ درخواست است؛ هیچ درخواست ثبت، ویرایش، حذف یا migration روی دادهٔ واقعی اجرا نشده است.
