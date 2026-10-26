export interface NavItem {path:string;label:string;icon:string;permission?:string;admin?:boolean;anyOf?:string[];allOf?:string[];}
export interface NavGroup {id:string;title:string;hint:string;icon:string;items:NavItem[];}
export const NAV_GROUPS: NavGroup[] = [
    {id:'sales',title:'سفارش و مشتری',hint:'کارهای روزانهٔ کترینگ',icon:'restaurant_menu',items:[
      {path:'/orders',label:'سفارش‌ها و پکیج‌ها',icon:'shopping_bag',permission:'Order.Read'},
      {path:'/invoices',label:'فاکتورهای خرید و فروش',icon:'receipt_long',permission:'Invoice.Read'},
      {path:'/contacts',label:'مشتری‌ها و طرف‌حساب‌ها',icon:'groups',permission:'Contact.Read'}]},
    {id:'finance',title:'دریافت و پرداخت',hint:'پول، صندوق و بانک',icon:'account_balance_wallet',items:[
      {path:'/payments',label:'دریافت‌ها و پرداخت‌ها',icon:'payments',permission:'Payment.Read'},
      {path:'/cash-bank-accounts',label:'صندوق و حساب‌های بانکی',icon:'account_balance',permission:'CashBankAccount.Read'},
      {path:'/cheques',label:'چک و سفته',icon:'request_quote',permission:'Cheque.Read'}]},
    {id:'catalog',title:'غذا، خدمات و انبار',hint:'فهرست اقلام و گردش کالا',icon:'lunch_dining',items:[
      {path:'/items',label:'غذاها، کالاها و خدمات',icon:'room_service',permission:'Item.Read'},
      {path:'/categories',label:'دسته‌بندی غذا و خدمات',icon:'category',permission:'Category.Read'},
      {path:'/units',label:'واحدها (پرس، عدد و …)',icon:'straighten',permission:'Unit.Read'},
      {path:'/stocks',label:'موجودی کالا',icon:'inventory_2',permission:'Stock.Read'},
      {path:'/stock-movements',label:'گردش و انتقال کالا',icon:'sync_alt',permission:'StockMovement.Read'},
      {path:'/warehouses',label:'انبارها',icon:'warehouse',permission:'Warehouse.Read'}]},
    {id:'reports',title:'گزارش‌ها و حساب‌ها',hint:'طلب، بدهی و نتیجهٔ کار',icon:'insights',items:[
      {path:'/reports/contact-statement',label:'حساب مشتری و تأمین‌کننده',icon:'assignment',permission:'Report.ContactStatement'},
      {path:'/reports/income-expense',label:'گزارش درآمد و هزینه',icon:'query_stats',permission:'Report.ProfitLoss'},
      {path:'/reports/stock-status',label:'گزارش موجودی',icon:'assessment',permission:'Report.StockStatus'}]},
    {id:'settings',title:'مدیریت و تنظیمات',hint:'شعبه، لوگو و تنظیمات چاپ',icon:'settings',items:[
      {path:'/branches',label:'شعبه‌ها و لوگوی شعبه',icon:'store',permission:'Branch.Read'},
      {path:'/company-settings',label:'مشخصات مجموعه و لوگو',icon:'business',permission:'CompanySettings.Read'},
      {path:'/invoice-print-layouts',label:'طراحی چاپ فاکتور',icon:'print',allOf:['CompanySettings.Read','CompanySettings.Update']},
      {path:'/invoice-mrt-designer',label:'طراح کامل قالب MRT',icon:'edit',allOf:['CompanySettings.Read','CompanySettings.Update']},
      {path:'/opening-balances',label:'مانده‌های اول دوره',icon:'start',anyOf:['Contact.Read','Stock.Read']},
      {path:'/users',label:'کاربران سامانه',icon:'manage_accounts',permission:'User.Read'},
      {path:'/roles',label:'نقش‌ها و دسترسی‌ها',icon:'admin_panel_settings',permission:'Role.Read'},
      {path:'/data-maintenance',label:'مدیریت داده‌ها و پاک‌سازی',icon:'delete',admin:true,permission:'DataMaintenance.Read'},
      {path:'/appearance',label:'رنگ و ظاهر برنامه',icon:'palette'}]}
  ];
