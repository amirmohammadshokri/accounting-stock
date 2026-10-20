using Accounting.Application.Common.Abstractions;
using Accounting.Application.Services;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Accounting.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration config)
    {
        services.AddSingleton<Accounting.Infrastructure.Maintenance.DataMaintenanceGate>();
        services.AddScoped<Accounting.Infrastructure.Maintenance.DataMaintenanceService>();
        var conn = config.GetConnectionString("Default")!;
        services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(conn));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddScoped<AuditSaveChangesInterceptor>();
        services.AddSingleton<Accounting.Application.Invoices.Queries.Print.IInvoicePdfService,
            Accounting.Infrastructure.Reporting.StimulsoftInvoicePdfService>();

        services.AddSingleton<Accounting.Infrastructure.Reporting.InvoiceMrtStore>();
        services.AddSingleton<Accounting.Application.Invoices.Queries.Print.IInvoicePrintLayoutStore, Accounting.Infrastructure.Reporting.InvoicePrintLayoutStore>();
        services.AddScoped<IInvoiceBalanceService, InvoiceBalanceService>();
        services.AddScoped<IExcelService, Accounting.Application.Common.Services.ExcelService>();
        services.AddScoped<IAccountBalanceService, AccountBalanceService>();
        services.AddScoped<IContactBalanceService, ContactBalanceService>();
        services.AddScoped<IStockService, StockService>();
        services.AddScoped<MealPackageService>();
        services.AddScoped<OpeningBalanceService>();
        services.AddScoped<IInvoiceNumberService, InvoiceNumberService>();
        
        services.AddHttpContextAccessor();

        // Auth
        services.Configure<Accounting.Infrastructure.Authentication.JwtSettings>(config.GetSection(Accounting.Infrastructure.Authentication.JwtSettings.SectionName));
        services.AddOptions<Accounting.Application.Authentication.Common.SessionSettings>()
            .Bind(config.GetSection(Accounting.Application.Authentication.Common.SessionSettings.SectionName))
            .Validate(s => s.AbsoluteTimeoutSeconds is > 0 and <= 31536000
                && s.IdleTimeoutSeconds is > 0 and <= 31536000,
                "Session timeout values must be between 1 and 31536000 seconds.")
            .ValidateOnStart();
        services.AddSingleton<Accounting.Application.Authentication.Common.ISessionPolicy, Accounting.Infrastructure.Authentication.SessionPolicy>();
        services.AddScoped<Accounting.Application.Authentication.Common.IUserSessionStore, Accounting.Infrastructure.Authentication.UserSessionStore>();
        services.AddSingleton<Accounting.Application.Common.Interfaces.IJwtTokenGenerator, Accounting.Infrastructure.Authentication.JwtTokenGenerator>();
        services.AddSingleton<Accounting.Application.Common.Interfaces.IPasswordHasher, Accounting.Infrastructure.Authentication.PasswordHasher>();
        services.AddSingleton<Accounting.Application.Common.Interfaces.ICurrentUserService, Accounting.Infrastructure.Services.CurrentUserService>();

        // Dynamic Policy Registration
        services.AddAuthorization(options =>
        {
            foreach (var permission in Accounting.Domain.Constants.Permissions.GetAll())
            {
                options.AddPolicy(permission, policy => 
                    policy.RequireClaim("permission", permission));
            }
        });

        return services;
    }
}
