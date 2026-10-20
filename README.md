# Accounting & Inventory Management System

Küçük/orta ölçekli işletmeler için çok şubeli **muhasebe ve stok yönetimi** sistemi. **.NET 8** (Clean Architecture + CQRS) backend ve **Angular 20** (standalone components + Signals) frontend ile geliştirilmiştir.

🔗 **Canlı demo:** https://accounting.aygunbayir.com

> **Kapsam notu:** Bu proje .NET 8, Clean Architecture ve CQRS pratiklerini sergilemek amacıyla geliştirilmiş bir teknik yeterlilik (POC) çalışmasıdır. Temel mimari akışlar (kimlik doğrulama, işlem yönetimi, çok şubelilik) eksiksiz çalışır; resmi vergi mevzuatı, ileri stok maliyetleme (FIFO/LIFO) veya devlet entegrasyonları gibi konular kapsam dışıdır.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
  - [Docker ile (önerilen)](#docker-ile-önerilen)
  - [Manuel Kurulum](#manuel-kurulum)
- [Test](#test)
- [CI/CD](#cicd)
- [Demo Kullanıcılar](#demo-kullanıcılar)
- [Daha Fazla Bilgi](#daha-fazla-bilgi)

---

## Özellikler

- **Cari Yönetimi**: Şirket / şahıs / şahıs şirketi tek kart üzerinde, esnek doğrulama
- **Fatura & Sipariş**: Satış/alış faturaları, iadeler, sipariş → fatura dönüşümü (denetim izi korunarak)
- **Birleşik Stok Kartı (Item)**: Stoklu ürün, hizmet, masraf ve demirbaş tek modelde; sadece stoklu ürünler için stok hareketi oluşur
- **Stok Takibi**: Depo bazlı anlık stok, hareket geçmişi, negatif stok engeli (DB constraint)
- **Kasa/Banka & Tahsilat-Tediye**: Çoklu para birimi desteği
- **Çek/Senet Takibi**: Alınan/verilen, durum yönetimi (beklemede, ödendi, karşılıksız, ciro)
- **Raporlar**: Stok durumu, cari ekstre, nakit bazlı gelir-gider raporu
- **Çok Şubeli Veri İzolasyonu**: Admin/Merkez kullanıcılar tüm şubeleri, normal kullanıcılar sadece kendi şubesini görür
- **Rol Bazlı Yetkilendirme (RBAC)**: Dinamik rol/izin yönetimi, hem backend (route guard) hem frontend (sidenav/route/buton koruma) katmanında uygulanır
- **Optimistic Concurrency**: `RowVersion` ile eşzamanlı düzenleme çakışması kontrolü (409 Conflict)

## Mimari

### Backend — Clean Architecture + CQRS

```
backend/
├── Accounting.Api              # REST API (Controllers, middleware)
├── Accounting.Application      # CQRS (MediatR Commands/Queries), FluentValidation
├── Accounting.Domain           # Entity'ler, Enum'lar, domain kuralları
├── Accounting.Infrastructure   # EF Core, persistence, dış servisler
└── Accounting.Tests            # Unit + integration testler
```

- **CQRS (MediatR)**: Command/Query ayrımı, repository pattern yerine handler'lar `IAppDbContext`'i doğrudan kullanır
- **JWT tabanlı kimlik doğrulama** (access + refresh token), özel User/Role modeli (ASP.NET Identity kullanılmıyor)
- **Şube bazlı veri izolasyonu**: sorgular `ApplyBranchFilter` extension'ı ile otomatik filtrelenir
- **Soft delete** ve otomatik audit alanları (`CreatedAtUtc`, `UpdatedAtUtc`)
- Detaylı mimari kararlar ve modül dokümantasyonu için bkz. [backend/README.md](backend/README.md)

### Frontend — Angular 20

```
frontend/src/app/
├── core/          # Guard'lar, interceptor'lar, servisler, modeller, yardımcılar
└── features/      # Her domain için standalone modül (auth, contacts, invoices,
                    # items, orders, payments, stocks, reports, users, roles, ...)
```

- **Standalone components + Signals** (NgModule yok)
- **Reactive Forms** ile backend FluentValidation kurallarının client-side karşılığı
- `permission.guard.ts` ile route seviyesinde, `permission.service.ts` ile buton/menü seviyesinde yetki kontrolü
- Angular Material tabanlı arayüz, AG Grid ile liste/tablo ekranları

## Teknoloji Yığını

| Katman | Teknolojiler |
|---|---|
| Backend | .NET 8, ASP.NET Core Web API, MediatR (CQRS), FluentValidation, Entity Framework Core, SQL Server |
| Frontend | Angular 20 (standalone + Signals), Angular Material, AG Grid, RxJS |
| Kimlik Doğrulama | JWT (access + refresh token), özel RBAC (rol/izin) |
| Test | xUnit + `WebApplicationFactory` (backend), Karma/Jasmine (frontend) |
| Altyapı | Docker & Docker Compose, GitHub Actions (CI), Caddy (reverse proxy + otomatik TLS) |

## Proje Yapısı

```
accounting-stock/
├── backend/              # .NET 8 çözümü (bkz. backend/README.md)
├── frontend/             # Angular 20 uygulaması
├── docker-compose.yml    # sqlserver + backend + frontend (healthcheck'li)
├── .github/workflows/    # CI pipeline (backend test + frontend build/test)
├── TASKS.md              # Fazlara bölünmüş geliştirme planı ve ilerleme kaydı
└── .env.example          # Docker Compose için gerekli ortam değişkenleri şablonu
```

## Kurulum

### Docker ile (önerilen)

Gereksinim: Docker & Docker Compose.

```bash
cp .env.example .env
# .env içindeki SA_PASSWORD ve JWT_SECRET değerlerini güncelleyin
docker compose up -d --build
```

Servisler ayağa kalktığında:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5050
- SQL Server: localhost:1433

`backend` servisi migration'ları otomatik uygular ve (varsayılan olarak `Seeding__Enabled=true` ile) demo verisi ekler.

### Manuel Kurulum

Gereksinimler: .NET 8 SDK, SQL Server 2019+, Node.js 18+.

**Backend:**
```bash
cd backend/Accounting.Api
dotnet user-secrets init
dotnet user-secrets set "JwtSettings:Secret" "en-az-32-karakterlik-kendi-secret-iniz"
cd ..
dotnet ef database update --project Accounting.Infrastructure --startup-project Accounting.Api
dotnet run --project Accounting.Api
```

**Frontend:**
```bash
cd frontend
npm install
ng serve
```
`http://localhost:4200` adresinden erişilebilir.

## Test

**Backend** (xUnit, unit + `WebApplicationFactory` ile integration testler, EF Core InMemory provider kullanır — ayrı bir SQL Server gerekmez):
```bash
cd backend
dotnet test
```

**Frontend** (Karma/Jasmine, headless Chrome):
```bash
cd frontend
npm run test -- --no-watch --no-progress --browsers=ChromeHeadless
```

## CI/CD

`.github/workflows/ci.yml` her push/PR'da iki işi paralel çalıştırır:
- **backend**: `dotnet restore` → `build` → `test`
- **frontend**: `npm ci` → `ng build` → `ng test --browsers=ChromeHeadless`

Üretim dağıtımı Docker Compose ile bir Hetzner sunucusunda, Caddy reverse proxy arkasında (otomatik Let's Encrypt TLS) yapılır.

## Demo Kullanıcılar

Canlı demoda veya seed edilmiş bir ortamda aşağıdaki hesaplarla giriş yapılabilir (şifre: `...123!`):

| Kullanıcı | Rol |
|---|---|
| `admin@demo.local` | Sistem Yöneticisi |
| `patron@demo.local` | İşletme Sahibi |
| `sef@demo.local` | Mali Müşavir / Müdür |
| `muhasebe@demo.local` | Muhasebe Elemanı |
| `depo@demo.local` | Depo Amiri |
| `satis@demo.local` | Plasiyer |

## Daha Fazla Bilgi

- Backend mimarisi, domain modülleri, hesaplama kuralları ve API detayları için: [backend/README.md](backend/README.md)
- Geliştirme fazları ve ilerleme kaydı için: [TASKS.md](TASKS.md)
