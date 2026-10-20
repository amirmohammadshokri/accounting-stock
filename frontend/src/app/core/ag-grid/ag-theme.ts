import { themeMaterial } from 'ag-grid-community';

export const AG_THEME = themeMaterial.withParams({
  fontFamily: 'Vazirmatn, Tahoma, sans-serif',
  headerHeight: 48,
  rowHeight: 48,
  accentColor: 'var(--mat-sys-primary)',
  backgroundColor: 'var(--mat-sys-surface-container-low)',
  foregroundColor: 'var(--mat-sys-on-surface)',
  headerBackgroundColor: 'var(--mat-sys-surface-container)',
  headerTextColor: 'var(--mat-sys-on-surface-variant)',
  borderColor: 'var(--mat-sys-outline-variant)',
  rowHoverColor: 'var(--mat-sys-secondary-container)',
  wrapperBorderRadius: 16,
});
