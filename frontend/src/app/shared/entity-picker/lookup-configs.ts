/**
 * EntityPickerComponent'in `lookup` girdisi için hazır kolon/sıralama/eşleme tanımları.
 * Item/Contact/CashBankAccount lookup dialog'unu kullanan tüm formlarda tekrar
 * tanımlanmasın diye burada tekilleştirildi.
 */
import { ColDef } from 'ag-grid-community';
import { PickerOption } from './entity-picker.component';
import { ItemListItemDto, ItemType, ItemTypeNames } from '../../core/models/item.models';
import { ContactListItemDto, getContactType } from '../../core/models/contact.models';
import { CashBankAccountListItemDto, getAccountTypeDisplayName } from '../../core/models/cash-bank-account.models';

export const ITEM_LOOKUP_COLUMNS: ColDef<ItemListItemDto>[] = [
  { field: 'code', headerName: 'کد', sortable: true, minWidth: 90 },
  { field: 'name', headerName: 'نام', sortable: true, minWidth: 140 },
  { headerName: 'نوع', sortable: false, minWidth: 90, valueGetter: p => p.data ? (ItemTypeNames[p.data.type as ItemType] ?? p.data.type) : '' },
  { field: 'unitName', headerName: 'واحد', sortable: false, minWidth: 70 },
  { field: 'salesPrice', headerName: 'قیمت فروش', sortable: true, type: 'rightAligned', minWidth: 100 }
];
export const ITEM_LOOKUP_SORT_WHITELIST = ['code', 'name', 'vatrate', 'price'];
export const itemToOption = (row: ItemListItemDto): PickerOption => ({ id: row.id, label: row.code, sublabel: row.name });

export const CONTACT_LOOKUP_COLUMNS: ColDef<ContactListItemDto>[] = [
  {field:'subscriptionNumber',headerName:'شماره اشتراک',minWidth:120,valueGetter:p=>p.data?.subscriptionNumber ?? ('AUTO-' + String(p.data?.id ?? '').padStart(6,'0'))},
  { field: 'code', headerName: 'کد', sortable: true, minWidth: 90 },
  { field: 'name', headerName: 'نام / عنوان', sortable: true, minWidth: 160 },
  { headerName: 'نوع', sortable: false, minWidth: 110, valueGetter: p => p.data ? getContactType(p.data) : '' },
  { field: 'email', headerName: 'ایمیل', sortable: false, minWidth: 130 }
];
export const CONTACT_LOOKUP_SORT_WHITELIST = ['code', 'name'];
export const contactToOption = (row: ContactListItemDto): PickerOption => ({ id: row.id, label: row.subscriptionNumber ?? row.customerNumber ?? row.code, sublabel: row.name });

export const CASH_BANK_ACCOUNT_LOOKUP_COLUMNS: ColDef<CashBankAccountListItemDto>[] = [
  { field: 'code', headerName: 'کد', sortable: false, minWidth: 90 },
  { field: 'name', headerName: 'نام', sortable: true, minWidth: 130 },
  { headerName: 'نوع', sortable: true, colId: 'type', minWidth: 80, valueGetter: p => p.data ? getAccountTypeDisplayName(p.data.type) : '' },
  { field: 'iban', headerName: 'شماره شبا', sortable: false, minWidth: 130 },
  { field: 'balance', headerName: 'مانده', sortable: false, type: 'rightAligned', minWidth: 90 }
];
export const CASH_BANK_ACCOUNT_LOOKUP_SORT_WHITELIST = ['name', 'type'];
export const cashBankAccountToOption = (row: CashBankAccountListItemDto): PickerOption =>
  ({ id: row.id, label: row.code, sublabel: `${row.name} (${row.currency})` });
