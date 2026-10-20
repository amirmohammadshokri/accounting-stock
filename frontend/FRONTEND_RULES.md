# Frontend Project Rules & Standards

**Proje:** Accounting & Inventory Management System - Web Frontend  
**Teknoloji:** Angular 20 + TypeScript 5.9 + Material Design 20 + AG Grid 34  
**Backend API:** .NET 8 REST API (https://localhost:7000/api)  
**Tarih:** 2026-01-16

---

## 📁 Proje Yapısı

```
src/app/
├── core/                           # Singleton servisler, models, interceptors
│   ├── models/                    # TypeScript interfaces (backend DTO'ları)
│   ├── services/                  # HTTP servisleri
│   ├── interceptors/              # HTTP interceptors
│   ├── guards/                    # Route guards (gelecek)
│   └── ag-grid/                   # AG Grid konfigürasyonları
│
├── features/                      # Feature modülleri (standalone components)
│   ├── invoices/
│   │   ├── invoices-page.component.ts         # List sayfası
│   │   ├── invoice-edit.page.ts               # Create/Edit/View sayfası
│   │   ├── invoices-form.component.ts         # Form component
│   │   ├── invoice-actions.cell.ts            # AG Grid cell renderer
│   │   └── invoice.resolver.ts                # Route resolver
│   ├── items/
│   ├── payments/
│   └── ...
│
├── shared/                        # Paylaşılan componentler
│   └── list-grid/
│       └── list-grid.component.ts # Reusable grid component
│
├── app.component.ts               # Root component (sidenav + toolbar)
├── app.routes.ts                  # Routing tanımları
└── app.config.ts                  # DI configuration
```

---

## 🎯 Angular & TypeScript Kuralları

### 1. **Standalone Components** (Zorunlu)
```typescript
// ✅ DOĞRU
@Component({
  standalone: true,
  selector: 'app-invoices-page',
  imports: [CommonModule, MatButtonModule, ...],
  template: `...`
})
export class InvoicesPageComponent { }

// ❌ YANLIŞ - NgModule kullanma
@NgModule({ declarations: [...] })
export class InvoicesModule { }
```

**Sebep:** Angular 20'de standalone component'ler varsayılan. NgModule kullanımı deprecated.

---

### 2. **Signals API Kullanımı** (Önerilen)

```typescript
// ✅ DOĞRU - Signals kullan
export class InvoicesPageComponent {
  opened = signal(true);
  branches = signal<BranchDto[]>([]);
  
  readonly = computed(() => this.mode === 'view');
  hasMore = computed(() => this.pageNumber() * this.pageSize() < this.total());
}

// ❌ ESKİ YOL - Subject/BehaviorSubject (yeni kod için kullanma)
export class OldComponent {
  opened$ = new BehaviorSubject(true);
}
```

**Sebep:** Signals Angular'ın yeni reaktif primitive'i. Daha performanslı ve type-safe.

**İSTİSNA:** RxJS operatörlerine ihtiyaç varsa (switchMap, debounce, vb.) Observable kullanabilirsin.

---

### 3. **TypeScript Strict Mode** (Zorunlu)

`tsconfig.json` ayarları:
```json
{
  "strict": true,                              // ✅ Zorunlu
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

**Kurallar:**
- `any` kullanma. `unknown` veya spesifik tip kullan.
- Null safety: `value?.property` veya `value ?? defaultValue`
- Fonksiyon return type'ları açıkça belirt.

```typescript
// ✅ DOĞRU
function calculate(value: string): number {
  return Number(value ?? 0);
}

// ❌ YANLIŞ
function calculate(value: any) {  // any yasak!
  return Number(value);           // return type yok!
}
```

---

### 4. **Dependency Injection** (Constructor vs inject())

```typescript
// ✅ TERCİH EDİLEN - inject() fonksiyonu
export class InvoicesPageComponent {
  private service = inject(InvoicesService);
  private router = inject(Router);
}

// ✅ ALTERNATİF - Constructor injection
export class InvoicesPageComponent {
  constructor(
    private service: InvoicesService,
    private router: Router
  ) { }
}
```

**Not:** Her ikisi de geçerli. Kısa component'lerde `inject()`, karmaşık olanlarda `constructor` kullan.

---

## 🎨 UI/UX Kuralları

### 1. **Angular Material Design 3** (Zorunlu)

**Theme:**
```scss
// styles.scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    typography: Roboto,
    density: -2,  // Kompakt UI
  ));
}
```

**Komponentler:**
- Form: `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatDatepickerModule`
- Layout: `MatSidenavModule`, `MatToolbarModule`, `MatListModule`
- Actions: `MatButtonModule`, `MatIconModule`
- Feedback: `MatSnackBarModule`, `MatDialogModule`, `MatProgressSpinnerModule`

---

### 2. **Form Stilleri** (Tutarlılık)

```typescript
// ✅ DOĞRU - Outline appearance
<mat-form-field appearance="outline">
  <mat-label>Cari (ID)</mat-label>
  <input matInput type="number" formControlName="contactId">
</mat-form-field>

// ❌ YANLIŞ - Fill veya legacy appearance kullanma
<mat-form-field appearance="fill">...</mat-form-field>
```

**Grid Layout (Responsive):**
```scss
.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
}
@media (max-width: 900px) {
  .form-grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

### 3. **AG Grid Standardı**

**Theme:**
```typescript
// core/ag-grid/ag-theme.ts
import { themeQuartz } from 'ag-grid-community';

export const AG_THEME = themeQuartz.withParams({
  headerHeight: 42,
  rowHeight: 40,
});
```

**Grid Container:**
```html
<div class="grid-host">
  <ag-grid-angular
    [theme]="AG_THEME"
    [rowData]="rows()"
    [columnDefs]="columns"
    [gridOptions]="gridOptions">
  </ag-grid-angular>
</div>
```

```scss
// styles.scss (global)
.grid-host { height: 80vh; width: 100%; }
ag-grid-angular { display: block; height: 100%; width: 100%; }
```

---

### 4. **Custom Cell Renderers**

```typescript
// ✅ DOĞRU - Standalone component + ICellRendererAngularComp
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: true,
  selector: 'app-invoice-actions-cell',
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <a class="icon-btn" [routerLink]="['/invoices', id]">
      <mat-icon>visibility</mat-icon>
    </a>
  `
})
export class InvoiceActionsCell implements ICellRendererAngularComp {
  id!: number;
  agInit(p: ICellRendererParams) { this.id = Number(p.data?.id ?? 0); }
  refresh(): boolean { return false; }
}
```

**Column Definition:**
```typescript
colDefs: ColDef<InvoiceListItem>[] = [
  { field: 'id', headerName: 'ID' },
  {
    headerName: '',
    field: 'id',
    cellRenderer: InvoiceActionsCell,
    suppressHeaderMenuButton: true
  }
];
```

---

## 📡 Backend Entegrasyonu

### 1. **HTTP Servisleri**

**Klasör:** `src/app/core/services/`

**Yapı:**
```typescript
// invoices.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result';
import { InvoiceDto, InvoiceListItem } from '../models/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/invoices`;

  list(query: ListInvoicesQuery): Observable<PagedResult<InvoiceListItem>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '')
        params = params.set(k, String(v));
    });
    return this.http.get<PagedResult<InvoiceListItem>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<InvoiceDto> {
    return this.http.get<InvoiceDto>(`${this.baseUrl}/${id}`);
  }

  create(body: CreateInvoiceBody): Observable<CreateInvoiceResult> {
    return this.http.post<CreateInvoiceResult>(this.baseUrl, body);
  }

  update(id: number, body: UpdateInvoiceBody): Observable<InvoiceDto> {
    return this.http.put<InvoiceDto>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

**Kurallar:**
- Service adı: `{Entity}Service` (örn: `InvoicesService`)
- Injectable providedIn: `'root'`
- Base URL: `environment.apiBaseUrl` kullan
- Query params: Boş/null değerleri filtrele

---

### 2. **Model Tanımları**

**Klasör:** `src/app/core/models/`

**Dosya adı:** `{entity}.models.ts` (örn: `invoice.models.ts`)

**Backend DTO'larıyla Senkronizasyon:**
```typescript
// ✅ DOĞRU - Backend'deki InvoiceDto ile 1:1 eşleşen
export interface InvoiceDto {
  id: number;
  contactId: number;
  contactCode: string;
  contactName: string;
  dateUtc: string;                    // ISO-8601 UTC string
  invoiceNumber: string;
  currency: string;
  totalLineGross: string;             // Money string (F2)
  totalDiscount: string;
  totalNet: string;
  totalVat: string;
  totalWithholding: string;
  totalGross: string;
  balance: string;
  lines: InvoiceLineDto[];
  rowVersion: string;                 // Base64
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  type: number;                       // Enum as int
  branchId: number;
  branchCode: string;
  branchName: string;
  waybillNumber?: string | null;
  waybillDateUtc?: string | null;
  paymentDueDateUtc?: string | null;
}

// List DTO (daha az alan)
export interface InvoiceListItemDto {
  id: number;
  contactId: number;
  contactCode: string;
  contactName: string;
  type: string;                       // "Sales" | "Purchase"
  dateUtc: string;
  currency: string;
  totalNet: string;
  totalVat: string;
  totalGross: string;
  balance: string;
  createdAtUtc: string;
  branchId: number;
  branchCode: string;
  branchName: string;
}

// Query params
export interface ListInvoicesQuery {
  pageNumber?: number;
  pageSize?: number;
  sort?: string;                      // "dateUtc:desc"
  branchId?: number | null;
  contactId?: number | null;
  type?: InvoiceTypeFilter;
  dateFromUtc?: string | null;
  dateToUtc?: string | null;
}

// Enum
export enum InvoiceTypeFilter {
  Any = 0,
  Sales = 1,
  Purchase = 2,
  SalesReturn = 3,
  PurchaseReturn = 4
}

// Create/Update bodies
export interface CreateInvoiceBody {
  branchId: number;
  contactId: number;
  dateUtc: string;
  currency: string;
  type: number;
  invoiceNumber?: string;
  waybillNumber?: string;
  waybillDateUtc?: string;
  paymentDueDateUtc?: string;
  lines: CreateInvoiceLineBody[];
}

export interface CreateInvoiceLineBody {
  id: 0;  // Backend'de new entity için 0
  itemId?: number | null;
  expenseDefinitionId?: number | null;
  qty: string;
  unitPrice: string;
  vatRate: number;
  discountRate?: string;
  discountAmount?: string;
  withholdingRate?: number;
}

export interface UpdateInvoiceBody extends CreateInvoiceBody {
  id: number;
  rowVersionBase64: string;
}
```

**Kritik Notlar:**
- `dateUtc` → `string` (ISO-8601)
- `rowVersion` → `string` (Base64)
- Money values → `string` (örn: "1234.56")
- Enums → Hem `number` hem `string` versiyonları olabilir
- Optional fields → `| null` veya `?` kullan

---

### 3. **Error Handling**

**HTTP Interceptor:**
```typescript
// core/interceptors/http-problem-interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

type ProblemDetails = {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
};

export const httpProblemInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const p = err.error as ProblemDetails;
      
      // Backend ProblemDetails formatı
      if (p?.title || p?.errors) {
        snack.open(p.title || 'İstek hatası', 'Kapat', { duration: 6000 });
        
        // FluentValidation hataları
        if (p.errors) {
          for (const [field, messages] of Object.entries(p.errors)) {
            messages.forEach(msg => 
              snack.open(`${field}: ${msg}`, 'Kapat', { duration: 6000 })
            );
          }
        }
        
        if (p.traceId) console.warn('TraceId:', p.traceId);
      } else {
        const msg = err.status === 0 ? 'Ağ/CORS hatası' : `Hata (${err.status})`;
        snack.open(msg, 'Kapat', { duration: 6000 });
      }
      
      return throwError(() => err);
    })
  );
};
```

**Kayıt:**
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([httpProblemInterceptor])
    ),
  ]
};
```

---

## 🔄 Reactive Forms

### 1. **Typed FormGroup** (Önerilen)

```typescript
// ✅ DOĞRU - Tip güvenli FormGroup
type InvoiceFormGroup = FormGroup<{
  branchId: FormControl<number | null>;
  contactId: FormControl<number | null>;
  dateUtc: FormControl<string>;
  currency: FormControl<string>;
  type: FormControl<InvoiceTypeStr>;
}>;

export class InvoiceFormComponent {
  private fb = inject(FormBuilder);
  
  form: InvoiceFormGroup = this.fb.group({
    branchId: this.fb.control<number | null>(null, [Validators.required]),
    contactId: this.fb.control<number | null>(null, [Validators.required]),
    dateUtc: this.fb.nonNullable.control('', [Validators.required]),
    currency: this.fb.nonNullable.control('TRY', [Validators.required]),
    type: this.fb.nonNullable.control<InvoiceTypeStr>('Sales', [Validators.required])
  });
}
```

**Form Value Alma:**
```typescript
// getRawValue() - tüm değerleri disabled olanlar dahil
const values = this.form.getRawValue();

// value - sadece enabled olanlar (nadiren kullan)
const values = this.form.value;
```

---

### 2. **Master-Detail Forms (Grid ile)**

```typescript
export class InvoiceFormComponent {
  // ❌ Form'da satırlar tutma
  form = this.fb.group({
    lines: this.fb.array([])  // Kötü yaklaşım
  });
  
  // ✅ Grid state'de satırlar tutma
  rowData: LineRow[] = [];
  
  onSave() {
    const header = this.form.getRawValue();
    const lines = this.rowData.map(row => ({
      itemId: row.itemId,
      qty: row.qty,
      unitPrice: row.unitPrice
    }));
    
    this.saveUpdate.emit({ ...header, lines });
  }
}
```

**Sebep:** AG Grid kendi state'ini yönetir. FormArray ile senkronize tutmak karmaşık ve gereksiz.

---

### 3. **Date/Time Handling**

```typescript
// Backend: UTC ISO-8601 string bekler
// Frontend: datetime-local input kullanır (timezone'siz)

// UTC → Local input value
toLocalInputValue(isoUtc: string): string {
  const d = new Date(isoUtc);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Local input → UTC ISO
localToUtcIso(localStr: string): string {
  return new Date(localStr).toISOString();
}

// Kullanım
<input matInput type="datetime-local" formControlName="dateUtc">

form.patchValue({
  dateUtc: this.toLocalInputValue(invoice.dateUtc)  // "2025-01-15T14:30"
});

const utcDate = this.localToUtcIso(form.value.dateUtc);  // "2025-01-15T12:30:00.000Z"
```

---

### 4. **Money/Decimal Handling** ⚠️ KRİTİK

Backend `Money.cs` utility'si şu formatı **zorunlu** kılar:
- **Ondalık ayracı:** NOKTA (`.`) - InvariantCulture
- **Yuvarlama:** MidpointRounding.AwayFromZero (5'ler yukarı)
- **Format örnekleri:** 
  - ✅ `"1234.56"` 
  - ✅ `"0.5"`
  - ✅ `"1000"`
  - ❌ `"1234,56"` (virgül KABUL EDİLMEZ!)
  - ❌ `"1.234,56"` (binlik ayraç KABUL EDİLMEZ!)

**Backend Parse Yöntemi:**
```csharp
decimal.TryParse(input, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
```

---

#### Frontend'den Backend'e Gönderim (CREATE/UPDATE)

**ZORUNLU FORMAT: Noktalı ondalık string**

```typescript
// ✅ DOĞRU - Backend'e gönderirken
const createBody: CreateInvoiceLineBody = {
  qty: "10.500",        // ✅ Nokta ile
  unitPrice: "125.75",  // ✅ Nokta ile
  discountRate: "5.00"  // ✅ Nokta ile
};

// ❌ YANLIŞ - Virgül kullanılırsa backend parse edemez!
const wrongBody = {
  qty: "10,500",        // ❌ Backend hatası verir!
  unitPrice: "125,75"   // ❌ Backend hatası verir!
};
```

**Normalize Fonksiyonu (Zorunlu):**
```typescript
/**
 * Kullanıcı inputunu backend'e uygun formata çevirir
 * Türkçe virgül → nokta
 * Boş → "0"
 */
function normalizeMoneyInput(value: string | null | undefined): string {
  if (!value) return "0";
  
  // Virgülü noktaya çevir (Türkçe klavye için)
  const normalized = value.toString().replace(',', '.').trim();
  
  // Boş string → "0"
  return normalized === '' ? "0" : normalized;
}

// Kullanım (Form submit)
const bodyLines = rowData.map(row => ({
  itemId: row.itemId,
  qty: normalizeMoneyInput(row.qty),           // "10,5" → "10.5"
  unitPrice: normalizeMoneyInput(row.unitPrice), // "125,75" → "125.75"
  vatRate: Number(row.vatRate)
}));
```

---

#### Backend'den Frontend'e (GET/LIST)

Backend Money string'lerini AYNEN kullan:

```typescript
// Backend response
interface InvoiceDto {
  totalNet: string;      // "1234.56"
  totalVat: string;      // "246.91"
  totalGross: string;    // "1481.47"
}

// ✅ DOĞRU - Direkt göster
{{ invoice.totalGross }}  // "1481.47"

// ✅ DOĞRU - Türkçe formatla (SADECE GÖRÜNTÜLEME İÇİN)
{{ invoice.totalGross | number:'1.2-2':'tr' }}  // "1.481,47"

// ✅ DOĞRU - Hesaplama için Decimal.js kullan
const gross = new Decimal(invoice.totalGross);  // Backend string'i direkt ver
```

---

#### Decimal.js Konfigürasyonu (Zorunlu)

```typescript
import Decimal from 'decimal.js';

// Backend ile aynı yuvarlama: MidpointRounding.AwayFromZero
Decimal.set({ 
  precision: 28, 
  rounding: Decimal.ROUND_HALF_UP  // 2.5 → 3, -2.5 → -3
});

// Hesaplama örneği
const qty = new Decimal(normalizeMoneyInput(row.qty));      // "10,5" → Decimal(10.5)
const price = new Decimal(normalizeMoneyInput(row.unitPrice)); // "125,75" → Decimal(125.75)
const net = qty.times(price);  // Decimal(1320.375)

// Backend'e gönderirken string'e çevir
const netStr = net.toFixed(2);  // "1320.38" (yuvarlanmış)
```

---

#### AG Grid Input Handling

```typescript
// AG Grid'de editable kolonlar için valueParser
stringMoneyParser = (params: ValueParserParams): string | null => {
  if (params.newValue == null) return null;
  
  // Virgülü noktaya çevir
  const normalized = String(params.newValue).replace(',', '.').trim();
  
  return normalized === '' ? null : normalized;
};

// Column definition
colDefs: ColDef[] = [
  { 
    field: 'qty', 
    editable: true,
    valueParser: this.stringMoneyParser  // Otomatik normalize
  },
  { 
    field: 'unitPrice', 
    editable: true,
    valueParser: this.stringMoneyParser
  }
];
```

---

#### Form Validation

```typescript
// Custom validator - backend formatını kontrol et
function moneyFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    
    // Virgülü noktaya çevir
    const normalized = value.replace(',', '.');
    
    // InvariantCulture parse test
    const isValid = /^-?\d+(\.\d+)?$/.test(normalized);
    
    return isValid ? null : { moneyFormat: true };
  };
}

// Kullanım
form = this.fb.group({
  unitPrice: ['', [Validators.required, moneyFormatValidator()]]
});
```

---

#### Özet: Money String Kuralları

| Senaryo | Format | Örnek |
|---------|--------|-------|
| **Backend → Frontend (GET)** | Nokta | `"1234.56"` |
| **Frontend → Backend (POST/PUT)** | Nokta (zorunlu) | `"1234.56"` |
| **Kullanıcı Input** | Virgül/Nokta | `"1234,56"` veya `"1234.56"` |
| **Normalize edilmiş** | Nokta | `"1234.56"` |
| **Ekranda gösterim** | Locale (opsiyonel) | `"1.234,56"` (Türkçe) |
| **Hesaplama (Decimal.js)** | Nokta | `new Decimal("1234.56")` |

**KRİTİK:** Frontend → Backend gönderiminde **MUTLAKA** virgül → nokta dönüşümü yap!

---

## 🚦 Routing

### 1. **Route Tanımları**

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'invoices' },
  
  // List
  { 
    path: 'invoices', 
    loadComponent: () => import('./features/invoices/invoices-page.component')
      .then(m => m.InvoicesPageComponent) 
  },
  
  // Create
  { 
    path: 'invoices/new', 
    loadComponent: () => import('./features/invoices/invoice-edit.page')
      .then(m => m.InvoicesEditPage) 
  },
  
  // Edit
  { 
    path: 'invoices/:id/edit', 
    loadComponent: () => import('./features/invoices/invoice-edit.page')
      .then(m => m.InvoicesEditPage),
    resolve: { invoice: InvoiceResolver }  // Optional
  },
  
  // View
  { 
    path: 'invoices/:id', 
    loadComponent: () => import('./features/invoices/invoice-edit.page')
      .then(m => m.InvoicesEditPage) 
  },
  
  { path: '**', redirectTo: 'invoices' }
];
```

**Önemli:** Spesifik route'lar önce (`:id/edit`), genel olanlar sonra (`:id`)

---

### 2. **Route Resolvers** (Opsiyonel)

```typescript
// invoice.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { InvoicesService } from '../../core/services/invoices.service';
import { InvoiceDto } from '../../core/models/invoice.models';

export const invoiceResolver: ResolveFn<InvoiceDto> = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(InvoicesService).getById(id);
};
```

**Kullanım:**
```typescript
export class InvoiceEditPage {
  private route = inject(ActivatedRoute);
  
  ngOnInit() {
    this.route.data.subscribe(data => {
      const invoice = data['invoice'] as InvoiceDto;
      // ...
    });
  }
}
```

---

## 📊 List Grid Pattern

### 1. **Reusable List Grid Component**

```typescript
// shared/list-grid/list-grid.component.ts
@Component({
  standalone: true,
  selector: 'app-list-grid',
  imports: [CommonModule, AgGridAngular, MatButtonModule],
  template: `
    <div class="page">
      <div class="toolbar">
        <span class="title">{{ title }}</span>
        <span class="spacer"></span>
        <button mat-stroked-button (click)="reload()">Yenile</button>
      </div>
      
      <div class="grid-host">
        <ag-grid-angular
          [theme]="AG_THEME"
          [rowData]="rows()"
          [columnDefs]="columns"
          [gridOptions]="gridOptions"
          (gridReady)="onGridReady($event)"
          (sortChanged)="onSortChanged()">
        </ag-grid-angular>
      </div>
      
      <div class="pager">
        <button mat-button (click)="prevPage()" [disabled]="pageNumber()===1">
          Önceki
        </button>
        <span>Sayfa {{ pageNumber() }}</span>
        <button mat-button (click)="nextPage()" [disabled]="!hasMore()">
          Sonraki
        </button>
      </div>
    </div>
  `
})
export class ListGridComponent<T> implements OnInit {
  @Input({ required: true }) title = 'Liste';
  @Input({ required: true }) columns!: ColDef<T>[];
  @Input() sortWhitelist: string[] = [];
  @Input({ required: true }) fetcher!: (q: ListQuery) => Observable<PagedResult<T>>;
  @Input() pageSizeInit = 25;
  
  pageNumber = signal(1);
  pageSize = signal(this.pageSizeInit);
  rows = signal<T[]>([]);
  total = signal(0);
  hasMore = computed(() => this.pageNumber() * this.pageSize() < this.total());
  
  reload() { this.load(); }
  nextPage() { this.pageNumber.update(p => p + 1); this.load(); }
  prevPage() { this.pageNumber.update(p => p - 1); this.load(); }
  
  private load() {
    this.fetcher({
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sort: this.buildSortParam()
    }).subscribe(res => {
      this.rows.set(res.items);
      this.total.set(res.total);
    });
  }
}
```

**Kullanım:**
```typescript
export class InvoicesPageComponent {
  @ViewChild('grid') grid!: ListGridComponent<InvoiceListItem>;
  
  constructor(private service: InvoicesService) { }
  
  fetcher = (q: ListQuery) => {
    const query = { ...q, branchId: this.branchId ?? undefined };
    return this.service.list(query);
  };
  
  apply() {
    this.grid.reload();
  }
}
```

```html
<app-list-grid
  #grid
  title="Faturalar"
  [columns]="colDefs"
  [sortWhitelist]="['dateUtc', 'totalNet']"
  [fetcher]="fetcher">
</app-list-grid>
```

---

## 🌍 Lokalizasyon

### 1. **Türkçe Locale**

```typescript
// app.config.ts
import localeTr from '@angular/common/locales/tr';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeTr);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'tr' }
  ]
};
```

**Pipes:**
```html
<!-- Tarih -->
{{ invoice.dateUtc | date:'dd.MM.yyyy HH:mm' }}  // 15.01.2026 14:30

<!-- Para -->
{{ invoice.totalGross | number:'1.2-2' }} TRY  // 1.234,56 TRY
```

---

## 🛠️ Geliştirme Workflow

### 1. **Yeni Feature Eklerken**

1. **Models oluştur:** `core/models/{entity}.models.ts`
2. **Service oluştur:** `core/services/{entity}.service.ts`
3. **List page:** `features/{entity}/{entity}-page.component.ts`
4. **Edit page:** `features/{entity}/{entity}-edit.page.ts`
5. **Form component:** `features/{entity}/{entity}-form.component.ts`
6. **Routing ekle:** `app.routes.ts`
7. **Menü ekle:** `app.component.html`

### 2. **Backend Senkronizasyonu**

Yeni backend DTO değişikliği olduğunda:
1. Backend'deki DTO'yu kopyala
2. Frontend'de ilgili `*.models.ts` dosyasını güncelle
3. Eksik alanları ekle
4. Service metodlarını güncelle
5. Form ve grid kolonlarını güncelle

### 3. **Testing** (Henüz yapılmıyor)

```bash
# Unit tests
ng test

# E2E tests
ng e2e
```

---

## 📦 Dependencies

### Zorunlu:
- `@angular/core` ^20.x
- `@angular/common` ^20.x
- `@angular/material` ^20.x
- `ag-grid-angular` ^34.x
- `ag-grid-community` ^34.x
- `rxjs` ~7.8
- `decimal.js` ^10.x

### Önerilen:
- `dayjs` - Tarih manipülasyonu (moment.js yerine)
- `@fontsource/inter` - Custom font

---

## ⚠️ Yaygın Hatalar

### 1. **Money String'lerini Number'a Çevirme veya Virgül Kullanma** ⚠️ EN YAGIN HATA

```typescript
// ❌ YANLIŞ - Hassasiyet kaybı!
const total = Number(invoice.totalGross);  // "1234.567" → 1234.567 (floating point!)

// ❌ YANLIŞ - Backend parse edemez!
const body = {
  unitPrice: "125,75"  // Virgül → Backend error: "Invalid decimal format"
};

// ❌ YANLIŞ - Türkçe locale ile backend'e gönderme
const formatted = (1234.56).toLocaleString('tr-TR');  // "1.234,56"
const body = { unitPrice: formatted };  // Backend KABUL ETMEZ!

// ✅ DOĞRU - Decimal.js kullan
const total = new Decimal(invoice.totalGross);

// ✅ DOĞRU - Virgül → nokta normalize et
function normalizeMoneyInput(value: string | null | undefined): string {
  return (value ?? '0').toString().replace(',', '.').trim() || '0';
}

const body = {
  unitPrice: normalizeMoneyInput(userInput)  // "125,75" → "125.75"
};

// ✅ DOĞRU - Backend'den gelen değeri AYNEN kullan
const gross = new Decimal(invoice.totalGross);  // "1234.56" → Decimal
```

**Backend Hata Mesajı Örneği:**
```
Invalid decimal format: '1234,56'. Expected format: 1234.56
```

### 2. **UTC Tarih Manipülasyonu**

```typescript
// ❌ YANLIŞ
const date = new Date(invoice.dateUtc);
date.setHours(date.getHours() + 3);  // Timezone hatası!

// ✅ DOĞRU
// Backend UTC bekliyor, datetime-local kullan
<input type="datetime-local" [value]="toLocalInputValue(invoice.dateUtc)">
```

### 3. **FormArray ile Grid Senkronizasyonu**

```typescript
// ❌ YANLIŞ - Çift state management
form = this.fb.group({
  lines: this.fb.array([])  // AG Grid zaten kendi state'ini tutuyor
});

// ✅ DOĞRU - Grid state kullan
rowData: LineRow[] = [];
```

### 4. **Type Safety İhlali**

```typescript
// ❌ YANLIŞ
const invoice: any = data;
invoice.unknownField = 123;

// ✅ DOĞRU
const invoice = data as InvoiceDto;
// invoice.unknownField → compile error!
```

---

## 🎯 Best Practices

1. **DRY:** Tekrar eden kod varsa component/service/pipe yap
2. **Single Responsibility:** Her component tek bir görevi yapsın
3. **Type Safety:** `any` kullanma, spesifik tipler tanımla
4. **Immutability:** Signal'larda `.set()` ve `.update()` kullan
5. **Error Handling:** HTTP interceptor ile merkezi hata yönetimi
6. **Lazy Loading:** Feature route'ları `loadComponent` ile yükle
7. **Signals > Observables:** Yeni kod için Signals tercih et
8. **Standalone > NgModule:** NgModule kullanma
9. **Reactive Forms > Template-driven:** FormBuilder kullan
10. **Material Design:** UI tutarlılığı için Material component'leri kullan
11. **Money Format:** 🔴 **ZORUNLU** → Backend'e gönderimde virgül → nokta dönüşümü yap (`normalizeMoneyInput`)
12. **Decimal.js:** Finansal hesaplamalarda `Number` yerine `Decimal` kullan

---

## 📝 Naming Conventions

| Tip | Format | Örnek |
|-----|--------|-------|
| Component | PascalCase + Component | `InvoicesPageComponent` |
| Service | PascalCase + Service | `InvoicesService` |
| Model | PascalCase + interface | `InvoiceDto` |
| Enum | PascalCase | `InvoiceType` |
| Variable | camelCase | `totalGross` |
| Constant | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| File | kebab-case | `invoices-page.component.ts` |

---

## 🚀 Deployment

```bash
# Development
ng serve  # http://localhost:4200

# Production build
ng build  # dist/ klasörüne çıktı

# Analyze bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

**Environment:**
```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7000/api'
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.production.com/api'
};
```

---

**Son Güncelleme:** 2026-01-16  
**Versiyon:** 1.0
