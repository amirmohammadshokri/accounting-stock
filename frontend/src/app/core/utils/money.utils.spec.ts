import {
  normalizeMoneyInput,
  parseMoneyString,
  formatMoneyString,
  calculateTotal,
  calculateVat,
  calculateDiscountByRate,
  calculateWithholding,
  calculateInvoiceLine,
  isValidMoneyFormat
} from './money.utils';
import Decimal from 'decimal.js';

describe('normalizeMoneyInput', () => {
  it('converts Turkish comma decimal separator to a dot', () => {
    expect(normalizeMoneyInput('1234,56')).toBe('1234.56');
  });

  it('passes an already-dotted value through unchanged (trimmed)', () => {
    expect(normalizeMoneyInput('  1234.56  ')).toBe('1234.56');
  });

  it('treats null/undefined/empty as "0"', () => {
    expect(normalizeMoneyInput(null)).toBe('0');
    expect(normalizeMoneyInput(undefined)).toBe('0');
    expect(normalizeMoneyInput('')).toBe('0');
    expect(normalizeMoneyInput('   ')).toBe('0');
  });

  it('stringifies numeric input', () => {
    expect(normalizeMoneyInput(10.5)).toBe('10.5');
  });
});

describe('parseMoneyString / formatMoneyString', () => {
  it('round-trips a backend-formatted string through Decimal', () => {
    const decimal = parseMoneyString('1234.56');
    expect(decimal instanceof Decimal).toBeTrue();
    expect(formatMoneyString(decimal)).toBe('1234.56');
  });

  it('parseMoneyString defaults null/undefined to zero', () => {
    expect(formatMoneyString(parseMoneyString(null))).toBe('0.00');
    expect(formatMoneyString(parseMoneyString(undefined))).toBe('0.00');
  });

  it('formatMoneyString respects the requested decimal count', () => {
    expect(formatMoneyString(new Decimal('1234.5'), 4)).toBe('1234.5000');
  });
});

describe('calculateTotal', () => {
  it('multiplies quantity by price', () => {
    expect(calculateTotal('10.5', '125.75')).toBe('1320.38');
  });

  it('accepts Turkish comma input on either argument', () => {
    expect(calculateTotal('10,5', '125,75')).toBe('1320.38');
  });
});

describe('calculateVat', () => {
  it('computes VAT at the given rate', () => {
    expect(calculateVat('1000', 20)).toBe('200.00');
  });

  it('returns 0 for a 0% rate', () => {
    expect(calculateVat('1000', 0)).toBe('0.00');
  });
});

describe('calculateDiscountByRate', () => {
  it('computes a percentage discount', () => {
    expect(calculateDiscountByRate('1000', 10)).toBe('100.00');
  });
});

describe('calculateWithholding', () => {
  it('computes withholding on top of a VAT amount', () => {
    expect(calculateWithholding('200', 50)).toBe('100.00');
  });
});

describe('calculateInvoiceLine', () => {
  it('matches the backend InvoiceLineCalculator formula with no discount/withholding', () => {
    const result = calculateInvoiceLine({ qty: 2, unitPrice: 100, vatRate: 20 });
    expect(result.gross).toBe('200.00');
    expect(result.discountAmount).toBe('0.00');
    expect(result.net).toBe('200.00');
    expect(result.vat).toBe('40.00');
    expect(result.withholdingAmount).toBe('0.00');
    expect(result.grandTotal).toBe('240.00');
  });

  it('applies discount before VAT', () => {
    const result = calculateInvoiceLine({ qty: 10, unitPrice: 50, vatRate: 18, discountRate: 10 });
    // gross = 500, discount = 50, net = 450, vat = 81, grandTotal = 531
    expect(result.gross).toBe('500.00');
    expect(result.discountAmount).toBe('50.00');
    expect(result.net).toBe('450.00');
    expect(result.vat).toBe('81.00');
    expect(result.grandTotal).toBe('531.00');
  });

  it('computes withholding without subtracting it from grandTotal', () => {
    // net=1000, vat(20%)=200, withholding(50% of vat)=100 — grandTotal stays net+vat, NOT net+vat-withholding
    const result = calculateInvoiceLine({ qty: 1, unitPrice: 1000, vatRate: 20, withholdingRate: 50 });
    expect(result.net).toBe('1000.00');
    expect(result.vat).toBe('200.00');
    expect(result.withholdingAmount).toBe('100.00');
    expect(result.grandTotal).toBe('1200.00');
  });

  it('accepts Turkish comma-formatted qty/unitPrice/discountRate', () => {
    const result = calculateInvoiceLine({ qty: '2,5', unitPrice: '100,00', vatRate: 20, discountRate: '10,0' });
    // gross = 250, discount = 25, net = 225, vat = 45
    expect(result.gross).toBe('250.00');
    expect(result.discountAmount).toBe('25.00');
    expect(result.net).toBe('225.00');
    expect(result.vat).toBe('45.00');
  });

  it('treats missing discountRate/withholdingRate as zero', () => {
    const result = calculateInvoiceLine({ qty: 1, unitPrice: 100, vatRate: 10 });
    expect(result.discountAmount).toBe('0.00');
    expect(result.withholdingAmount).toBe('0.00');
  });
});

describe('isValidMoneyFormat', () => {
  it('accepts a valid dotted decimal', () => {
    expect(isValidMoneyFormat('1234.56')).toBeTrue();
  });

  it('accepts a comma decimal (normalizable)', () => {
    expect(isValidMoneyFormat('1234,56')).toBeTrue();
  });

  it('accepts a negative amount', () => {
    expect(isValidMoneyFormat('-1234.56')).toBeTrue();
  });

  it('treats empty/null as valid (defaults to zero)', () => {
    expect(isValidMoneyFormat(null)).toBeTrue();
    expect(isValidMoneyFormat(undefined)).toBeTrue();
    expect(isValidMoneyFormat('')).toBeTrue();
  });

  it('rejects non-numeric text', () => {
    expect(isValidMoneyFormat('abc')).toBeFalse();
  });

  it('rejects multiple decimal points', () => {
    expect(isValidMoneyFormat('12.34.56')).toBeFalse();
  });
});
