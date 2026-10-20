using Accounting.Application.Common.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Accounting.Api.Middleware;

public sealed class ExceptionToProblemDetailsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionToProblemDetailsMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionToProblemDetailsMiddleware(
        RequestDelegate next,
        ILogger<ExceptionToProblemDetailsMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task Invoke(HttpContext context)
    {
        var ct = context.RequestAborted;

        try
        {
            await _next(context);
        }
        catch (ValidationException vex)
        {
            // FluentValidation -> 400 + ProblemDetails
            var errors = vex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            var pd = new ProblemDetails
            {
                Title = "خطای اعتبارسنجی",
                Status = StatusCodes.Status400BadRequest,
                Detail = vex.Errors.Any() ? "اطلاعات درخواست معتبر نیست." : vex.Message
            };
            pd.Extensions["errors"] = errors;
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/problem+json";

            await JsonSerializer.SerializeAsync(
                context.Response.Body,
                pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase },
                cancellationToken: ct
            );
        }
        catch (NotFoundException nfex)
        {
            // Domain NotFoundException -> 404 + ProblemDetails
            var pd = new ProblemDetails
            {
                Title = "اطلاعات یافت نشد",
                Status = StatusCodes.Status404NotFound,
                Detail = nfex.Message
            };
            pd.Extensions["code"] = nfex.Code; // "not_found"
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/problem+json";

            await JsonSerializer.SerializeAsync(
                context.Response.Body, pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase },
                cancellationToken: ct
            );
        }
        catch (KeyNotFoundException)
        {
            var pd = new ProblemDetails
            {
                Title = "یافت نشد",
                Status = StatusCodes.Status404NotFound,
                Detail = "اطلاعات درخواستی یافت نشد."
            };
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/problem+json";

            await JsonSerializer.SerializeAsync(
                context.Response.Body, pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase },
                cancellationToken: ct
            );
        }
        // 409 - Concurrency (bizim domain exception)
        catch (ConcurrencyConflictException cex)
        {
            var pd = new ProblemDetails
            {
                Title = "تداخل در ویرایش اطلاعات",
                Status = StatusCodes.Status409Conflict,
                Detail = cex.Message, // kullanıcı dostu mesaj
                Type = "about:blank"
            };
            pd.Extensions["code"] = cex.Code; // "concurrency_conflict"
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/problem+json";
            await JsonSerializer.SerializeAsync(context.Response.Body, pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }, ct);
            return;
        }
        // 422 - İş kuralı ihlali
        catch (BusinessRuleException brex)
        {
            var pd = new ProblemDetails
            {
                Title = "خطا در قواعد کسب‌وکار",
                Status = StatusCodes.Status422UnprocessableEntity,
                Detail = brex.Message,
                Type = "about:blank"
            };
            pd.Extensions["code"] = brex.Code; // "business_rule_violation"
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/problem+json";
            await JsonSerializer.SerializeAsync(context.Response.Body, pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }, ct);
            return;
        }
        catch (ForbiddenAccessException ex)
        {
            var problem=new ProblemDetails{Status=403,Title="دسترسی غیرمجاز",Detail=ex.Message,Type="about:blank"};
            problem.Extensions["code"]=ex.Code;problem.Extensions["traceId"]=context.TraceIdentifier;
            context.Response.StatusCode=403;
            await context.Response.WriteAsJsonAsync(problem,options:null,contentType:"application/problem+json",cancellationToken:ct);
        }
        catch (UnauthorizedAccessException)
        {
            var pd = new ProblemDetails
            {
                Title = "دسترسی غیرمجاز",
                Status = StatusCodes.Status401Unauthorized,
                Detail = "برای دسترسی به این بخش، ابتدا وارد حساب کاربری شوید.",
                Type = "about:blank"
            };
            pd.Extensions["code"] = "unauthorized";
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/problem+json";
            await JsonSerializer.SerializeAsync(context.Response.Body, pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }, ct);
            return;
        }
        // 409 - EF concurrency doğrudan gelirse (fallback)
        catch (DbUpdateConcurrencyException)
        {
            var pd = new ProblemDetails
            {
                Title = "تداخل در ویرایش اطلاعات",
                Status = StatusCodes.Status409Conflict,
                Detail = "رکورد توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه‌سازی کنید و دوباره تلاش کنید."
            };
            pd.Extensions["code"] = "concurrency_conflict";
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/problem+json";
            await JsonSerializer.SerializeAsync(context.Response.Body, pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }, ct);
            return;
        }
        catch (Exception ex)
        {
            // Diğer her şey -> 500 + ProblemDetails
            _logger.LogError(ex, "Unhandled exception");

            var pd = new ProblemDetails
            {
                Title = "خطای داخلی سرور",
                Status = StatusCodes.Status500InternalServerError,
                Detail = "خطایی در پردازش درخواست رخ داد؛ دوباره تلاش کنید."
            };
            pd.Extensions["traceId"] = context.TraceIdentifier;

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";

            await JsonSerializer.SerializeAsync(
                context.Response.Body,
                pd,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );
        }
    }
}
