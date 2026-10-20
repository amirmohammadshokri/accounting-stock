import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { JalaliDateAdapter } from './jalali-date-adapter';

describe('Jalali Material calendar adapter', () => {
  let adapter: DateAdapter<Date>;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DateAdapter, useClass: JalaliDateAdapter }] });
    adapter = TestBed.inject(DateAdapter<Date>);
  });
  it('uses Persian month, year, day labels and Saturday as the first weekday', () => {
    const date = adapter.createDate(1405, 6, 22);
    expect(adapter.toIso8601(date)).toBe('2026-10-14');
    expect(adapter.getYear(date)).toBe(1405);
    expect(adapter.getMonth(date)).toBe(6);
    expect(adapter.getDate(date)).toBe(22);
    expect(adapter.getDayOfWeek(date)).toBe(3);
    expect(adapter.getFirstDayOfWeek()).toBe(6);
    expect(adapter.format(date, 'monthYear')).toBe('مهر ۱۴۰۵');
    expect(adapter.getDateNames()[21]).toBe('۲۲');
  });
  it('handles leap Esfand and calendar navigation without Gregorian arithmetic', () => {
    const leapDay = adapter.createDate(1403, 11, 30);
    expect(adapter.toIso8601(adapter.addCalendarDays(leapDay, 1))).toBe('2025-03-21');
    expect(adapter.getNumDaysInMonth(leapDay)).toBe(30);
    expect(adapter.getDate(adapter.addCalendarYears(leapDay, 1))).toBe(29);
    expect(adapter.getNumDaysInMonth(adapter.createDate(1404, 11, 1))).toBe(29);
    expect(adapter.getDate(adapter.addCalendarMonths(adapter.createDate(1405, 5, 31), 1))).toBe(30);
    expect(() => adapter.createDate(1404, 11, 30)).toThrow();
  });
  it('parses Persian dates and clock values and keeps API dates Gregorian', () => {
    expect(adapter.toIso8601(adapter.parse('۱۴۰۵/۰۷/۲۲', 'jalali')!)).toBe('2026-10-14');
    expect(adapter.isValid(adapter.parse('۱۴۰۴/۱۲/۳۰', 'jalali')!)).toBeFalse();
    const time = adapter.parseTime('۱۳:۴۵', 'time')!;
    expect(adapter.getHours(time)).toBe(13);
    expect(adapter.format(time, 'time')).toBe('۱۳:۴۵');
    expect(adapter.isValid(adapter.parseTime('۲۴:۰۰', 'time')!)).toBeFalse();
    expect(adapter.toIso8601(adapter.deserialize('2026-10-14')!)).toBe('2026-10-14');
  });
});
