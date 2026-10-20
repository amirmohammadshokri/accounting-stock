import { currencyName, displayValue, formatPersianNumber, isoToJalaliInput, jalaliInputToIso, latinDigits } from './persian.utils';
import { normalizeMoneyInput, calculateTotal } from './money.utils';

describe('Persian localization', () => {
  it('converts Nowruz, month boundaries and leap Esfand to API dates', () => {
    expect(jalaliInputToIso('۱۴۰۳/۰۱/۰۱')).toBe('2024-03-20');
    expect(jalaliInputToIso('۱۴۰۳/۱۲/۳۰')).toBe('2025-03-20');
    expect(jalaliInputToIso('۱۴۰۴/۰۱/۰۱')).toBe('2025-03-21');
    expect(jalaliInputToIso('۱۴۰۴/۱۲/۳۰')).toBeNull();
    expect(jalaliInputToIso('۱۴۰۵/۰۷/۲۲ ۱۳:۴۵', true)).toBe('2026-10-14T13:45');
    expect(jalaliInputToIso('۱۴۰۵/۰۷/۳۱')).toBeNull();
    expect(jalaliInputToIso('۱۴۰۵/۰۱/۰۱ ۲۴:۰۰', true)).toBeNull();
  });
  it('round-trips dates across Persian month and year boundaries', () => {
    for (let offset = 0; offset < 800; offset++) {
      const date = new Date(Date.UTC(2024, 0, 1 + offset));
      const iso = date.toISOString().slice(0, 10);
      expect(jalaliInputToIso(isoToJalaliInput(iso))).withContext(iso).toBe(iso);
    }
  });
  it('normalizes Persian and Arabic decimal input without changing monetary precision', () => {
    expect(latinDigits('١۲۳٬۴۵۶٫٧٨')).toBe('123456.78');
    expect(normalizeMoneyInput('۱۲٬۳۴۵٫۶۷')).toBe('12345.67');
    expect(calculateTotal('۲٫۵', '۱۰٫۲۰')).toBe('25.50');
    expect(formatPersianNumber('12345678901234567890.01')).toBe('۱۲٬۳۴۵٬۶۷۸٬۹۰۱٬۲۳۴٬۵۶۷٬۸۹۰٫۰۱');
  });
  it('localizes monetary units while preserving product codes and unknown currency codes', () => {
    expect(currencyName('TRY')).toBe('لیر ترکیه');
    expect(currencyName('USD')).toBe('دلار آمریکا');
    expect(currencyName('CHF')).toBe('CHF');
    expect(displayValue('123456', 'itemCode')).toBe('123456');
    expect(displayValue('123456', 'amount')).toBe('۱۲۳٬۴۵۶');
  });
});
