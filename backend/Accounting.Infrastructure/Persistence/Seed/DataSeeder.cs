using Accounting.Application.Common.Helpers;
using Accounting.Application.Common.Interfaces;
using Accounting.Application.Services;
using Accounting.Domain.Constants;
using Accounting.Domain.Entities;
using Accounting.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Infrastructure.Persistence.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        IInvoiceBalanceService invoiceBalanceService,
        IAccountBalanceService accountBalanceService,
        IPasswordHasher passwordHasher,
        CancellationToken ct = default,
        string demoPassword = "Demo1405!")
    {
        // Helpers (AwayFromZero)
        static decimal R2(decimal v) => Math.Round(v, 2, MidpointRounding.AwayFromZero);
        static decimal R3(decimal v) => Math.Round(v, 3, MidpointRounding.AwayFromZero);
        static decimal R4(decimal v) => Math.Round(v, 4, MidpointRounding.AwayFromZero);

        // 0) Company Settings
        await SeedCompanySettingsAsync(db, ct);

        // 1) Branches
        await SeedBranchesAsync(db, ct);
        var branchIds = await GetActiveBranchIdsAsync(db, ct);
        var headquartersBranchId = await GetHeadquartersBranchIdAsync(db, ct);

        // 1.5) Roles & Users (Auth için gerekli)
        await SeedRolesAsync(db, ct);
        await SeedUsersAsync(db, passwordHasher, headquartersBranchId, branchIds, demoPassword, ct);

        // 2) Warehouses (per branch default)
        await SeedWarehousesAsync(db, branchIds, ct);
        var warehousesAll = await GetActiveWarehousesAsync(db, ct);
        var defaultWarehouseByBranch = BuildDefaultWarehouseByBranch(warehousesAll);

        // 3) Contacts (Customer/Vendor/Employee)
        await SeedContactsAsync(db, branchIds, ct);

        // 4) Categories
        await SeedCategoriesAsync(db, ct);

        foreach (var name in new[] { "پرس", "عدد", "ماه", "کیلوگرم", "بسته", "ساعت", "لیتر" })
        {
            if (!await db.Units.AnyAsync(x => x.Name.ToLower() == name.ToLower(), ct))
                db.Units.Add(new Accounting.Domain.Entities.Unit { Name = name });
        }
        await db.SaveChangesAsync(ct);

        // 5) Items (with categories)
        await SeedItemsAsync(db, branchIds, R4, ct);

        // 6) Cash/Bank Accounts
        await SeedCashBankAccountsAsync(db, branchIds, ct);

        // Lookup'lar (seed sonrası)
        var contactIds = await db.Contacts.AsNoTracking().OrderBy(x => x.Id).Select(x => x.Id).ToListAsync(ct);
        var customerIds = await db.Contacts.AsNoTracking().Where(x => x.IsCustomer).OrderBy(x => x.Id).Select(x => x.Id).ToListAsync(ct);
        var vendorIds = await db.Contacts.AsNoTracking().Where(x => x.IsVendor).OrderBy(x => x.Id).Select(x => x.Id).ToListAsync(ct);
        var employeeIds = await db.Contacts.AsNoTracking().Where(x => x.IsEmployee).OrderBy(x => x.Id).Select(x => x.Id).ToListAsync(ct);

        var itemsAll = await db.Items.AsNoTracking().Include(x => x.Unit).Where(x => !x.IsDeleted).OrderBy(x => x.Id).ToListAsync(ct);
        var accountIds = await db.CashBankAccounts.AsNoTracking().Where(x => !x.IsDeleted).OrderBy(x => x.Id).Select(x => x.Id).ToListAsync(ct);

        var now = DateTime.UtcNow;

        // 8) Stock MVP demo (movements + stocks)
        await SeedStockMovementsAndStocksAsync(
            db,
            branchIds,
            itemsAll,
            defaultWarehouseByBranch,
            now,
            R3,
            ct);

        // 9) Orders
        await SeedOrdersAsync(db, branchIds, itemsAll, customerIds, vendorIds, now, R2, R3, ct);

        // 10) Invoices
        await SeedInvoicesAsync(db, branchIds, itemsAll, customerIds, vendorIds, now, R2, R3, R4, ct);

        // 11) Payments + balance recalc
        await SeedPaymentsAsync(db, branchIds, contactIds, accountIds, invoiceBalanceService, accountBalanceService, now, R2, ct);

        // 14) Cheques (Çek/Senet)
        await SeedChequesAsync(db, branchIds, customerIds, vendorIds, now, R2, ct);

        await db.SaveChangesAsync(ct);
    }

    // -----------------------------
    // SRP METHODS
    // -----------------------------

    private static async Task SeedCompanySettingsAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.CompanySettings.AnyAsync(ct)) return;

        var now = DateTime.UtcNow;

        var settings = new CompanySettings
        {
            Title = "کترینگ نمونه بهار",
            TaxNumber = "1234567890",
            TaxOffice = "اداره مالیاتی تهران",
            Address = "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲",
            Phone = "02155551234",
            Email = "info@bahar.example",
            Website = "https://bahar.example",
            TradeRegisterNo = "12345",
            MersisNo = null,
            LogoUrl = null,
            NationalId = "10101234567",
            PostalCode = "1234567890",
            CreatedAtUtc = now
        };

        db.CompanySettings.Add(settings);
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedBranchesAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.Branches.AnyAsync(ct)) return;

        var now = DateTime.UtcNow;

        db.Branches.AddRange(new List<Branch>
        {
            new() { Code = "مرکزی", Name = "شعبه مرکزی تهران", IsHeadquarters = true, CreatedAtUtc = now },
            new() { Code = "اصفهان", Name = "شعبه اصفهان", IsHeadquarters = false, CreatedAtUtc = now },
            new() { Code = "شیراز",  Name = "شعبه شیراز", IsHeadquarters = false, CreatedAtUtc = now }
        });

        await db.SaveChangesAsync(ct);
    }
    
    private static async Task<int> GetHeadquartersBranchIdAsync(AppDbContext db, CancellationToken ct)
    {
        var hqBranch = await db.Branches
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsHeadquarters)
            .FirstOrDefaultAsync(ct);
        
        return hqBranch?.Id ?? 1;
    }

    private static async Task<List<int>> GetActiveBranchIdsAsync(AppDbContext db, CancellationToken ct)
    {
        var ids = await db.Branches
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Id)
            .Select(x => x.Id)
            .ToListAsync(ct);

        // fallback
        return ids.Count > 0 ? ids : new List<int> { 1 };
    }

    private static async Task SeedWarehousesAsync(AppDbContext db, List<int> branchIds, CancellationToken ct)
    {
        if (await db.Warehouses.AnyAsync(ct)) return;

        var now = DateTime.UtcNow;

        var list = new List<Warehouse>();
        foreach (var branchId in branchIds)
        {
            list.Add(new Warehouse
            {
                BranchId = branchId,
                Code = "انبار",
                Name = "انبار اصلی",
                IsDefault = true,
                CreatedAtUtc = now
            });
        }

        db.Warehouses.AddRange(list);
        await db.SaveChangesAsync(ct);
    }

    private static async Task<List<Warehouse>> GetActiveWarehousesAsync(AppDbContext db, CancellationToken ct)
    {
        return await db.Warehouses
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Id)
            .ToListAsync(ct);
    }

    private static Dictionary<int, Warehouse> BuildDefaultWarehouseByBranch(List<Warehouse> warehousesAll)
    {
        return warehousesAll
            .GroupBy(w => w.BranchId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.IsDefault).ThenBy(x => x.Id).First()
            );
    }

    private static async Task SeedContactsAsync(AppDbContext db, List<int> branchIds, CancellationToken ct)
    {
        if (await db.Contacts.AnyAsync(ct)) return;

        var contacts = new List<Contact>();

        // 1. Şirket Müşteri (Corporate Customer)
        contacts.Add(new Contact
        {
            BranchId = branchIds[0],
            Code = "مشتری۰۰۱",
            Name = "شرکت آسمان، مشتری غذای روزانه",
            IsCustomer = true,
            Email = "aseman@example.com",
            Phone = "02125551010",
            CompanyDetails = new CompanyDetails { TaxNumber = "1111111110", TaxOffice = "تهران" }
        });

        // 2. Şahıs Müşteri / Perakende (Retail Customer)
        contacts.Add(new Contact
        {
            BranchId = branchIds[1 % branchIds.Count],
            Code = "خرده۰۰۱",
            Name = "احمد رضایی",
            IsCustomer = false,  // Perakende müşteri, kurumsal değil
            IsRetail = true,
            Email = "rezaei@example.com",
            Phone = "05325552020",
            PersonDetails = new PersonDetails { Tckn = "0012345678", FirstName = "احمد", LastName = "رضایی" }
        });

        // 3. Tedarikçi Şirket (Corporate Vendor)
        contacts.Add(new Contact
        {
            BranchId = branchIds[0],
            Code = "تأمین۰۰۱",
            Name = "تأمین مواد غذایی پارس",
            IsVendor = true,
            Email = "pars@example.com",
            Phone = "02164443030",
            CompanyDetails = new CompanyDetails { TaxNumber = "2222222220", TaxOffice = "تهران" }
        });

        // 4. Çalışan 1 (Employee)
        contacts.Add(new Contact
        {
            BranchId = branchIds[0],
            Code = "کارمند۰۰۱",
            Name = "محمد احمدی",
            IsEmployee = true,
            Email = "ahmadi@example.com",
            Phone = "05335554040",
            PersonDetails = new PersonDetails 
            { 
                Tckn = "0023456789", FirstName = "محمد", LastName = "احمدی", 
                Title = "مدیر فروش", Department = "فروش" 
            }
        });

        // 5. Çalışan 2 (Employee)
        contacts.Add(new Contact
        {
            BranchId = branchIds[1 % branchIds.Count],
            Code = "کارمند۰۰۲",
            Name = "مریم محمدی",
            IsEmployee = true,
            Email = "mohammadi@example.com",
            Phone = "05345555050",
            PersonDetails = new PersonDetails 
            { 
                Tckn = "0034567890", FirstName = "مریم", LastName = "محمدی", 
                Title = "کارشناس حسابداری", Department = "امور مالی" 
            }
        });

        // 6. Şirket Müşteri + Tedarikçi (Customer & Vendor) - Mahsuplaşma örneği
        contacts.Add(new Contact
        {
            BranchId = branchIds[2 % branchIds.Count],
            Code = "همکار۰۰۱",
            Name = "خدمات پذیرایی همراه",
            IsCustomer = true,
            IsVendor = true,
            Email = "hamrah@example.com",
            Phone = "08502226060",
            CompanyDetails = new CompanyDetails { TaxNumber = "5555555550", TaxOffice = "شیراز" }
        });

        // 7. Şahıs Şirketi (Sole Proprietorship) - Hem Şahıs hem Şirket
        contacts.Add(new Contact
        {
            BranchId = branchIds[0],
            Code = "بازرگان۰۰۱",
            Name = "علی کریمی - بازرگانی کریمی",
            IsCustomer = true,
            IsVendor = false,
            Email = "karimi@example.com",
            Phone = "05559998877",
            // Hybrid Identity
            PersonDetails = new PersonDetails 
            { 
                Tckn = "0045678901", 
                FirstName = "علی", 
                LastName = "کریمی" 
            },
            CompanyDetails = new CompanyDetails 
            { 
                TaxNumber = "9999999990", 
                TaxOffice = "تهران", 
                MersisNo = null 
            }
        });

        foreach(var (first,last) in new[]{("سارا","حسینی"),("حسن","کریمی"),("فاطمه","مرادی")})
            contacts.Add(new Contact{BranchId=branchIds[0],Code=$"مشتری-{contacts.Count+1:000}",Name=$"{first} {last}",IsCustomer=true,
                PersonDetails=new PersonDetails{FirstName=first,LastName=last}});
        for (var i = 0; i < contacts.Count; i++)
        {
            var contact = contacts[i];
            contact.NationalId = contact.PersonDetails?.Tckn ?? $"10101234{i:000}";
            contact.PostalCode = $"1234567{i:000}";
            contact.Address = $"ایران، {(contact.BranchId == branchIds[0] ? "تهران" : contact.BranchId == branchIds[1 % branchIds.Count] ? "اصفهان" : "شیراز")}، خیابان بهار، پلاک {i + 1}";
            contact.Phone = $"09121234{i:000}";
        }
        db.Contacts.AddRange(contacts);
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedCategoriesAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.Categories.AnyAsync(ct)) return;
        db.Categories.AddRange(
            new Category {RowVersion=Array.Empty<byte>(),Name="غذاهای ایرانی",Description="غذاهای اصلی و خوراک‌های کترینگ",Color="#22C55E"},
            new Category {RowVersion=Array.Empty<byte>(),Name="مواد اولیه",Description="برنج، روغن و مواد مصرفی آشپزخانه",Color="#F59E0B"},
            new Category {RowVersion=Array.Empty<byte>(),Name="نوشیدنی و مخلفات",Description="نوشیدنی، سالاد و دسر",Color="#3B82F6"},
            new Category {RowVersion=Array.Empty<byte>(),Name="خدمات پذیرایی",Description="ارسال و پذیرایی مراسم",Color="#EC4899"},
            new Category {RowVersion=Array.Empty<byte>(),Name="هزینه و تجهیزات",Description="هزینه‌ها و تجهیزات آشپزخانه",Color="#8B5CF6"});
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedItemsAsync(AppDbContext db, List<int> branchIds, Func<decimal,decimal> round, CancellationToken ct)
    {
        if(await db.Items.AnyAsync(ct)) return;
        var units=await db.Units.ToDictionaryAsync(x=>x.Name,x=>x.Id,ct);
        var categories=await db.Categories.OrderBy(x=>x.Id).Select(x=>x.Id).ToListAsync(ct);
        var definitions=new (string Name,string Unit,int Category,ItemType Type,decimal Sale,decimal Purchase)[]
        {
            ("چلوکباب کوبیده","پرس",0,ItemType.Inventory,2500000,1800000),
            ("زرشک‌پلو با مرغ","پرس",0,ItemType.Inventory,2200000,1600000),
            ("چلو جوجه‌کباب","پرس",0,ItemType.Inventory,2400000,1750000),
            ("قورمه‌سبزی با برنج","پرس",0,ItemType.Inventory,1800000,1300000),
            ("قیمه با برنج","پرس",0,ItemType.Inventory,1700000,1200000),
            ("عدس‌پلو با گوشت","پرس",0,ItemType.Inventory,1600000,1100000),
            ("برنج ایرانی","کیلوگرم",1,ItemType.Inventory,1800000,1500000),
            ("روغن خوراکی","لیتر",1,ItemType.Inventory,850000,700000),
            ("مرغ تازه","کیلوگرم",1,ItemType.Inventory,1200000,1000000),
            ("نوشابه خانواده","عدد",2,ItemType.Inventory,450000,350000),
            ("دوغ خانواده","عدد",2,ItemType.Inventory,400000,300000),
            ("سالاد فصل","عدد",2,ItemType.Inventory,350000,200000),
            ("ماست موسیر","عدد",2,ItemType.Inventory,250000,150000),
            ("خدمات پذیرایی مراسم","ساعت",3,ItemType.Service,2500000,1500000),
            ("ارسال سفارش","عدد",3,ItemType.Service,500000,300000),
            ("هزینه برق آشپزخانه","ماه",4,ItemType.Expense,0,5000000),
            ("اجاره آشپزخانه","ماه",4,ItemType.Expense,0,80000000),
            ("اجاق گاز صنعتی","عدد",4,ItemType.FixedAsset,0,150000000)
        };
        for(var i=0;i<definitions.Length;i++)
        {
            var d=definitions[i];
            db.Items.Add(new Item {Code=$"نمونه-{i+1:000}",Name=d.Name,UnitId=units[d.Unit],CategoryId=categories[d.Category % categories.Count],Type=d.Type,SalesPrice=round(d.Sale),PurchasePrice=round(d.Purchase),VatRate=0});
        }
        await db.SaveChangesAsync(ct);
        if(!await db.MealPackages.AnyAsync(ct))
        {
            var meals=await db.Items.Where(x=>x.Name=="زرشک‌پلو با مرغ" || x.Name=="سالاد فصل" || x.Name=="دوغ خانواده").ToListAsync(ct);
            var package=new MealPackage {Name="پکیج ناهار اداری"};
            for(var i=0;i<meals.Count;i++)package.Lines.Add(new MealPackageLine{ItemId=meals[i].Id,Position=i,Quantity=1,UnitPrice=meals[i].SalesPrice ?? 0,VatRate=0});
            db.MealPackages.Add(package);await db.SaveChangesAsync(ct);
        }
    }

    private static async Task SeedCashBankAccountsAsync(AppDbContext db, List<int> branchIds, CancellationToken ct)
    {
        if (await db.CashBankAccounts.AnyAsync(ct)) return;

        var now = DateTime.UtcNow;

        var accounts = new List<CashBankAccount>
        {
            new() { BranchId = branchIds[0 % branchIds.Count], Code = "صندوق۰۰۱", Name = "صندوق مرکزی", Type = CashBankAccountType.Cash, Currency = "IRR", Balance = 0m, CreatedAtUtc = now },
            new() { BranchId = branchIds[0 % branchIds.Count], Code = "بانک۰۰۱", Name = "حساب ریالی بانک ملی", Type = CashBankAccountType.Bank, Currency = "IRR", Balance = 0m, CreatedAtUtc = now },
            new() { BranchId = branchIds[0 % branchIds.Count], Code = "بانک۰۰۲", Name = "حساب ریالی بانک ملت", Type = CashBankAccountType.Bank, Currency = "IRR", Balance = 0m, CreatedAtUtc = now },
            new() { BranchId = branchIds[1 % branchIds.Count], Code = "صندوق۰۰۲", Name = "صندوق اصفهان", Type = CashBankAccountType.Cash, Currency = "IRR", Balance = 0m, CreatedAtUtc = now },
            new() { BranchId = branchIds[2 % branchIds.Count], Code = "صندوق۰۰۳", Name = "صندوق شیراز", Type = CashBankAccountType.Cash, Currency = "IRR", Balance = 0m, CreatedAtUtc = now }
        };

        db.CashBankAccounts.AddRange(accounts);
        await db.SaveChangesAsync(ct);
    }


    private static async Task SeedStockMovementsAndStocksAsync(
        AppDbContext db,
        List<int> branchIds,
        List<Item> itemsAll,
        Dictionary<int, Warehouse> defaultWarehouseByBranch,
        DateTime now,
        Func<decimal, decimal> R3,
        CancellationToken ct)
    {
        if (await db.Stocks.AnyAsync(ct)) return;

        // Sadece fiziksel/stoklu ürünler depo stoku taşır — Hizmet/Masraf/Demirbaş
        // kalemleri için "stok" kavramı anlamsız (ör. "Elektrik Gideri: 381 adet stokta" gibi
        // demoyu güvenilmez gösteren saçma bir görünüme yol açmasın diye).
        var trackedItems = itemsAll.Where(x => x.Type == ItemType.Inventory).ToList();
        if (!trackedItems.Any()) return;

        var effectiveBranchIds = branchIds.Count > 0 ? branchIds : new List<int> { 1 };

        var movements = new List<StockMovement>();
        var stocks = new List<Stock>();

        foreach (var branchId in effectiveBranchIds)
        {
            if (!defaultWarehouseByBranch.TryGetValue(branchId, out var warehouse)) continue;

            foreach (var item in trackedItems)
            {
                var initialQty = R3(50m + (item.Id * 7) % 100);

                movements.Add(new StockMovement
                {
                    BranchId = branchId,
                    WarehouseId = warehouse.Id,
                    ItemId = item.Id,
                    Type = StockMovementType.AdjustmentIn,
                    Quantity = initialQty,
                    TransactionDateUtc = now.AddDays(-30),
                    Note = "موجودی ابتدای دوره",
                    CreatedAtUtc = now.AddDays(-30)
                });

                stocks.Add(new Stock
                {
                    BranchId = branchId,
                    WarehouseId = warehouse.Id,
                    ItemId = item.Id,
                    Quantity = initialQty,
                    CreatedAtUtc = now.AddDays(-30)
                });
            }
        }

        db.StockMovements.AddRange(movements);
        db.Stocks.AddRange(stocks);
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedOrdersAsync(
        AppDbContext db,
        List<int> branchIds,
        List<Item> itemsAll,
        List<int> customerIds,
        List<int> vendorIds,
        DateTime now,
        Func<decimal, decimal> R2,
        Func<decimal, decimal> R3,
        CancellationToken ct)
    {
        if (await db.Orders.AnyAsync(ct)) return;

        // Siparişler sadece stoklu (Inventory) kalemler üzerinden kurulur — Gider/Hizmet/Demirbaş
        // sipariş akışının parçası değil.
        var invItems = itemsAll.Where(x => x.Type == ItemType.Inventory).ToList();
        if (!invItems.Any()) return;

        var effectiveBranchIds = branchIds.Count > 0 ? branchIds : new List<int> { 1 };

        var orders = new List<Order>();

        // 5 satış siparişi — ürün çeşitliliği için kalemler döngüsel seçiliyor
        // (tek bir ürüne sabitlenmiş bir demo, gerçekçi görünmüyordu)
        for (int i = 1; i <= 10; i++)
        {
            var branchId = effectiveBranchIds[(i - 1) % effectiveBranchIds.Count];
            var customerId = customerIds[(i - 1) % customerIds.Count];
            branchId = await db.Contacts.Where(c => c.Id == customerId).Select(c => c.BranchId).FirstAsync(ct);
            var mealItems=invItems.Where(x=>x.Unit!.Name=="پرس").ToList();
            var pool=mealItems.Count>0?mealItems:invItems;
            var item=pool[(i-1)%pool.Count];

            var qty = R3(1m + (i % 5));
            var unitPrice = item.SalesPrice ?? R2(100m);
            var vatRate = item.VatRate;
            var net = R2(qty * unitPrice);
            var vat = R2(net * vatRate / 100m);
            var gross = R2(net + vat);

            var status = i switch
            {
                1 => OrderStatus.Draft,
                2 => OrderStatus.Approved,
                3 => OrderStatus.Approved,
                4 => OrderStatus.Cancelled,
                _ => OrderStatus.Draft
            };

            orders.Add(new Order
            {
                BranchId = branchId,
                ContactId = customerId,
                OrderNumber = $"سفارش‌فروش-{now.Year}-{i:0000}",
                Type = InvoiceType.Sales,
                Status = status,
                DateUtc = now.AddDays(-i * 2),
                Currency = "IRR",
                TotalNet = net,
                TotalVat = vat,
                TotalGross = gross,
                Lines = new List<OrderLine>
                {
                    new()
                    {
                        ItemId = item.Id,
                        Description = item.Name,
                        Quantity = qty,
                        UnitPrice = unitPrice,
                        VatRate = vatRate,
                        Total = net,
                        CreatedAtUtc = now.AddDays(-i * 2)
                    }
                },
                CreatedAtUtc = now.AddDays(-i * 2)
            });
        }

        // 3 alış siparişi
        for (int i = 1; i <= 3; i++)
        {
            var branchId = effectiveBranchIds[(i - 1) % effectiveBranchIds.Count];
            var vendorId = vendorIds[(i - 1) % vendorIds.Count];
            branchId = await db.Contacts.Where(c => c.Id == vendorId).Select(c => c.BranchId).FirstAsync(ct);
            var item = invItems[(i + 1) % invItems.Count];

            var qty = R3(5m + (i * 3));
            var unitPrice = item.PurchasePrice ?? R2(80m);
            var vatRate = item.VatRate;
            var net = R2(qty * unitPrice);
            var vat = R2(net * vatRate / 100m);
            var gross = R2(net + vat);

            orders.Add(new Order
            {
                BranchId = branchId,
                ContactId = vendorId,
                OrderNumber = $"سفارش‌خرید-{now.Year}-{i:0000}",
                Type = InvoiceType.Purchase,
                Status = i == 1 ? OrderStatus.Draft : OrderStatus.Approved,
                DateUtc = now.AddDays(-i * 3),
                Currency = "IRR",
                TotalNet = net,
                TotalVat = vat,
                TotalGross = gross,
                Lines = new List<OrderLine>
                {
                    new()
                    {
                        ItemId = item.Id,
                        Description = item.Name,
                        Quantity = qty,
                        UnitPrice = unitPrice,
                        VatRate = vatRate,
                        Total = net,
                        CreatedAtUtc = now.AddDays(-i * 3)
                    }
                },
                CreatedAtUtc = now.AddDays(-i * 3)
            });
        }

        db.Orders.AddRange(orders);
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedInvoicesAsync(
        AppDbContext db,
        List<int> branchIds,
        List<Item> itemsAll,
        List<int> customerIds,
        List<int> vendorIds,
        DateTime now,
        Func<decimal, decimal> R2,
        Func<decimal, decimal> R3,
        Func<decimal, decimal> R4,
        CancellationToken ct)
    {
        if (await db.Invoices.AnyAsync(ct)) return;

        // Ürün çeşitliliği için satış/alış faturaları tek bir kaleme sabitlenmek yerine
        // stoklu kalemler arasında döngüsel seçiliyor. Son birkaç alış faturası ise
        // bilinçli olarak Gider/Hizmet tipinde kalemler kullanır — aksi halde Gelir/Gider
        // Raporu'ndaki "Faaliyet Giderleri" satırı seed data ile hiçbir zaman 0'ın üzerine
        // çıkmıyordu (hiçbir alış faturası Gider/Hizmet kalemi içermiyordu).
        var invItems = itemsAll.Where(x => x.Type == ItemType.Inventory).ToList();
        var expenseServiceItems = itemsAll.Where(x => x.Type == ItemType.Expense || x.Type == ItemType.Service).ToList();
        if (!invItems.Any()) return;

        var effectiveBranchIds = branchIds.Count > 0 ? branchIds : new List<int> { 1 };

        var invoices = new List<Invoice>();

        for (int i = 1; i <= 18; i++)
        {
            var isSales = i <= 10;
            var invType = isSales ? InvoiceType.Sales : InvoiceType.Purchase;
            var prefix = isSales ? "فروش" : "خرید";

            var branchId = effectiveBranchIds[(i - 1) % effectiveBranchIds.Count];
            var contactId = isSales
                ? customerIds[(i - 1) % customerIds.Count]
                : vendorIds[(i - 1) % vendorIds.Count];
            branchId = await db.Contacts.Where(c => c.Id == contactId).Select(c => c.BranchId).FirstAsync(ct);

            var useExpenseItem = !isSales && i > 16 && expenseServiceItems.Any();
            var candidates=invItems.Where(x=>isSales ? x.Unit!.Name=="پرس" : x.Unit!.Name!="پرس").ToList();
            if(candidates.Count==0)candidates=invItems;
            var item=useExpenseItem ? expenseServiceItems[(i-17)%expenseServiceItems.Count] : candidates[(i-1)%candidates.Count];

            var qty = useExpenseItem ? 1m : R3(1m + (i % 7) * 2);
            var unitPrice = isSales
                ? (item.SalesPrice ?? R4(100m))
                : (item.PurchasePrice ?? R4(80m));

            var vatRate = item.VatRate;
            var net = R2(qty * unitPrice);
            var vat = R2(net * vatRate / 100m);
            var gross = R2(net + vat);

            invoices.Add(new Invoice
            {
                BranchId = branchId,
                ContactId = contactId,
                InvoiceNumber = $"{prefix}-{i:0000}",
                Type = invType,
                DateUtc = now.AddDays(-i),
                Currency = "IRR",
                TotalLineGross = R2(net),
                TotalNet = R2(net),
                TotalVat = R2(vat),
                TotalGross = R2(gross),
                Balance = R2(gross),
                Lines = new List<InvoiceLine>
                {
                    new()
                    {
                        ItemId = item.Id,
                        ItemCode = item.Code,
                        ItemName = item.Name,
                        Unit = item.Unit.Name,
                        Qty = qty,
                        UnitPrice = unitPrice,
                        VatRate = vatRate,
                        Net = net,
                        Vat = vat,
                        Gross = net,
                        GrandTotal = gross,
                        CreatedAtUtc = now.AddDays(-i),
                        AccountCode = AccountCodeHelper.GetAccountCode(invType, item.Type)
                    }
                },
                CreatedAtUtc = now.AddDays(-i)
            });
        }

        db.Invoices.AddRange(invoices);
        await db.SaveChangesAsync(ct);
        foreach (var invoice in invoices)
        {
            var warehouse = await db.Warehouses.Where(w => w.BranchId == invoice.BranchId)
                .OrderByDescending(w => w.IsDefault).ThenBy(w => w.Id).FirstAsync(ct);
            foreach (var line in invoice.Lines)
            {
                if (itemsAll.First(i => i.Id == line.ItemId).Type != ItemType.Inventory) continue;
                var stock = await db.Stocks.FirstAsync(x => x.BranchId == invoice.BranchId
                    && x.WarehouseId == warehouse.Id && x.ItemId == line.ItemId, ct);
                var type = invoice.Type == InvoiceType.Sales ? StockMovementType.SalesOut : StockMovementType.PurchaseIn;
                stock.Quantity = StockQuantityCalculator.ApplyMovement(stock.Quantity, type, line.Qty);
                db.StockMovements.Add(new StockMovement
                {
                    BranchId = invoice.BranchId, WarehouseId = warehouse.Id, ItemId = line.ItemId!.Value,
                    InvoiceId = invoice.Id, Quantity = line.Qty, Type = type,
                    TransactionDateUtc = invoice.DateUtc, CreatedAtUtc = invoice.CreatedAtUtc,
                    Note = "گردش انبار فاکتور نمونه"
                });
            }
        }
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedPaymentsAsync(
        AppDbContext db,
        List<int> branchIds,
        List<int> contactIds,
        List<int> accountIds,
        IInvoiceBalanceService invoiceBalanceService,
        IAccountBalanceService accountBalanceService,
        DateTime now,
        Func<decimal, decimal> R2,
        CancellationToken ct)
    {
        if (await db.Payments.AnyAsync(ct)) return;

        var invoiceIds = await db.Invoices.AsNoTracking().OrderBy(x => x.Id).Select(x => x.Id).ToListAsync(ct);

        var payments = new List<Payment>();

        // Faturaya bağlı ödemeler
        for (int i = 1; i <= Math.Min(10, invoiceIds.Count); i++)
        {
            var invoiceId = invoiceIds[i - 1];

            var invoice = await db.Invoices
                .AsNoTracking()
                .Where(inv => inv.Id == invoiceId)
                .Select(inv => new { inv.TotalGross, inv.Currency, inv.Type, inv.BranchId, inv.ContactId })
                .FirstOrDefaultAsync(ct);

            if (invoice == null) continue;
            if (invoice.Type != InvoiceType.Sales && invoice.Type != InvoiceType.Purchase) continue;
            if (invoice.TotalGross <= 0) continue;
            if (invoice.Currency != "IRR") continue;

            var percentage = 0.3m + ((i * 7) % 41) / 100m;
            var paymentAmount = R2(invoice.TotalGross * percentage);

            var contactId = invoice.ContactId;
            var paymentBranchId = invoice.BranchId;
            var accountId = await db.CashBankAccounts.Where(a => a.BranchId == paymentBranchId).OrderBy(a => a.Id).Select(a => a.Id).FirstAsync(ct);

            payments.Add(new Payment
            {
                BranchId = paymentBranchId,
                AccountId = accountId,
                ContactId = contactId,
                LinkedInvoiceId = invoiceId,
                Direction = invoice.Type == InvoiceType.Sales ? PaymentDirection.In : PaymentDirection.Out,
                Amount = paymentAmount,
                Currency = "IRR",
                DateUtc = now.AddHours(-i * 6),
                CreatedAtUtc = now.AddHours(-i * 6)
            });
        }

        // Bağımsız ödemeler
        for (int i = 1; i <= 5; i++)
        {
            var contactId = contactIds[(i - 1) % contactIds.Count];
            var paymentBranchId = await db.Contacts.Where(c => c.Id == contactId).Select(c => c.BranchId).FirstAsync(ct);
            var accountId = await db.CashBankAccounts.Where(a => a.BranchId == paymentBranchId).OrderBy(a => a.Id).Select(a => a.Id).FirstAsync(ct);

            payments.Add(new Payment
            {
                BranchId = paymentBranchId,
                AccountId = accountId,
                ContactId = contactId,
                LinkedInvoiceId = null,
                Direction = (i % 2 == 0) ? PaymentDirection.In : PaymentDirection.Out,
                Amount = R2(100m + i * 50m),
                Currency = "IRR",
                DateUtc = now.AddHours(-i * 12),
                CreatedAtUtc = now.AddHours(-i * 12)
            });
        }

        db.Payments.AddRange(payments);
        await db.SaveChangesAsync(ct);

        // Invoice balance recalc
        var linkedInvoiceIds = payments
            .Where(p => p.LinkedInvoiceId.HasValue)
            .Select(p => p.LinkedInvoiceId!.Value)
            .Distinct()
            .ToList();

        foreach (var invoiceId in linkedInvoiceIds)
        {
            await invoiceBalanceService.RecalculateBalanceAsync(invoiceId);
        }

        // Account balance recalc
        var affectedAccountIds = payments
            .Select(p => p.AccountId)
            .Distinct()
            .ToList();

        foreach (var accountId in affectedAccountIds)
        {
            await accountBalanceService.RecalculateBalanceAsync(accountId, ct);
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedChequesAsync(
        AppDbContext db,
        List<int> branchIds,
        List<int> customerIds,
        List<int> vendorIds,
        DateTime now,
        Func<decimal, decimal> R2,
        CancellationToken ct)
    {
        if (await db.Cheques.AnyAsync(ct)) return;

        var cheques = new List<Cheque>();
        var bankNames = new[] { "بانک ملی", "بانک ملت", "بانک صادرات", "بانک کشاورزی", "بانک تجارت" };

        // Müşteriden alınan çekler (Inbound)
        for (int i = 1; i <= 6; i++)
        {
            var branchId = branchIds[(i - 1) % branchIds.Count];
            var customerId = customerIds[(i - 1) % customerIds.Count];
            branchId = await db.Contacts.Where(c => c.Id == customerId).Select(c => c.BranchId).FirstAsync(ct);
            var daysUntilDue = 30 + (i * 15);

            var status = i switch
            {
                1 => ChequeStatus.Paid,
                2 => ChequeStatus.Endorsed,
                6 => ChequeStatus.Bounced,
                _ => ChequeStatus.Pending
            };

            cheques.Add(new Cheque
            {
                BranchId = branchId,
                ContactId = customerId,
                Type = ChequeType.Cheque,
                Direction = ChequeDirection.Inbound,
                Status = status,
                ChequeNumber = $"چک‌دریافتی-{now.Year}-{i:0000}",
                IssueDate = now.AddDays(-30),
                DueDate = now.AddDays(daysUntilDue - 30),
                Amount = R2(5000m + i * 2500m),
                Currency = "IRR",
                BankName = bankNames[(i - 1) % bankNames.Length],
                BankBranch = $"شعبه {i}",
                AccountNumber = $"IR{i:00}0001000{i:00}00000000{i:000}",
                DrawerName = $"شرکت مشتری نمونه {i}",
                Description = $"بابت فروش - گروه فاکتور {i}",
                CreatedAtUtc = now.AddDays(-30)
            });
        }

        // Müşteriden alınan senetler (Inbound - Promissory Note)
        for (int i = 1; i <= 3; i++)
        {
            var branchId = branchIds[(i - 1) % branchIds.Count];
            var customerId = customerIds[(i - 1) % customerIds.Count];
            branchId = await db.Contacts.Where(c => c.Id == customerId).Select(c => c.BranchId).FirstAsync(ct);

            cheques.Add(new Cheque
            {
                BranchId = branchId,
                ContactId = customerId,
                Type = ChequeType.PromissoryNote,
                Direction = ChequeDirection.Inbound,
                Status = i == 1 ? ChequeStatus.Paid : ChequeStatus.Pending,
                ChequeNumber = $"سفته‌دریافتی-{now.Year}-{i:0000}",
                IssueDate = now.AddDays(-45),
                DueDate = now.AddDays(60 + i * 30),
                Amount = R2(10000m + i * 5000m),
                Currency = "IRR",
                DrawerName = $"مشتری نمونه {i}",
                Description = $"فروش مدت‌دار - سفته {i}",
                CreatedAtUtc = now.AddDays(-45)
            });
        }

        // Tedarikçiye verilen çekler (Outbound)
        for (int i = 1; i <= 4; i++)
        {
            var branchId = branchIds[(i - 1) % branchIds.Count];
            var vendorId = vendorIds[(i - 1) % vendorIds.Count];
            branchId = await db.Contacts.Where(c => c.Id == vendorId).Select(c => c.BranchId).FirstAsync(ct);

            var status = i switch
            {
                1 => ChequeStatus.Paid,
                4 => ChequeStatus.Cancelled,
                _ => ChequeStatus.Pending
            };

            cheques.Add(new Cheque
            {
                BranchId = branchId,
                ContactId = vendorId,
                Type = ChequeType.Cheque,
                Direction = ChequeDirection.Outbound,
                Status = status,
                ChequeNumber = $"چک‌پرداختی-{now.Year}-{i:0000}",
                IssueDate = now.AddDays(-15),
                DueDate = now.AddDays(30 + i * 15),
                Amount = R2(3000m + i * 1500m),
                Currency = "IRR",
                BankName = "بانک ملی",
                BankBranch = "مرکزی",
                AccountNumber = "IR000000000000000000000001",
                Description = $"پرداخت به تأمین‌کننده - {i}",
                CreatedAtUtc = now.AddDays(-15)
            });
        }

        // Tedarikçiye verilen senetler (Outbound - Promissory Note)
        for (int i = 1; i <= 2; i++)
        {
            var branchId = branchIds[(i - 1) % branchIds.Count];
            var vendorId = vendorIds[(i - 1) % vendorIds.Count];
            branchId = await db.Contacts.Where(c => c.Id == vendorId).Select(c => c.BranchId).FirstAsync(ct);

            cheques.Add(new Cheque
            {
                BranchId = branchId,
                ContactId = vendorId,
                Type = ChequeType.PromissoryNote,
                Direction = ChequeDirection.Outbound,
                Status = ChequeStatus.Pending,
                ChequeNumber = $"سفته‌پرداختی-{now.Year}-{i:0000}",
                IssueDate = now.AddDays(-20),
                DueDate = now.AddDays(90 + i * 30),
                Amount = R2(15000m + i * 7500m),
                Currency = "IRR",
                Description = $"خرید مدت‌دار - سفته تأمین‌کننده {i}",
                CreatedAtUtc = now.AddDays(-20)
            });
        }

        db.Cheques.AddRange(cheques);
        await db.SaveChangesAsync(ct);
    }

    internal static async Task SeedRolesAsync(AppDbContext db, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // Helper to Create Role if not exists
        async Task CreateRoleIfNotExists(string name, string desc, bool isStatic, string[] permissions)
        {
            if (await db.Roles.AnyAsync(r => r.Name == name, ct)) return;

            var role = new Role
            {
                Name = name,
                Description = desc,
                IsStatic = isStatic,
                CreatedAtUtc = now
            };

            foreach (var p in permissions.Concat(permissions.Where(p => p.StartsWith("Item.")).Select(p => p.Replace("Item.", "Unit."))).Distinct())
            {
                role.Permissions.Add(new RolePermission { Permission = p, CreatedAtUtc = now });
            }

            db.Roles.Add(role);
        }

        // 1. Admin (Sistem Yöneticisi) - Her yetkiye sahip
        await CreateRoleIfNotExists("مدیر سامانه", "مدیریت سامانه با دسترسی کامل", true, Permissions.GetAll().ToArray());

        // 2. Patron (İşletme Sahibi) - Her şeyi görür, onaylar, ama sistem ayarlarına dokunmaz (Genelde)
        // KOBİ'de Patron genelde Admin gibidir ama biz ayrım yapalım. CompanySettings okuyup güncelleyebilir.
        var patronPerms = Permissions.GetAll()
            .Where(p => !p.StartsWith("User.") && !p.StartsWith("Role.")) // Kullanıcı yönetimi hariç (opsiyonel)
            .Concat(new[] { Permissions.User.Read, Permissions.Role.Read }) // Sadece görüntülesin
            .ToArray();
        
        // Patron'a Admin gibi full yetki de verebiliriz, talep "مدیر کسب‌وکار" rolü olduğu için business odaklı full yapıyoruz.
        await CreateRoleIfNotExists("مدیر کسب‌وکار", "مدیریت کسب‌وکار، گزارش‌ها و تأیید عملیات", false, patronPerms);

        // 3. Muhasebe Şefi (Mali Müşavir / Muhasebe Müdürü)
        // Finansal tüm işlemler, Raporlar, Onaylamalar. Silme yetkisi var.
        var sefPerms = new[]
        {
            // Finans
            Permissions.Invoice.Create, Permissions.Invoice.Read, Permissions.Invoice.Update, Permissions.Invoice.Delete,
            Permissions.Payment.Create, Permissions.Payment.Read, Permissions.Payment.Update, Permissions.Payment.Delete,
            Permissions.CashBankAccount.Create, Permissions.CashBankAccount.Read, Permissions.CashBankAccount.Update, Permissions.CashBankAccount.Delete,
            Permissions.Cheque.Create, Permissions.Cheque.Read, Permissions.Cheque.Update, Permissions.Cheque.Delete, Permissions.Cheque.UpdateStatus,
            // Ticari
            Permissions.Contact.Create, Permissions.Contact.Read, Permissions.Contact.Update, Permissions.Contact.Delete,
            Permissions.Order.Create, Permissions.Order.Read, Permissions.Order.Update, Permissions.Order.Delete, Permissions.Order.Approve, Permissions.Order.CreateInvoice, Permissions.Order.Cancel,
            Permissions.Item.Create, Permissions.Item.Read, Permissions.Item.Update, Permissions.Item.Delete,
            Permissions.Category.Create, Permissions.Category.Read, Permissions.Category.Update, Permissions.Category.Delete,
            Permissions.Branch.Read,
            Permissions.Warehouse.Read,
            // Rapor
            Permissions.Report.Dashboard, Permissions.Report.ProfitLoss, Permissions.Report.ContactStatement, Permissions.Report.StockStatus,
            // Ayar (Sadece okuma, belki vergi no vs güncelleme)
            Permissions.CompanySettings.Read, Permissions.CompanySettings.Update
        };
        await CreateRoleIfNotExists("سرپرست حسابداری", "سرپرستی حسابداری با دسترسی کامل مالی", false, sefPerms);

        // 4. Ön Muhasebe (Veri Giriş Elemanı)
        // Fatura/Cari/Sipariş girer. Silemez (Audit). Raporların detayını (Kar/Zarar) görmez.
        var onMuhasebePerms = new[]
        {
            Permissions.Invoice.Create, Permissions.Invoice.Read, Permissions.Invoice.Update, // Delete yok
            Permissions.Payment.Create, Permissions.Payment.Read, Permissions.Payment.Update,
            Permissions.Contact.Create, Permissions.Contact.Read, Permissions.Contact.Update,
            Permissions.Order.Create, Permissions.Order.Read, Permissions.Order.Update, Permissions.Order.CreateInvoice, // Approve/Cancel genelde yetkili işidir
            Permissions.Item.Read,
            Permissions.CashBankAccount.Read, // Bakiyeyi görür ama düzeltme yapamaz
            Permissions.Cheque.Create, Permissions.Cheque.Read, Permissions.Cheque.Update, // Çek girişi yapar
            Permissions.Stock.Read,
            Permissions.Warehouse.Read,
            Permissions.Category.Read,
            Permissions.Report.Dashboard // Sadece özet
        };
        await CreateRoleIfNotExists("کارشناس حسابداری", "ثبت اطلاعات حسابداری و مالی", false, onMuhasebePerms);

        // 5. Depo Sorumlusu
        // Stok, İrsaliye, Depo. Finans görmez.
        var depoPerms = new[]
        {
            Permissions.Stock.Read, Permissions.Stock.Transfer,
            Permissions.StockMovement.Create, Permissions.StockMovement.Read,
            Permissions.Item.Read, // Ürünleri görür
            Permissions.Warehouse.Read, Permissions.Warehouse.Update,
            Permissions.Order.Read, // Siparişleri görüp hazırlayabilir
            Permissions.Report.StockStatus // Stok durum raporu
        };
        await CreateRoleIfNotExists("مسئول انبار", "مدیریت موجودی و عملیات انبار", false, depoPerms);

        // 6. Satış Temsilcisi
        // Sipariş girer, Cari oluşturur. Fatura kesemez (Muhasebeye düşer), Tahsilat yapamaz (veya kısıtlı).
        var satisPerms = new[]
        {
            Permissions.Order.Create, Permissions.Order.Read, Permissions.Order.Update,
            Permissions.Contact.Create, Permissions.Contact.Read, Permissions.Contact.Update, // Müşteri yönetimi
            Permissions.Item.Read, Permissions.Stock.Read, // Ürün ve stok durumu
            Permissions.Report.StockStatus
        };
        await CreateRoleIfNotExists("کارشناس فروش", "ثبت سفارش و مدیریت طرف حساب", false, satisPerms);

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedUsersAsync(
        AppDbContext db,
        IPasswordHasher passwordHasher,
        int headquartersBranchId,
        List<int> branchIds,
        string demoPassword,
        CancellationToken ct)
    {
        var definitions = new[]
        {
            ("admin@demo.local", "رضا", "مدیر", "مدیر سامانه"),
            ("owner@demo.local", "علی", "رضایی", "مدیر کسب‌وکار"),
            ("chief@demo.local", "مریم", "محمدی", "سرپرست حسابداری"),
            ("accountant@demo.local", "محمد", "احمدی", "کارشناس حسابداری"),
            ("warehouse@demo.local", "حسن", "کریمی", "مسئول انبار"),
            ("sales@demo.local", "سارا", "حسینی", "کارشناس فروش")
        };
        foreach (var (email, first, last, roleName) in definitions)
        {
            if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == email, ct)) continue;
            var role = await db.Roles.FirstAsync(r => r.Name == roleName, ct);
            var user = new User
            {
                Email = email, FirstName = first, LastName = last,
                PasswordHash = passwordHasher.HashPassword(demoPassword),
                IsActive = true,
                BranchId = headquartersBranchId,
                CreatedAtUtc = DateTime.UtcNow
            };
            user.UserRoles.Add(new UserRole { RoleId = role.Id, CreatedAtUtc = DateTime.UtcNow });
            db.Users.Add(user);
        }
        await db.SaveChangesAsync(ct);
    }
}
