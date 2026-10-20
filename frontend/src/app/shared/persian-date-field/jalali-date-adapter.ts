import { Injectable } from '@angular/core';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { isoToJalaliInput, jalaliInputToIso, latinDigits, persianDigits } from '../../core/utils/persian.utils';

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

export const JALALI_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: 'jalali', timeInput: 'time' },
  display: { dateInput: 'jalali', monthYearLabel: 'monthYear', dateA11yLabel: 'dateA11y', monthYearA11yLabel: 'monthYear', timeInput: 'time', timeOptionLabel: 'time' }
};

/** Native Date values with Persian calendar arithmetic for Material calendar views. */
@Injectable()
export class JalaliDateAdapter extends NativeDateAdapter {
  private parts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
    const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
    return { year: get('year'), month: get('month') - 1, day: get('day') };
  }
  override getYear(date: Date) { return this.parts(date).year; }
  override getMonth(date: Date) { return this.parts(date).month; }
  override getDate(date: Date) { return this.parts(date).day; }
  override getDayOfWeek(date: Date) { return date.getDay(); }
  override getMonthNames(_: 'long' | 'short' | 'narrow') { return [...MONTHS]; }
  override getDateNames() { return Array.from({ length: 31 }, (_, index) => persianDigits(index + 1)); }
  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow') {
    return style === 'narrow' ? ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'] : ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  }
  override getYearName(date: Date) { return persianDigits(this.getYear(date)); }
  override getFirstDayOfWeek() { return 6; }
  override getNumDaysInMonth(date: Date) {
    const { year, month } = this.parts(date);
    if (month < 6) return 31;
    if (month < 11) return 30;
    return jalaliInputToIso(`${year}/12/30`) ? 30 : 29;
  }
  override createDate(year: number, month: number, day: number): Date {
    if (month < 0 || month > 11 || day < 1) throw new Error('تاریخ شمسی معتبر نیست.');
    const iso = jalaliInputToIso(`${year}/${month + 1}/${day}`);
    if (!iso) throw new Error('تاریخ شمسی معتبر نیست.');
    return new Date(`${iso}T00:00:00`);
  }
  override clone(date: Date) { return new Date(date.getTime()); }
  override today() { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }
  override parse(value: unknown): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return this.clone(value);
    const iso = jalaliInputToIso(String(value));
    return iso ? new Date(`${iso}T00:00:00`) : this.invalid();
  }
  override deserialize(value: unknown): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return this.isValid(value) ? this.clone(value) : this.invalid();
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
      const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
      return this.isValid(date) ? date : this.invalid();
    }
    return this.invalid();
  }
  override format(date: Date, displayFormat: unknown): string {
    if (!this.isValid(date)) return '';
    if (displayFormat === 'time') return persianDigits(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
    if (displayFormat === 'monthYear') return `${MONTHS[this.getMonth(date)]} ${this.getYearName(date)}`;
    if (displayFormat === 'dateA11y') return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'full' }).format(date);
    return isoToJalaliInput(this.toIso8601(date));
  }
  override addCalendarDays(date: Date, days: number) { const next = this.clone(date); next.setDate(next.getDate() + days); return next; }
  override addCalendarMonths(date: Date, months: number) {
    const current = this.parts(date);
    const absolute = current.year * 12 + current.month + months;
    const year = Math.floor(absolute / 12), month = ((absolute % 12) + 12) % 12;
    const first = this.createDate(year, month, 1);
    return this.createDate(year, month, Math.min(current.day, this.getNumDaysInMonth(first)));
  }
  override addCalendarYears(date: Date, years: number) { return this.addCalendarMonths(date, years * 12); }
  override toIso8601(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  override setTime(date: Date, hours: number, minutes: number, seconds: number) { const next = this.clone(date); next.setHours(hours, minutes, seconds, 0); return next; }
  override parseTime(value: unknown): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return this.clone(value);
    const match = latinDigits(String(value)).trim().match(/^(\d{1,2}):(\d{2})$/);
    return match && Number(match[1]) < 24 && Number(match[2]) < 60 ? this.setTime(this.today(), Number(match[1]), Number(match[2]), 0) : this.invalid();
  }
}

@Injectable()
export class PersianDatepickerIntl extends MatDatepickerIntl {
  override calendarLabel = 'تقویم شمسی';
  override openCalendarLabel = 'باز کردن تقویم شمسی';
  override closeCalendarLabel = 'بستن تقویم';
  override prevMonthLabel = 'ماه قبل';
  override nextMonthLabel = 'ماه بعد';
  override prevYearLabel = 'سال قبل';
  override nextYearLabel = 'سال بعد';
  override prevMultiYearLabel = 'سال‌های قبل';
  override nextMultiYearLabel = 'سال‌های بعد';
  override switchToMonthViewLabel = 'انتخاب روز';
  override switchToMultiYearViewLabel = 'انتخاب ماه و سال';
}
