using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Services;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
var user = new TestUser();
await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
    .UseInMemoryDatabase(Guid.NewGuid().ToString(), o => o.EnableNullChecks(false))
    .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)).Options,
    new AuditSaveChangesInterceptor(user),user);
var branch = new Branch { Name="تهران",Code="تهران" }; db.Branches.Add(branch); await db.SaveChangesAsync();
var contact = new Contact { Name="مشتری",Code="۱",BranchId=branch.Id };
var other = new Contact { Name="تأمین‌کننده",Code="۲",BranchId=branch.Id };
var wh = new Warehouse { Name="انبار",Code="۱",BranchId=branch.Id };
var item = new Item { Name="کالا",Code="۱",Type=ItemType.Inventory,UnitId=1 };
db.Contacts.AddRange(contact,other); db.Warehouses.Add(wh); db.Items.Add(item); await db.SaveChangesAsync();
var service = new OpeningBalanceService(db,user);
var date = DateTime.UtcNow.Date.AddDays(-10);
var debit = await service.SaveContact(null,new(contact.Id,date,50000,true),default);
await service.SaveContact(null,new(other.Id,date,30000,false),default);
var balance = new ContactBalanceService(db);
Check(await balance.GetCurrentBalanceAsync(contact.Id)==50000,"debit opening");
Check(await balance.GetCurrentBalanceAsync(other.Id)==-30000,"credit opening");
Check(await balance.CalculateBalanceAsync(contact.Id,date)==0,"cutoff excludes opening");
Check((await balance.GetTransactionsAsync(contact.Id,date,DateTime.UtcNow)).Single().Debt==50000,"statement opening");
await Reject(()=>service.SaveContact(null,new(contact.Id,date,1,true),default),"duplicate contact");
var inventory = await service.SaveInventory(null,new(wh.Id,item.Id,date,10),default);
Check(inventory.ValuationPending && inventory.TotalCost==null && db.Stocks.Single().Quantity==10,"unpriced quantity");
Check(db.StockMovements.Single().Type==StockMovementType.OpeningBalance,"distinct movement");
await Reject(()=>service.SaveInventory(null,new(wh.Id,item.Id,date,10),default),"duplicate inventory");
var entry = await db.InventoryOpeningBalances.SingleAsync(); entry.RowVersion=new byte[]{1}; await db.SaveChangesAsync();
inventory = await service.SaveInventory(entry.Id,new(wh.Id,item.Id,date,10,3000,RowVersionBase64:"AQ=="),default);
Check(inventory.TotalCost==30000 && !inventory.ValuationPending && db.Stocks.Single().Quantity==10,"valuation completion");
db.StockMovements.Add(new(){BranchId=branch.Id,WarehouseId=wh.Id,ItemId=item.Id,Type=StockMovementType.SalesOut,Quantity=2,TransactionDateUtc=date.AddDays(1)});
db.Stocks.Single().Quantity=8; await db.SaveChangesAsync();
await Reject(()=>service.SaveInventory(entry.Id,new(wh.Id,item.Id,date,11,3000,RowVersionBase64:Convert.ToBase64String(entry.RowVersion)),default),"used quantity locked");
inventory = await service.SaveInventory(entry.Id,new(wh.Id,item.Id,date,10,3100,RowVersionBase64:Convert.ToBase64String(entry.RowVersion)),default);
Check(inventory.TotalCost==31000 && db.Stocks.Single().Quantity==8,"used cost correction");
await Reject(()=>service.DeleteInventory(entry.Id,Convert.ToBase64String(entry.RowVersion),default),"used deletion locked");
db.Payments.Add(new(){BranchId=branch.Id,ContactId=contact.Id,AccountId=1,Amount=10000,Direction=PaymentDirection.In,DateUtc=date.AddDays(1),Currency="IRR"});
db.Invoices.Add(new(){BranchId=branch.Id,ContactId=contact.Id,InvoiceNumber="برگشت",Type=InvoiceType.SalesReturn,TotalGross=5000,DateUtc=date.AddDays(2),Currency="IRR"});
await db.SaveChangesAsync();
Check(await balance.GetCurrentBalanceAsync(contact.Id)==35000,"receipt and return reduce debt");
var ce = db.ContactOpeningBalances.Single(x=>x.ContactId==contact.Id);ce.RowVersion=new byte[]{1};await db.SaveChangesAsync();
await Reject(()=>service.DeleteContact(ce.Id,"AQ==",default),"used contact locked");
user.BranchId=branch.Id+1;user.IsAdmin=false;
Check((await service.Inventory(null,null,default)).Count==0 && (await service.Contacts(null,default)).Count==0,"branch isolation");
try { StockQuantityCalculator.ApplyMovement(0,StockMovementType.SalesOut,1);throw new Exception("negative allowed"); } catch(BusinessRuleException) {}
Console.WriteLine("PASS opening balances: quantity, pending valuation, totals, receipt/returns, duplicate/used guards, branch isolation, negative stock");
static void Check(bool ok,string name){if(!ok)throw new Exception(name);Console.WriteLine("PASS "+name);}
static async Task Reject(Func<Task> action,string name){try{await action();}catch(BusinessRuleException){Console.WriteLine("PASS "+name);return;}throw new Exception(name);}
sealed class TestUser : ICurrentUserService { public int? UserId=>null;public int? BranchId{get;set;}public bool IsAdmin{get;set;}=true;public bool IsHeadquarters=>false; }
