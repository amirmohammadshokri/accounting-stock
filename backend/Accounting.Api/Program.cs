using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Accounting.Api.Middleware;
using Accounting.Application.Common.Behaviors;
using Accounting.Application.Services;
using Accounting.Infrastructure;
using Accounting.Infrastructure.Persistence;
using Accounting.Infrastructure.Persistence.Seed;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Serilog;

PersianApiMessages.ConfigureValidation();
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<Accounting.Api.Services.LicenseService>();
builder.Services.AddScoped<Accounting.Application.Common.Interfaces.IListFilterContext, Accounting.Api.Services.HttpListFilterContext>();

// Serilog
builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration));

// Add services to the container.

// JSON'da parasal alanlar string ("1234.56") olarak gelebilir.
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.NumberHandling =
        System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle       
builder.Services.AddEndpointsApiExplorer();

// Swagger Security
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Accounting.Api", Version = "v1" });
    c.MapType<decimal>(() => new OpenApiSchema { Type = "string", Format = "decimal" });       
    c.MapType<decimal?>(() => new OpenApiSchema { Type = "string", Format = "decimal" });

    // JWT Support in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    var localized = PersianApiMessages.Status(context.ProblemDetails.Status ?? context.HttpContext.Response.StatusCode);
    context.ProblemDetails.Title = localized.Title;
    context.ProblemDetails.Detail = localized.Detail;
    context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
});
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState.Where(pair => pair.Value?.Errors.Count > 0)
            .ToDictionary(pair => pair.Key, pair => pair.Value!.Errors.Select(_ =>
                "مقدار این فیلد معتبر نیست؛ نوع، قالب و الزامی بودن آن را بررسی کنید.").ToArray());
        var problem = new ValidationProblemDetails(errors)
        {
            Status = 400, Title = "خطای اعتبارسنجی", Detail = "اطلاعات درخواست معتبر نیست.",
            Type = "about:blank"
        };
        problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        var result = new BadRequestObjectResult(problem);
        result.ContentTypes.Add("application/problem+json");
        return result;
    };
    foreach (var status in new[] { 400, 401, 403, 404, 405, 415 })
        options.ClientErrorMapping[status].Title = PersianApiMessages.Status(status).Title;
});

// Auth Configuration
// This local instance is only used to configure JwtBearerOptions below, which needs a
// concrete value at startup (not a DI-resolved IOptions<T>). The DI-visible
// IOptions<JwtSettings> (used by JwtTokenGenerator etc.) comes exclusively from
// services.Configure<JwtSettings>(...) in Accounting.Infrastructure/DependencyInjection.cs —
// there used to be a second, redundant registration here that bound the same section twice.
var jwtSettings = new Accounting.Infrastructure.Authentication.JwtSettings();
builder.Configuration.Bind(Accounting.Infrastructure.Authentication.JwtSettings.SectionName, jwtSettings);

if (string.IsNullOrWhiteSpace(jwtSettings.Secret) || jwtSettings.Secret.Length < 32)
{
    throw new InvalidOperationException(
        "کلید JwtSettings:Secret تنظیم نشده یا کمتر از ۳۲ نویسه است؛ آن را از طریق " +
        "متغیر محیطی JwtSettings__Secret یا تنظیمات خصوصی توسعه تنظیم کنید.");
}

builder.Services.AddAuthentication(defaultScheme: Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(jwtSettings.Secret))
        };
    });

// MediatR + FluentValidation
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Accounting.Application.Invoices.Commands.Create.CreateInvoiceCommand).Assembly));
builder.Services.AddValidatorsFromAssemblyContaining<Accounting.Application.Invoices.Commands.Create.CreateInvoiceValidator>();

// Pipeline Behaviors
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));    
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));   

// CORS
// Cors:AllowedOrigins in config (env var Cors__AllowedOrigins__0, __1, ...) so a real
// deployment can add its actual frontend origin without a code change. Falls back to the
// local dev ports when the section is absent.
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://localhost:4200"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", p => p
        .WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials() // Cookie based auth requires AllowCredentials
    );
});

// Infrastructure (DbContext vs.)
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();

builder.Services.AddRateLimiter(options=>
{
    options.RejectionStatusCode=429;
    options.AddPolicy("data-reset", context=>RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirst("id")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        _=>new FixedWindowRateLimiterOptions{PermitLimit=5,Window=TimeSpan.FromMinutes(5),QueueLimit=0}));
});
var app = builder.Build();

// Middleware pipeline
app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionToProblemDetailsMiddleware>();
app.UseStatusCodePages(async context =>
{
    var problem = PersianApiMessages.Status(context.HttpContext.Response.StatusCode);
    problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    await context.HttpContext.Response.WriteAsJsonAsync(problem,
        options: null, contentType: "application/problem+json",
        cancellationToken: context.HttpContext.RequestAborted);
});


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.RoutePrefix = "swagger";
        c.SwaggerEndpoint("v1/swagger.json", "Accounting.Api v1");
    });
}

app.UseHttpsRedirection();

app.UseRouting();

// CORS
app.UseCors("Frontend");

app.UseAuthentication();
app.UseMiddleware<SessionValidationMiddleware>();
app.UseMiddleware<DataMaintenanceMiddleware>();
app.UseRateLimiter();
app.UseMiddleware<LicenseMiddleware>();
app.UseAuthorization();
app.MapControllers().RequireAuthorization();

app.MapHealthChecks("/health");

// Startup only adds essentials by default; it never clears existing data.
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var mode=builder.Configuration["Seeding:Mode"] ?? "Raw";
    if(builder.Configuration.GetValue<bool?>("Seeding:Enabled")==false) mode="Raw";
    var invoiceBalances=scope.ServiceProvider.GetRequiredService<IInvoiceBalanceService>();
    var accountBalances=scope.ServiceProvider.GetRequiredService<IAccountBalanceService>();
    var hasher=scope.ServiceProvider.GetRequiredService<Accounting.Application.Common.Interfaces.IPasswordHasher>();
    await using var seedTransaction=await db.Database.BeginTransactionAsync();
    await StartupDataSeeder.InitializeAsync(db,invoiceBalances,accountBalances,hasher,mode,
        builder.Configuration["Seeding:AdminPassword"] ?? builder.Configuration["Seeding:DemoPassword"]
            ?? (app.Environment.IsDevelopment() ? "Demo1405!" : string.Empty));
    await seedTransaction.CommitAsync();
}

app.Run();

// Makes the top-level-statement Program class accessible to
// WebApplicationFactory<Program> in the integration test project.
public partial class Program { }
