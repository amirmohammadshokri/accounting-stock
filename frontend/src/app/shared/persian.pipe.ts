import { Pipe, PipeTransform } from '@angular/core';
import { currencyName, formatPersianDate, formatPersianNumber } from '../core/utils/persian.utils';

@Pipe({ name: 'persian', standalone: true })
export class PersianPipe implements PipeTransform {
  transform(value: unknown, kind: 'number' | 'date' | 'currency' | 'type' | 'permission' = 'number'): string {
    if (value == null) return '';
    if (kind === 'date') return formatPersianDate(String(value));
    if (kind === 'currency') return currencyName(String(value));
    if (kind === 'permission') {
      const action = String(value).split('.').pop() ?? '';
      return ({ Create: 'ایجاد', Read: 'مشاهده', Update: 'ویرایش', Delete: 'حذف', Approve: 'تأیید', Cancel: 'لغو', CreateInvoice: 'تبدیل به فاکتور', Transfer: 'انتقال', UpdateStatus: 'تغییر وضعیت', Dashboard: 'داشبورد', ProfitLoss: 'سود و زیان', ContactStatement: 'صورت‌حساب طرف حساب', StockStatus: 'موجودی انبار' } as Record<string, string>)[action] ?? action;
    }
    if (kind === 'type') return ({ Cash: 'صندوق', Bank: 'بانک', Kasa: 'صندوق', Banka: 'بانک', Invoice: 'فاکتور', Payment: 'پرداخت', Sales: 'فروش', Purchase: 'خرید', Opening: 'مانده ابتدای دوره', 'Önceki dönem bakiyesi': 'مانده دوره قبل', 'DEVİR': 'مانده ابتدای دوره', 'Satış Faturası': 'فاکتور فروش', 'Alış Faturası': 'فاکتور خرید', 'Satış İade': 'برگشت از فروش', 'Alış İade': 'برگشت از خرید', 'Satış İadesi': 'برگشت از فروش', 'Alış İadesi': 'برگشت از خرید', 'Tahsilat': 'دریافت', 'Ödeme': 'پرداخت', In: 'دریافت', Out: 'پرداخت' } as Record<string, string>)[String(value)] ?? String(value);
    return formatPersianNumber(value);
  }
}
