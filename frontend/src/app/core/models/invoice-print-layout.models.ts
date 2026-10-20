export type InvoicePrintFormat = 'a4-landscape' | 'a4-portrait' | 'a5-portrait';
export const INVOICE_PRINT_FORMATS: {value: InvoicePrintFormat; label: string}[] = [
  {value:'a4-portrait', label:'A4 عمودی'}, {value:'a5-portrait', label:'A5 عمودی'}
];
export interface InvoicePrintLayout {
  format: InvoicePrintFormat; title: string; fontSize: number; margin: number;
  showTax?: boolean; showUnit?: boolean; showLogo?: boolean; showSeller?: boolean; showBuyer?: boolean;
  showContactDetails?: boolean; showWords?: boolean; showBalance?: boolean; showNotes?: boolean;
  minimumRows?: number; rowHeight?: number; logoPosition?: string; headerText?: string; terms?: string;
  footerText?: string; footerOrder?: string; columnOrder?: string;
  headerColor: string; showCode: boolean; showDiscount: boolean; showSignatures: boolean;
}
export interface InvoicePrintLayoutVersion { layout: InvoicePrintLayout; version: string; }
