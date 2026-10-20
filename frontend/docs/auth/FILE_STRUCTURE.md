# 📁 Authentication Modülü Dosya Yapısı

## 🗂️ Tüm Dosyalar

```
frontend-auth/
│
├── 📖 AUTHENTICATION_GUIDE.md        # Detaylı kurulum ve kullanım rehberi
├── ⚡ QUICK_SETUP.md                 # Hızlı kurulum checklist
├── 📋 FILE_STRUCTURE.md              # Bu dosya
│
├── core/                             # Core katmanı
│   │
│   ├── models/
│   │   └── auth.models.ts            # Auth model interfaces
│   │       - RegisterBody
│   │       - LoginBody
│   │       - AuthResponse
│   │       - JwtClaims
│   │       - CurrentUser
│   │
│   ├── services/
│   │   └── auth.service.ts           # Auth service (state management)
│   │       - register()
│   │       - login()
│   │       - refresh()
│   │       - logout()
│   │       - getToken()
│   │       - isTokenExpired()
│   │       - currentUser (signal)
│   │       - isAuthenticated (computed)
│   │       - isAdmin (computed)
│   │
│   ├── interceptors/
│   │   └── auth.interceptor.ts       # HTTP interceptor (token injection)
│   │       - Token ekleme
│   │       - Token expire kontrolü
│   │       - Otomatik refresh
│   │       - 401 handling
│   │
│   └── guards/
│       └── auth.guard.ts             # Route guards
│           - authGuard (authenticated users only)
│           - guestGuard (non-authenticated users only)
│           - adminGuard (admin users only)
│
├── features/                         # Feature modülleri
│   └── auth/
│       ├── login-page.component.ts   # Login sayfası
│       │   - Email/Password form
│       │   - Validasyon
│       │   - Loading state
│       │   - Register link
│       │
│       └── register-page.component.ts # Register sayfası
│           - Tam kayıt formu
│           - Password confirmation
│           - Custom validators
│           - Login link
│
└── (App Files)                       # Root app dosyaları
    ├── app.config.ts                 # DI configuration
    │   - authInterceptor eklendi
    │
    ├── app.routes.ts                 # Routing
    │   - Auth routes (/login, /register)
    │   - Guards eklendi (protected routes)
    │
    ├── app.component.ts              # Root component
    │   - AuthService inject
    │   - User signals
    │   - Logout method
    │
    ├── app.component.html            # Template
    │   - Conditional sidenav (auth only)
    │   - User menu eklendi
    │   - Logout button
    │
    └── app.component.scss            # Styles
        - User menu styles
        - Avatar styles
```

---

## 📊 Dosya İstatistikleri

| Kategori | Dosya Sayısı | Satır Sayısı (yaklaşık) |
|----------|--------------|-------------------------|
| Models | 1 | ~50 |
| Services | 1 | ~200 |
| Interceptors | 1 | ~80 |
| Guards | 1 | ~70 |
| Components | 2 | ~500 |
| Config | 2 | ~60 |
| Docs | 3 | ~800 |
| **TOPLAM** | **11** | **~1760** |

---

## 🔄 Değişiklik Özeti

### Yeni Dosyalar (✨)
- `core/models/auth.models.ts`
- `core/interceptors/auth.interceptor.ts`
- `core/guards/auth.guard.ts`
- `features/auth/login-page.component.ts`
- `features/auth/register-page.component.ts`

### Güncellenen Dosyalar (🔄)
- `core/services/auth.service.ts` - State management eklendi
- `app.config.ts` - Auth interceptor eklendi
- `app.routes.ts` - Guards ve auth routes eklendi
- `app.component.ts` - Auth service ve user state eklendi
- `app.component.html` - User menu ve conditional rendering
- `app.component.scss` - User menu stilleri

---

## 🎯 Bağımlılıklar

### Angular Core
- `@angular/core` ^20.x
- `@angular/common` ^20.x
- `@angular/router` ^20.x
- `@angular/forms` ^20.x

### Angular Material
- `@angular/material` ^20.x
  - MatCardModule
  - MatFormFieldModule
  - MatInputModule
  - MatButtonModule
  - MatIconModule
  - MatMenuModule
  - MatProgressSpinnerModule
  - MatSnackBarModule

### RxJS
- `rxjs` ~7.8
  - tap
  - catchError
  - switchMap
  - throwError

### Harici Bağımlılık YOK
- localStorage (native browser API)
- atob (native browser API)
- JSON (native)

---

## 📝 Önemli Notlar

### 1. **localStorage Kullanımı**
- `accessToken` - JWT token
- `currentUser` - User bilgisi (JSON)

### 2. **HttpOnly Cookie**
- `refreshToken` - Backend tarafından set ediliyor
- Frontend'den okunamaz (güvenlik)
- Otomatik olarak her istekle gönderilir

### 3. **Signals API**
- Modern Angular reaktif state
- `signal()` - Writable signal
- `computed()` - Derived state
- `readonly()` - Read-only signal

### 4. **Type Safety**
- Strict TypeScript mode
- No `any` types
- Full type inference
- Interface-based models

### 5. **Security**
- JWT in localStorage (short-lived)
- RefreshToken in HttpOnly cookie
- Automatic token refresh
- HTTPS required (production)
- CORS configured
- SameSite cookies

---

## 🔗 Dosya İlişkileri

```
┌─────────────────────────────────────────────────────────────┐
│                    app.config.ts                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ provideHttpClient(                                     │ │
│  │   withInterceptors([                                   │ │
│  │     authInterceptor,        ──────────┐               │ │
│  │     httpProblemInterceptor            │               │ │
│  │   ])                                  │               │ │
│  │ )                                     │               │ │
│  └────────────────────────────────────────┼──────────────┘ │
└────────────────────────────────────────────┼────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────┐
                          │  auth.interceptor.ts            │
                          │  ┌───────────────────────────┐  │
                          │  │ inject(AuthService)       │  │
                          │  │   ├─ getToken()          │  │
                          │  │   ├─ isTokenExpired()    │  │
                          │  │   └─ refresh()           │  │
                          │  └───────────┬───────────────┘  │
                          └──────────────┼──────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────────┐
                          │  auth.service.ts                │
                          │  ┌───────────────────────────┐  │
                          │  │ Signals:                  │  │
                          │  │  - currentUser           │  │
                          │  │  - isAuthenticated       │  │
                          │  │  - isAdmin               │  │
                          │  └───────────┬───────────────┘  │
                          │              │                  │
                          │  ┌───────────▼───────────────┐  │
                          │  │ Methods:                  │  │
                          │  │  - login()                │  │
                          │  │  - register()             │  │
                          │  │  - refresh()              │  │
                          │  │  - logout()               │  │
                          │  └───────────────────────────┘  │
                          └──────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ login-page       │  │ register-page    │  │ app.component    │
        │   component      │  │   component      │  │                  │
        │                  │  │                  │  │  User Menu       │
        │  inject(Auth)    │  │  inject(Auth)    │  │  Logout Button   │
        │  login()         │  │  register()      │  │  currentUser()   │
        └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🎨 Component Hierarchy

```
AppComponent (root)
│
├── @if (isAuthenticated())
│   │
│   ├── MatSidenav (menu)
│   │   └── Navigation Links
│   │
│   └── MatToolbar
│       ├── Menu Button
│       ├── Title
│       └── User Menu
│           ├── Avatar (initials)
│           ├── User Info
│           └── Logout Button
│
└── RouterOutlet
    ├── /login → LoginPageComponent
    ├── /register → RegisterPageComponent
    ├── /invoices → InvoicesPageComponent (guarded)
    ├── /payments → PaymentsPageComponent (guarded)
    └── ...
```

---

## 🚀 Deployment Checklist

Projeyi production'a almadan önce:

- [ ] Environment değişkenlerini production için ayarla
- [ ] HTTPS kullan (Secure cookies için gerekli)
- [ ] Token expire sürelerini ayarla
- [ ] CORS policy'yi production domain'e göre güncelle
- [ ] Error handling'i iyileştir
- [ ] Analytics ekle (opsiyonel)
- [ ] Rate limiting ekle (backend)
- [ ] Logging ekle (backend ve frontend)

---

**Oluşturulma Tarihi:** 2026-01-18  
**Versiyon:** 1.0  
**Son Güncelleme:** 2026-01-18
