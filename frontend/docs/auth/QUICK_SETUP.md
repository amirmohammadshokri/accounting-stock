# ⚡ Hızlı Kurulum Checklist

## 📋 Kurulum Adımları (15 dakika)

### ✅ Adım 1: Dosyaları Kopyala (2 dk)

```bash
# Ana dizininizde (accounting-web/)
cd src/app

# Core dosyalarını kopyala
cp -r /path/to/frontend-auth/core/models core/
cp -r /path/to/frontend-auth/core/services/auth.service.ts core/services/
cp -r /path/to/frontend-auth/core/interceptors/auth.interceptor.ts core/interceptors/
cp -r /path/to/frontend-auth/core/guards core/

# Feature dosyalarını kopyala
mkdir -p features/auth
cp -r /path/to/frontend-auth/features/auth/* features/auth/

# App dosyalarını kopyala
cp /path/to/frontend-auth/app.config.ts .
cp /path/to/frontend-auth/app.routes.ts .
cp /path/to/frontend-auth/app.component.ts .
cp /path/to/frontend-auth/app.component.html .
cp /path/to/frontend-auth/app.component.scss .
```

### ✅ Adım 2: Environment Kontrolü (1 dk)

`src/environments/environment.ts` dosyasını kontrol et:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7000/api'  // ✅ Backend URL'ini doğrula
};
```

### ✅ Adım 3: Backend'i Çalıştır (2 dk)

```bash
cd /path/to/Accounting-main
dotnet run --project Accounting.Api

# ✅ Backend çalışıyor mu kontrol et
# https://localhost:7000/swagger
```

### ✅ Adım 4: Frontend'i Çalıştır (2 dk)

```bash
cd /path/to/accounting-web
npm install  # Gerekirse
ng serve

# ✅ http://localhost:4200 açılmalı
```

### ✅ Adım 5: İlk Test (5 dk)

1. **Kayıt Ol (Register)**
   - http://localhost:4200/register
   - Ad: Test
   - Soyad: User
   - Email: test@example.com
   - Şifre: Test123!
   - ✅ Kayıt başarılı → Ana sayfaya yönlenmeli

2. **Logout ve Login**
   - Sağ üstteki user menüden "Çıkış Yap"
   - http://localhost:4200/login
   - Email: test@example.com
   - Şifre: Test123!
   - ✅ Giriş başarılı → Ana sayfaya yönlenmeli

3. **Token Kontrolü**
   - Developer Console (F12)
   - Application → Local Storage
   - ✅ `accessToken` ve `currentUser` olmalı

4. **Protected Route**
   - Logout yap
   - URL'e direkt /invoices yaz
   - ✅ /login'e yönlenmeli
   - ✅ URL'de ?returnUrl=/invoices olmalı

5. **API Çağrısı**
   - Login ol
   - Network tab'ı aç (F12)
   - Faturalar sayfasına git
   - ✅ Request header'da Authorization: Bearer ... olmalı

### ✅ Adım 6: Son Kontroller (3 dk)

- [ ] User menu görünüyor mu?
- [ ] Sidenav sadece login'de görünüyor mu?
- [ ] Logout çalışıyor mu?
- [ ] Token otomatik refresh oluyor mu? (expire zamanına yakın bir istek yap)
- [ ] 401 hatası logout tetikliyor mu?

---

## 🔧 Sorun Giderme

### Problem: CORS Hatası

**Belirtiler:**
```
Access to XMLHttpRequest at 'https://localhost:7000/api/auth/login' 
from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Çözüm:**
Backend'de `Program.cs` dosyasını kontrol et:

```csharp
// CORS policy ekle
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Middleware'de kullan
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
```

### Problem: Cookie Gönderilmiyor

**Belirtiler:**
```
RefreshToken cookie is missing
```

**Çözüm:**
1. Backend'de `Secure: true` olmamalı (localhost için)
2. `SameSite: Lax` olmalı (development için)

```csharp
// AuthController.cs
var cookieOptions = new CookieOptions
{
    HttpOnly = true,
    SameSite = SameSiteMode.Lax,      // Development için
    Secure = false,                    // Development için
    Expires = DateTime.UtcNow.AddDays(7)
};
```

### Problem: Infinite Redirect Loop

**Belirtiler:**
```
/login → / → /login → / → ...
```

**Çözüm:**
`app.routes.ts` kontrol et:
- `/login` ve `/register`: `canActivate: [guestGuard]`
- Diğer route'lar: `canActivate: [authGuard]`

### Problem: Material Modül Hatası

**Belirtiler:**
```
'mat-card' is not a known element
```

**Çözüm:**
```bash
npm install @angular/material @angular/cdk
# Veya package.json'da versiyonu kontrol et
```

---

## 📞 Yardım

Sorun devam ediyorsa:
1. Browser console loglarını kontrol et (F12)
2. Network tab'da istekleri incele
3. Backend loglarını kontrol et
4. `AUTHENTICATION_GUIDE.md` dosyasını detaylı incele

---

## ✅ Tamamlandı!

Artık authentication sisteminiz hazır! 🎉

**Sonraki adımlar:**
- [ ] Production için HTTPS ayarları
- [ ] Token expire sürelerini ayarla
- [ ] Email verification ekle (opsiyonel)
- [ ] Password reset ekle (opsiyonel)
- [ ] Two-factor authentication ekle (opsiyonel)
