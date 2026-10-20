extern alias ApiAssembly;
using System.Net;
using FluentValidation;
using System.Net.Http.Json;
using System.Text.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Accounting.Application.Common.Exceptions;
using Accounting.Application.Services;
using Accounting.Domain.Enums;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

Environment.SetEnvironmentVariable("ConnectionStrings__Default", "Server=unused;Database=unused;");
Environment.SetEnvironmentVariable("JwtSettings__Secret", "isolated-smoke-test-only-secret-32-characters");
Environment.SetEnvironmentVariable("JwtSettings__Issuer", "AccountingApi");
Environment.SetEnvironmentVariable("JwtSettings__Audience", "AccountingClient");
using var factory = new Factory();
using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
foreach (var format in new[] { "a4-landscape", "a4-portrait", "a5-portrait" })
{
    var response = await client.GetAsync("/api/invoice-print-layouts/" + format);
    if (response.StatusCode != HttpStatusCode.OK) throw new Exception(await response.Content.ReadAsStringAsync());
    var json = await response.Content.ReadFromJsonAsync<JsonElement>();
    if (json.GetProperty("layout").GetProperty("format").GetString() != format) throw new Exception("Wrong format");
    Console.WriteLine("PASS GET layout " + format);
}
foreach (var url in new[] { "/api/invoice-print-layouts/invalid", "/missing-endpoint" })
{
    var response = await client.GetAsync(url);
    var json = await response.Content.ReadFromJsonAsync<JsonElement>();
    if (!Persian(json.GetProperty("title").GetString()) || !Persian(json.GetProperty("detail").GetString())) throw new Exception("Non-Persian error");
    Console.WriteLine("PASS Persian error " + (int)response.StatusCode);
}
var invalid = await client.PutAsJsonAsync("/api/invoice-print-layouts/a4-landscape",
    new { layout = new { format = "a4-landscape", fontSize = 100, headerColor = "bad" }, version = "default" });
if (invalid.StatusCode != HttpStatusCode.BadRequest) throw new Exception("Expected validation");
var errors = (await invalid.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
foreach (var field in errors.EnumerateObject())
    foreach (var message in field.Value.EnumerateArray())
        if (!Persian(message.GetString())) throw new Exception("Non-Persian binding validation");
Console.WriteLine("PASS Persian model validation");
try { StockQuantityCalculator.ApplyMovement(0, StockMovementType.SalesOut, 1); throw new Exception("Expected shortage"); }
catch (BusinessRuleException ex) { if (ex.Message != "موجودی کالا کافی نیست.") throw; }
if (!Persian(new NotFoundException("Item", 1).Message)) throw new Exception("Not found not localized");
var validator = new FluentValidation.InlineValidator<string>();
validator.RuleFor(x => x).NotEmpty();
if (!Persian(validator.Validate("").Errors[0].ErrorMessage)) throw new Exception("Default validator not localized");
Console.WriteLine("PASS stock, missing resource and default validation");
static bool Persian(string? value) => value?.Any(c => c >= 'ا' && c <= 'ی') == true;

sealed class Factory : WebApplicationFactory<ApiAssembly::Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "Smoke";
                options.DefaultChallengeScheme = "Smoke";
            }).AddScheme<AuthenticationSchemeOptions, SmokeAuth>("Smoke", _ => {});
        });
    }
}
sealed class SmokeAuth(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync() =>
        Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity(new[] {
                new Claim(ClaimTypes.NameIdentifier, "1"), new Claim(ClaimTypes.Role, "Admin"),
                new Claim("permission", "CompanySettings.Read"), new Claim("permission", "CompanySettings.Update")
            }, Scheme.Name)), Scheme.Name)));
}
