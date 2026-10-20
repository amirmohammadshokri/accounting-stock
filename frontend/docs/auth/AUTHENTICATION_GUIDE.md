# 🔐 Authentication Modülü Kurulum Rehberi

## 📋 Genel Bakış

Bu dokümantasyon, Angular frontend projesine JWT tabanlı authentication modülünü nasıl entegre edeceğinizi açıklamaktadır.

### ✅ Backend Hazır
- JWT authentication zaten kurulu ve çalışıyor
- Login/Register/Refresh endpoint'leri mevcut
- RefreshToken HttpOnly cookie ile yönetiliyor
- Tüm endpoint'ler `[Authorize]` ile korunuyor

### 🎯 Frontend Eklenecekler
- ✅ Auth Models (Backend DTO'larıyla uyumlu)
- ✅ Auth Service (Token yönetimi ve API çağrıları)
- ✅ Auth Interceptor (Otomatik token ekleme ve refresh)
- ✅ Auth Guards (Route koruma)
- ✅ Login Page (Giriş ekranı)
- ✅ Register Page (Kayıt ekranı)
- ✅ User Menu (Kullanıcı bilgisi ve logout)

---

## 📁 Dosya Yapısı

```
src/app/
├── core/
│   ├── models/
│   │   └── auth.models.ts                    ✨ YENİ
│   ├── services/
│   │   └── auth.service.ts                   🔄 GÜNCELLENDİ
│   ├── interceptors/
│   │   ├── http-problem-interceptor.ts       (mevcut)
│   │   └── auth.interceptor.ts               ✨ YENİ
│   └── guards/
│       └── auth.guard.ts                     ✨ YENİ
│
├── features/
│   └── auth/
│       ├── login-page.component.ts           ✨ YENİ
│       └── register-page.component.ts        ✨ YENİ
│
├── app.component.ts                          🔄 GÜNCELLENDİ
├── app.component.html                        🔄 GÜNCELLENDİ
├── app.component.scss                        🔄 GÜNCELLENDİ
├── app.config.ts                             🔄 GÜNCELLENDİ
└── app.routes.ts                             🔄 GÜNCELLENDİ
```

---

## 🚀 Kurulum Adımları

### 1. Dosyaları Projeye Ekle

Tüm dosyalar `frontend-auth/` klasöründe hazır. Bunları Angular projenizin ilgili klasörlerine kopyalayın:

```bash
# Ana dizininizde (accounting-web/)
cp -r frontend-auth/core/* src/app/core/
cp -r frontend-auth/features/* src/app/features/
cp frontend-auth/app.component.* src/app/
cp frontend-auth/app.config.ts src/app/
cp frontend-auth/app.routes.ts src/app/
```

### 2. Gerekli Material Modülleri Yükle

Bu modüller zaten package.json'da olmalı, eğer yoksa:

```bash
npm install @angular/material @angular/cdk
```

Kullanılan Material modülleri:
- `MatMenuModule` (User menu için)
- `MatCardModule` (Login/Register sayfaları için)
- `MatFormFieldModule`, `MatInputModule` (Form alanları için)
- `MatButtonModule`, `MatIconModule` (Butonlar ve ikonlar için)
- `MatProgressSpinnerModule` (Loading göstergesi için)
- `MatSnackBarModule` (Bildirimler için)

### 3. Backend URL'ini Kontrol Et

`src/environments/environment.ts` dosyasında API URL'in doğru olduğundan emin ol:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7000/api'  // Backend URL'iniz
};
```

---

## 🔧 Çalışma Prensibi

### 1. **Authentication Flow**

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Login/Register                                     │
│  ↓                                                           │
│  2. AuthService → POST /api/auth/login                      │
│  ↓                                                           │
│  3. Backend Response:                                        │
│     - accessToken (JWT)                                     │
│     - refreshToken (HttpOnly Cookie)                        │
│  ↓                                                           │
│  4. AuthService:                                            │
│     - localStorage'a accessToken kaydet                     │
│     - Token'ı decode et → User bilgisi çıkar               │
│     - localStorage'a user kaydet                            │
│     - Signal'ı güncelle (currentUser)                       │
│  ↓                                                           │
│  5. Navigate to home                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Token Management**

**Auth Interceptor** her HTTP isteğinde:
1. Request URL'i kontrol eder (auth endpoint'leri hariç)
2. Token'ı localStorage'dan alır
3. Token expire olmuş mu kontrol eder:
   - **Expire değilse**: Header'a ekler ve isteği gönderir
   - **Expire olduysa**: Önce refresh yapar, sonra yeni token ile isteği gönderir
4. Eğer 401 hatası gelirse: Refresh token ile yenilemeye çalışır
5. Refresh başarısızsa: Logout yapar ve login'e yönlendirir

### 3. **Route Guards**

**authGuard**: 
- Kullanıcı giriş yapmış mı kontrol eder
- Yoksa `/login`'e yönlendirir
- `returnUrl` query parameter ile geri dönüş URL'ini saklar

**guestGuard**: 
- Kullanıcı zaten giriş yapmış mı kontrol eder
- Evet ise `/` ana sayfaya yönlendirir
- Login/Register sayfaları için kullanılır

**adminGuard**: 
- Admin yetkisi kontrolü yapar
- Admin değilse ana sayfaya yönlendirir

### 4. **Signals Kullanımı**

AuthService'de reaktif state yönetimi için Signals kullanılıyor:

```typescript
// Read-only signals
readonly currentUser = signal<CurrentUser | null>(null);
readonly isAuthenticated = computed(() => currentUser() !== null);
readonly isAdmin = computed(() => currentUser()?.role === 'Admin');

// Component'te kullanım
@if (authService.isAuthenticated()) {
  <div>Hoşgeldin {{ authService.currentUser()?.firstName }}</div>
}
```

---

## 🎨 UI Özellikleri

### Login Page
- Modern card-based design
- Email ve şifre validasyonu
- Şifre göster/gizle butonu
- Loading göstergesi
- Register sayfasına link
- Responsive tasarım

### Register Page
- İsim, soyisim, email, şifre alanları
- Şifre tekrar kontrolü
- Custom validator (passwordMatchValidator)
- Login sayfasına link

### User Menu (Toolbar)
- Kullanıcı avatar'ı (initials)
- İsim ve email gösterimi
- Logout butonu
- Material Menu component

---

## 🔒 Güvenlik Özellikleri

### ✅ Uygulanan Güvenlik Önlemleri

1. **JWT Token Storage**
   - AccessToken: localStorage (XSS koruması için kısa ömürlü)
   - RefreshToken: HttpOnly Cookie (XSS'e karşı güvenli)

2. **Token Expiration**
   - Token expire kontrolü her istekte
   - Otomatik refresh mekanizması
   - Refresh başarısızsa otomatik logout

3. **HTTPS Gereksinimi**
   - Cookie'ler `Secure: true` ile işaretli
   - Production'da sadece HTTPS üzerinden çalışır

4. **CORS & SameSite**
   - Cookie'ler `SameSite: Strict`
   - CSRF koruması

5. **Route Protection**
   - Auth guard ile tüm protected route'lar korunuyor
   - Yetkisiz erişim engelleniyor

---

## 🧪 Test Senaryoları

### 1. Başarılı Login
```
1. /login sayfasına git
2. Email: test@example.com
3. Şifre: Test123!
4. "Giriş Yap" butonuna tıkla
5. ✅ Ana sayfaya yönlendirilmeli
6. ✅ User menu'de isim görünmeli
7. ✅ localStorage'da token olmalı
```

### 2. Token Refresh
```
1. Login ol
2. Developer Console'da localStorage'daki token'ı incele
3. Token expire olana kadar bekle (veya manuel expire et)
4. Herhangi bir API isteği yap (örn: fatura listele)
5. ✅ Network tab'da /auth/refresh isteği görülmeli
6. ✅ İstek başarılı olmalı
7. ✅ localStorage'da yeni token olmalı
```

### 3. Logout
```
1. Login ol
2. User menu'ye tıkla
3. "Çıkış Yap" butonuna tıkla
4. ✅ /login sayfasına yönlendirilmeli
5. ✅ localStorage temizlenmeli
6. ✅ User menu görünmemeli
```

### 4. Protected Route
```
1. Logout durumundayken
2. URL'e direkt /invoices yaz
3. ✅ /login sayfasına yönlendirilmeli
4. ✅ URL'de ?returnUrl=/invoices olmalı
5. Login yap
6. ✅ /invoices sayfasına dönmeli
```

---

## 📝 Backend Entegrasyon Notları

### AuthController Endpoint'leri

**POST /api/auth/login**
```typescript
Request: { email: string, password: string }
Response: { 
  id: number,
  firstName: string,
  lastName: string,
  email: string,
  accessToken: string 
}
Cookie: refreshToken (HttpOnly)
```

**POST /api/auth/register**
```typescript
Request: { 
  firstName: string,
  lastName: string,
  email: string,
  password: string 
}
Response: AuthResponse (same as login)
```

**POST /api/auth/refresh**
```typescript
Request: {} (empty body, cookie'den refreshToken alır)
Response: AuthResponse (new tokens)
```

### JWT Claims Yapısı

```typescript
{
  "id": "5",
  "email": "user@example.com",
  "role": "Admin",
  "permission": ["InvoiceCreate", "PaymentView"],
  "branchId": "2",
  "isHeadquarters": "true",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## 🐛 Yaygın Hatalar ve Çözümleri

### 1. CORS Hatası
```
Error: Access to XMLHttpRequest has been blocked by CORS policy
```

**Çözüm**: Backend'de CORS ayarlarını kontrol et
```csharp
// Program.cs
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins("http://localhost:4200")
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

### 2. Cookie Gönderilmiyor
```
Error: RefreshToken cookie is missing
```

**Çözüm**: HttpClient'ta `withCredentials` aktif olmalı
```typescript
// Auth Interceptor'da zaten yapılandırılmış
// Eğer sorun devam ederse environment'ı kontrol et
```

### 3. Token Decode Hatası
```
Error: Invalid token format
```

**Çözüm**: Token'ın doğru formatta olduğundan emin ol (3 parça: header.payload.signature)

### 4. Infinite Redirect Loop
```
/login → /invoices → /login → /invoices → ...
```

**Çözüm**: 
- authGuard ve guestGuard'ın doğru route'larda olduğundan emin ol
- `/login` ve `/register` route'larında sadece `guestGuard` olmalı
- Diğer tüm route'larda `authGuard` olmalı

---

## 🔄 Güncelleme Notları

### Mevcut Kod Değişiklikleri

**auth.service.ts** - Eski kod:
```typescript
// Basit HTTP çağrıları, state yönetimi yok
login(body: LoginBody): Observable<AuthResponse>
```

**auth.service.ts** - Yeni kod:
```typescript
// State management, token storage, signals
login(body: LoginBody): Observable<AuthResponse> {
  return this.http.post(...).pipe(
    tap(response => this.handleAuthResponse(response))
  )
}
```

**app.routes.ts** - Eski kod:
```typescript
// Guard yok, herkes her sayfaya erişebilir
{ path: 'invoices', loadComponent: ... }
```

**app.routes.ts** - Yeni kod:
```typescript
// Auth guard ile korumalı
{ 
  path: 'invoices', 
  canActivate: [authGuard],
  loadComponent: ... 
}
```

---

## ✨ Ekstra Özellikler

### 1. Permission-Based Authorization (Gelecek)

```typescript
// Guard oluştur
export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const user = authService.currentUser();
    return user?.permissions.includes(permission) ?? false;
  };
};

// Route'ta kullan
{
  path: 'invoices/new',
  canActivate: [authGuard, permissionGuard('InvoiceCreate')],
  loadComponent: ...
}
```

### 2. Remember Me Özelliği

Login formuna "Beni Hatırla" checkbox'ı ekle:
```typescript
// auth.service.ts
const STORAGE_KEY = rememberMe ? 'localStorage' : 'sessionStorage';
```

### 3. Password Strength Meter

Register formuna şifre güvenlik göstergesi:
```typescript
// Strong password validator
function strongPasswordValidator(control: AbstractControl) {
  const value = control.value;
  if (!value) return null;
  
  const hasNumber = /[0-9]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasSpecial = /[!@#$%^&*]/.test(value);
  
  const valid = hasNumber && hasUpper && hasLower && hasSpecial;
  return valid ? null : { weakPassword: true };
}
```

---

## 📚 Kaynaklar

- [Angular Authentication Best Practices](https://angular.io/guide/security)
- [JWT.io](https://jwt.io) - Token decode/debug
- [Material Design Components](https://material.angular.io)
- [RxJS Operators](https://rxjs.dev/guide/operators)

---

## 🎯 Sonuç

Bu authentication modülü ile:
- ✅ Güvenli JWT tabanlı kimlik doğrulama
- ✅ Otomatik token refresh
- ✅ Route koruma (guards)
- ✅ Modern UI/UX (Material Design)
- ✅ Type-safe (TypeScript strict mode)
- ✅ Reaktif state (Signals)
- ✅ Backend ile tam uyumlu

**Başarılı bir şekilde entegre edildiğinde, kullanıcılarınız güvenli bir şekilde sisteme giriş yapabilecek ve tüm özelliklere erişebileceklerdir.**

---

**Hazırlayan:** Claude  
**Tarih:** 2026-01-18  
**Versiyon:** 1.0
