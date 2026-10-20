using Accounting.Application.Common.Exceptions;
using Accounting.Application.CompanySettings.Commands.Update;
using Accounting.Application.CompanySettings.Queries.Get;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.CompanySettings.Commands.Update;
using Accounting.Application.CompanySettings.Queries.Get;
using Accounting.Domain.Entities;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Accounting.Tests.Common;

namespace Accounting.Tests;

public class CompanySettingsTests
{
    private readonly DbContextOptions<AppDbContext> _options;

    public CompanySettingsTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task Get_ShouldReturnDefaultOrSeeded()
    {
        var userService = new FakeCurrentUserService(1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using (var db = new AppDbContext(_options, audit, userService))
        {
            // Seed
            db.CompanySettings.Add(new CompanySettings { Title = "Test Corp", TaxNumber = "111" });
            await db.SaveChangesAsync();

            var handler = new GetCompanySettingsHandler(db);
            var query = new GetCompanySettingsQuery();

            var result = await handler.Handle(query, CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("Test Corp", result.Title);
            Assert.Equal("111", result.TaxNumber);
        }
    }

    [Fact]
    public async Task Update_ShouldUpdateFields_WhenValid()
    {
        var userService = new FakeCurrentUserService(1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using (var db = new AppDbContext(_options, audit, userService))
        {
            var entity = new CompanySettings 
            { 
                Title = "Old Name", 
                RowVersion = new byte[] { 1 } 
            };
            db.CompanySettings.Add(entity);
            await db.SaveChangesAsync();

            var handler = new UpdateCompanySettingsHandler(db);
            var rv = Convert.ToBase64String(entity.RowVersion);
            
            var cmd = new UpdateCompanySettingsCommand(
                entity.Id,
                "New Name",
                "9999",
                "TaxOffice",
                "Address",
                "555",
                "test@mail.com",
                "www.test.com",
                "123",
                "456",
                "logo.png",
                rv
            );

            var result = await handler.Handle(cmd, CancellationToken.None);

            Assert.Equal("New Name", result.Title);
            Assert.Equal("9999", result.TaxNumber);
            
            var dbEntity = await db.CompanySettings.FindAsync(entity.Id);
            Assert.Equal("New Name", dbEntity.Title);
            
            // In Memory DB doesn't auto-update RowVersion, so we skip this check
            // Assert.False(dbEntity.RowVersion.SequenceEqual(new byte[] { 1 }));
        }
    }

    [Fact]
    public async Task Update_ShouldThrowConcurrency_WhenVersionMismatch()
    {
        var userService = new FakeCurrentUserService(1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using (var db = new AppDbContext(_options, audit, userService))
        {
            var entity = new CompanySettings 
            { 
                Title = "Original", 
                RowVersion = new byte[] { 1 } 
            };
            db.CompanySettings.Add(entity);
            await db.SaveChangesAsync();

            var handler = new UpdateCompanySettingsHandler(db);
            // Send WRONG RowVersion
            var rv = Convert.ToBase64String(new byte[] { 2 });
            
            var cmd = new UpdateCompanySettingsCommand(
                entity.Id,
                "Hacker Update",
                null, null, null, null, null, null, null, null, null,
                rv
            );

            await Assert.ThrowsAsync<ConcurrencyConflictException>(() => handler.Handle(cmd, CancellationToken.None));
        }
    }

    [Fact]
    public async Task Update_ShouldThrowValidation_WhenTaxNumberIsEmpty()
    {
        var userService = new FakeCurrentUserService(1);
        var audit = new AuditSaveChangesInterceptor(userService);
        using (var db = new AppDbContext(_options, audit, userService))
        {
            var entity = new CompanySettings { Title = "Valid", TaxNumber = "123" };
            db.CompanySettings.Add(entity);
            await db.SaveChangesAsync();

            var handler = new UpdateCompanySettingsHandler(db);
            var validator = new UpdateCompanySettingsValidator();
            var rv = Convert.ToBase64String(entity.RowVersion);

            var cmd = new UpdateCompanySettingsCommand(
                entity.Id,
                "New Title",
                "", // Empty Tax Number
                "Office", "Addr", "555", "mail@mail.com", "site.com", "1", "2", "logo", 
                rv
            );

            var result = await validator.ValidateAsync(cmd);
            Assert.False(result.IsValid);
            Assert.Contains(result.Errors, x => x.PropertyName == "TaxNumber");
        }
    }
}
