/**
 * Cheque Models (Çek/Senet)
 *
 * Backend DTO'larıyla senkronize.
 * @see Accounting.Application.Cheques.Queries.Dto.ChequeDtos
 *
 * DİKKAT — bu modülde iki farklı enum-taşıma biçimi bir arada kullanılıyor:
 * - Create body (`CreateChequeBody.type`/`direction`) ve UpdateStatus body
 *   (`UpdateChequeStatusBody.newStatus`) enum'ları SAYI olarak bekliyor
 *   (JsonStringEnumConverter kayıtlı değil — Order/Invoice'daki Type alanlarıyla aynı kural).
 * - Ama liste filtreleri (`ListChequesQuery.status`/`type`/`direction`) backend'de
 *   `c.Status.ToString() == request.Status` şeklinde karşılaştırılıyor, yani STRING
 *   enum adı ("Pending", "Cheque", "Inbound") bekliyor — sayı DEĞİL. Read DTO'ları
 *   (`ChequeDetailDto.type`/`direction`/`status`) da her zaman string döner.
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ChequeType {
  Cheque = 1,
  PromissoryNote = 2
}

export enum ChequeDirection {
  Inbound = 1,  // Müşteriden alınan
  Outbound = 2  // Tedarikçiye verilen
}

export enum ChequeStatus {
  Pending = 1,   // Portföyde / Bekliyor
  Paid = 2,      // Tahsil Edildi / Ödendi
  Endorsed = 3,  // Ciro Edildi (sadece Inbound için)
  Bounced = 4,   // Karşılıksız / Protestolu
  Cancelled = 5  // İptal / İade
}

export type ChequeTypeStr = 'Cheque' | 'PromissoryNote';
export type ChequeDirectionStr = 'Inbound' | 'Outbound';
export type ChequeStatusStr = 'Pending' | 'Paid' | 'Endorsed' | 'Bounced' | 'Cancelled';

// ============================================================================
// DTOs - READ (GET/LIST) — List de aynı ChequeDetailDto'yu döner (backend'de
// ayrı bir ListItemDto tanımlı ama handler'da kullanılmıyor).
// ============================================================================

export interface ChequeDetailDto {
  id: number;
  branchId: number;
  chequeNumber: string;
  type: ChequeTypeStr;
  direction: ChequeDirectionStr;
  amount: string;                   // F2 - Money string
  currency: string;
  issueDate: string;                // ISO-8601 UTC
  dueDate: string;                  // ISO-8601 UTC
  contactId?: number | null;
  contactName?: string | null;
  drawerName?: string | null;
  bankName?: string | null;
  description?: string | null;
  status: ChequeStatusStr;
  createdAtUtc: string;             // ISO-8601 UTC
  updatedAtUtc?: string | null;
  rowVersionBase64: string;         // Base64 — DİKKAT: alan adı "rowVersion" DEĞİL
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * List Cheques Query Parameters
 * Backend: ListChequesQuery — Status/Type/Direction STRING enum adı bekliyor (yukarıki nota bkz).
 */
export interface ListChequesQuery {
  filters?: string;
  page?: number;
  pageSize?: number;
  status?: ChequeStatusStr | null;
  type?: ChequeTypeStr | null;
  direction?: ChequeDirectionStr | null;
}

// ============================================================================
// COMMAND BODIES - WRITE
// ============================================================================

/**
 * Create Cheque Body
 * Backend: CreateChequeCommand — NO branchId (ICurrentUserService'ten türetiliyor),
 * NO status (her zaman Pending başlar). ContactId sadece Inbound için zorunlu.
 */
export interface CreateChequeBody {
  contactId?: number | null;
  type: ChequeType;
  direction: ChequeDirection;
  chequeNumber: string;
  issueDate: string;                // ISO-8601 UTC
  dueDate: string;                  // ISO-8601 UTC
  amount: string;                   // Money string
  currency: string;
  bankName?: string | null;
  bankBranch?: string | null;
  accountNumber?: string | null;
  drawerName?: string | null;
  description?: string | null;
}

/**
 * Update Cheque Status Body
 * Backend: UpdateStatusRequest (ChequesController) — RowVersionBase64 alan adı budur
 * (delete'teki "rowVersion"dan farklı). CashBankAccountId sadece Paid'e geçişte zorunlu.
 */
export interface UpdateChequeStatusBody {
  newStatus: ChequeStatus;
  rowVersionBase64: string;
  transactionDate?: string | null;
  cashBankAccountId?: number | null;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export function getChequeTypeDisplayName(type: ChequeTypeStr | string): string {
  return type === 'PromissoryNote' ? 'سفته' : 'چک';
}

export function getChequeDirectionDisplayName(direction: ChequeDirectionStr | string): string {
  return direction === 'Outbound' ? 'پرداختی' : 'دریافتی';
}

export function getChequeStatusDisplayName(status: ChequeStatusStr | string): string {
  const names: Record<string, string> = {
    Pending: 'در دست',
    Paid: 'دریافت / پرداخت شده',
    Endorsed: 'واگذار شده',
    Bounced: 'برگشتی',
    Cancelled: 'لغو'
  };
  return names[status] ?? 'نامشخص';
}
