using Accounting.Application.Common.Interfaces;
namespace Accounting.Api.Services;
public sealed class HttpListFilterContext(IHttpContextAccessor accessor):IListFilterContext
{public string? Json=>accessor.HttpContext?.Request.Query["filters"].FirstOrDefault();}
