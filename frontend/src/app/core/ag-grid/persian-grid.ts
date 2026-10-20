import { ColumnFilterComponent } from '../../shared/ag-grid/column-filter.component';
import { GridOptions } from 'ag-grid-community';
import { displayValue, formatPersianNumber } from '../utils/persian.utils';
import { AG_THEME } from './ag-theme';

export const PERSIAN_GRID: GridOptions = {
  theme: AG_THEME,
  animateRows: true,
  suppressAnimationFrame: true,
  columnTypes: { rightAligned: { cellClass: 'ag-right-aligned-cell' } },
  enableRtl: true,
  localeText: {
    noRowsToShow: 'رکوردی یافت نشد', loadingOoo: 'در حال بارگذاری…',
    page: 'صفحه', to: 'تا', of: 'از', nextPage: 'صفحه بعد', lastPage: 'آخرین صفحه',
    firstPage: 'اولین صفحه', previousPage: 'صفحه قبل', pageSizeSelectorLabel: 'تعداد ردیف', ariaPageSizeSelector: 'تعداد ردیف در صفحه',
    searchOoo: 'جستجو…', blanks: 'خالی', selectAll: 'انتخاب همه',
    filterOoo: 'فیلتر…', equals: 'برابر', notEqual: 'نابرابر', contains: 'شامل',
    notContains: 'شامل نباشد', startsWith: 'شروع با', endsWith: 'پایان با',
    lessThan: 'کوچک‌تر از', greaterThan: 'بزرگ‌تر از', inRange: 'در بازه',
    applyFilter: 'اعمال', resetFilter: 'بازنشانی', clearFilter: 'پاک‌کردن',
    sortAscending: 'مرتب‌سازی صعودی', sortDescending: 'مرتب‌سازی نزولی', sortUnSort: 'حذف مرتب‌سازی',
    pinColumn: 'ثابت‌کردن ستون', pinLeft: 'سمت چپ', pinRight: 'سمت راست', noPin: 'بدون تثبیت',
    autosizeThiscolumn: 'اندازه خودکار ستون', autosizeAllColumns: 'اندازه خودکار همه ستون‌ها',
    resetColumns: 'بازنشانی ستون‌ها', chooseColumns: 'انتخاب ستون‌ها',
    copy: 'کپی', copyWithHeaders: 'کپی با عنوان‌ها', paste: 'چسباندن', export: 'خروجی', csvExport: 'خروجی CSV'
  },
  paginationNumberFormatter: params => formatPersianNumber(params.value),
  defaultColDef: { filter:ColumnFilterComponent, suppressHeaderMenuButton:false, cellDataType: false, resizable: true, minWidth: 100, valueFormatter: params => params.colDef.type === 'rightAligned' ? formatPersianNumber(params.value) : displayValue(params.value, params.colDef.field ?? params.colDef.colId) }
};
