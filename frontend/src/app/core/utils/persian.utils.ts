export const PERSIAN_LOCALE = 'fa-IR-u-ca-persian';

export function latinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0)))
    .replace(/٬/g, '').replace(/٫/g, '.').replace(/−/g, '-');
}

export function persianDigits(value: string | number): string {
  return String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export function formatPersianNumber(value: unknown): string {
  if (value == null || value === '') return '';
  // Group strings without converting monetary decimals to floating point.
  const text = latinDigits(String(value));
  if (!/^[+-]?\d+(\.\d+)?$/.test(text)) return String(value);
  const [integer, fraction] = text.split('.');
  return persianDigits(integer.replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + (fraction == null ? '' : '٫' + fraction));
}

export function formatPersianDate(value: string | Date | null | undefined, withTime = false): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } as const : {})
  }).format(date);
}

export function currencyName(value: string): string {
  return ({ IRR: 'ریال ایران', IRT: 'تومان', TRY: 'لیر ترکیه', USD: 'دلار آمریکا', EUR: 'یورو', GBP: 'پوند بریتانیا' } as Record<string, string>)[value] ?? value;
}

export function displayValue(value: unknown, field = ''): string {
  if (value == null) return '';
  if (/currency/i.test(field)) return currencyName(String(value));
  if (/^(id|.*Id|qty|quantity.*|amount|.*Price|.*Rate|total.*|.*Count|net|vat|grandTotal|balance)$/i.test(field) || typeof value === 'number') {
    return formatPersianNumber(value);
  }
  return String(value);
}

/** A strict Jalali text input conversion; API values remain Gregorian ISO. */
export function jalaliInputToIso(value: string, withTime = false): string | null {
  const match = latinDigits(value).trim().match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (!match) return null;
  const [, y, m, d, h = '0', min = '0'] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  if (year < 1200 || year > 1600 || month < 1 || month > 12 || day < 1 || day > 31 || Number(h) > 23 || Number(min) > 59) return null;
  // Intl supplies the authoritative calendar, including leap years.
  const formatter = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
  const start = new Date(Date.UTC(year + 621, 2, 18));
  start.setUTCDate(start.getUTCDate() + (month - 1) * 29 + day - 1);
  for (let offset = 0; offset < 40; offset++) {
    const candidate = new Date(start);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    const parts = formatter.formatToParts(candidate);
    const part = (type: string) => Number(parts.find(p => p.type === type)?.value);
    if (part('year') === year && part('month') === month && part('day') === day) {
      const iso = candidate.toISOString().slice(0, 10);
      return withTime ? `${iso}T${h.padStart(2, '0')}:${min.padStart(2, '0')}` : iso;
    }
  }
  return null;
}

export function isoToJalaliInput(value: string, withTime = false): string {
  if (!value) return '';
  // Form values are local date/time strings. Do not introduce a timezone shift.
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat(PERSIAN_LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${part('year')}/${part('month')}/${part('day')}` + (withTime ? ` ${persianDigits(date.getHours().toString().padStart(2, '0'))}:${persianDigits(date.getMinutes().toString().padStart(2, '0'))}` : '');
}
