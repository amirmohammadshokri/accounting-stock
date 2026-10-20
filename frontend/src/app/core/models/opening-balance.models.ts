export type OpeningKind = 'contacts' | 'inventory';
export interface OpeningBalance {
  id:number; branchId:number; dateUtc:string; contactId:number|null; warehouseId:number|null; itemId:number|null;
  amount:string|null; isDebit:boolean|null; quantity:string|null; unitCost:string|null; totalCost:string|null;
  valuationPending:boolean; note:string|null; rowVersionBase64:string;
}
export interface ContactOpeningBody {contactId:number; dateUtc:string; amount:string; isDebit:boolean; note:string|null; rowVersionBase64?:string;}
export interface InventoryOpeningBody {warehouseId:number; itemId:number; dateUtc:string; quantity:string; unitCost:string|null; note:string|null; rowVersionBase64?:string;}
export type OpeningBody = ContactOpeningBody | InventoryOpeningBody;
export interface OpeningFilters {contactId?:number|null;warehouseId?:number|null;itemId?:number|null;}
export interface OpeningReference {id:number;name:string;code?:string;type?:number;branchId?:number;}
